using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private const string DefaultCategoryFilter = "all";
    private const string DefaultSortBy = "newest";
    private const string DefaultSortDirection = "desc";
    private const int MaxPageSize = 100;
    private const int MinPageSize = 1;

    private static readonly HashSet<string> AllowedSortBy = new(StringComparer.OrdinalIgnoreCase)
    {
        "newest",
        "name",
        "price",
        "category",
        "discount",
    };

    private static readonly HashSet<string> AllowedProductTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "print",
        "filament",
        "other",
    };

    private readonly PrintCraftDb _db;
    private readonly IWebHostEnvironment _env;

    public ProductsController(PrintCraftDb db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category,
        [FromQuery] string? productType,
        [FromQuery] string? q,
        [FromQuery] bool discountedOnly = false,
        [FromQuery] bool inStockOnly = false,
        [FromQuery] double? minPrice = null,
        [FromQuery] double? maxPrice = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDir = null,
        [FromQuery] int? limit = null,
        [FromQuery] bool includeInactive = false)
    {
        if (includeInactive && !User.IsInRole("admin"))
            return Forbid();

        var query = _db.Products
            .Include(p => p.Images)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(category) && !string.Equals(category, DefaultCategoryFilter, StringComparison.OrdinalIgnoreCase) && !string.Equals(category, "All", StringComparison.OrdinalIgnoreCase))
        {
            var normalizedCategory = category.Trim();
            query = query.Where(p => p.Category == normalizedCategory);
        }

        if (!string.IsNullOrWhiteSpace(productType))
        {
            var normalizedType = NormalizeProductType(productType);
            if (!AllowedProductTypes.Contains(normalizedType))
                return BadRequest(new { message = $"Unsupported productType '{productType}'." });

            query = query.Where(p => p.ProductType == normalizedType);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term)
                || p.Category.ToLower().Contains(term)
                || p.ProductType.ToLower().Contains(term)
                || p.Description.ToLower().Contains(term));
        }

        if (discountedOnly)
        {
            query = query.Where(p => p.DiscountPercentage > 0);
        }

        if (inStockOnly)
        {
            query = query.Where(p => !p.TrackInventory || p.StockQuantity > 0);
        }

        if (minPrice.HasValue)
        {
            var minimum = minPrice.Value;
            query = query.Where(p => (p.Price * (1 - (p.DiscountPercentage / 100.0))) >= minimum);
        }

        if (maxPrice.HasValue)
        {
            var maximum = maxPrice.Value;
            query = query.Where(p => (p.Price * (1 - (p.DiscountPercentage / 100.0))) <= maximum);
        }

        var normalizedSortBy = string.IsNullOrWhiteSpace(sortBy) ? DefaultSortBy : sortBy.Trim().ToLowerInvariant();
        if (!AllowedSortBy.Contains(normalizedSortBy))
            return BadRequest(new { message = $"Unsupported sortBy '{sortBy}'." });

        var descending = string.Equals(sortDir, DefaultSortDirection, StringComparison.OrdinalIgnoreCase);

        query = normalizedSortBy switch
        {
            "name" => descending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "price" => descending
                ? query.OrderByDescending(p => p.Price * (1 - (p.DiscountPercentage / 100.0)))
                : query.OrderBy(p => p.Price * (1 - (p.DiscountPercentage / 100.0))),
            "category" => descending ? query.OrderByDescending(p => p.Category) : query.OrderBy(p => p.Category),
            "discount" => descending ? query.OrderByDescending(p => p.DiscountPercentage) : query.OrderBy(p => p.DiscountPercentage),
            _ => descending ? query.OrderByDescending(p => p.Id) : query.OrderBy(p => p.Id),
        };

        if (limit.HasValue)
        {
            var pageSize = Math.Clamp(limit.Value, MinPageSize, MaxPageSize);
            query = query.Take(pageSize);
        }

        var products = await query.ToListAsync();
        return Ok(products.Select(ToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById([FromRoute] Guid id, [FromQuery] bool includeInactive = false)
    {
        if (includeInactive && !User.IsInRole("admin"))
            return Forbid();

        var product = await _db.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null || (!includeInactive && !product.IsActive))
            return NotFound(new { message = "Product not found." });

        return Ok(ToResponse(product));
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories([FromQuery] bool includeInactive = false)
    {
        if (includeInactive && !User.IsInRole("admin"))
            return Forbid();

        var categories = await _db.Products
            .Where(p => includeInactive || p.IsActive)
            .Where(p => !string.IsNullOrWhiteSpace(p.Category))
            .Select(p => p.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return Ok(categories);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] UpsertProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Category))
            return BadRequest(new { message = "Name and category are required." });

        if (request.Price < 0)
            return BadRequest(new { message = "Price cannot be negative." });

        if (request.StockQuantity < 0)
            return BadRequest(new { message = "Stock quantity cannot be negative." });

        if (request.DiscountPercentage < ProductPricing.MinDiscountPercentage || request.DiscountPercentage > ProductPricing.MaxDiscountPercentage)
            return BadRequest(new
            {
                message = $"Discount must be between {ProductPricing.MinDiscountPercentage} and {ProductPricing.MaxDiscountPercentage}."
            });

        var normalizedType = NormalizeProductType(request.ProductType);
        if (!AllowedProductTypes.Contains(normalizedType))
            return BadRequest(new { message = $"Unsupported product type '{request.ProductType}'." });

        var imageUrls = BuildNormalizedImageList(request.ImageUrl, request.Images);

        var product = new Product
        {
            Name = request.Name.Trim(),
            Description = (request.Description ?? string.Empty).Trim(),
            ProductType = normalizedType,
            Category = request.Category.Trim(),
            ImageUrl = imageUrls.FirstOrDefault() ?? string.Empty,
            FileUrl = (request.FileUrl ?? string.Empty).Trim(),
            Price = request.Price,
            DiscountPercentage = ProductPricing.ClampDiscount(request.DiscountPercentage),
            IsActive = request.IsActive,
            TrackInventory = request.TrackInventory,
            StockQuantity = request.TrackInventory ? request.StockQuantity : 0,
            Images = imageUrls.Select((url, index) => new ProductImage
            {
                Url = url,
                SortOrder = index,
            }).ToList(),
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, ToResponse(product));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpsertProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Category))
            return BadRequest(new { message = "Name and category are required." });

        if (request.Price < 0)
            return BadRequest(new { message = "Price cannot be negative." });

        if (request.StockQuantity < 0)
            return BadRequest(new { message = "Stock quantity cannot be negative." });

        if (request.DiscountPercentage < ProductPricing.MinDiscountPercentage || request.DiscountPercentage > ProductPricing.MaxDiscountPercentage)
            return BadRequest(new
            {
                message = $"Discount must be between {ProductPricing.MinDiscountPercentage} and {ProductPricing.MaxDiscountPercentage}."
            });

        var normalizedType = NormalizeProductType(request.ProductType);
        if (!AllowedProductTypes.Contains(normalizedType))
            return BadRequest(new { message = $"Unsupported product type '{request.ProductType}'." });

        var imageUrls = BuildNormalizedImageList(request.ImageUrl, request.Images);

        var existing = await _db.Products
            .FirstOrDefaultAsync(p => p.Id == id);
        if (existing == null) return NotFound();

        existing.Name = request.Name.Trim();
        existing.Description = (request.Description ?? string.Empty).Trim();
        existing.ProductType = normalizedType;
        existing.Category = request.Category.Trim();
        existing.ImageUrl = imageUrls.FirstOrDefault() ?? string.Empty;
        existing.FileUrl = (request.FileUrl ?? string.Empty).Trim();
        existing.Price = request.Price;
        existing.DiscountPercentage = ProductPricing.ClampDiscount(request.DiscountPercentage);
        existing.IsActive = request.IsActive;
        existing.TrackInventory = request.TrackInventory;
        existing.StockQuantity = request.TrackInventory ? request.StockQuantity : 0;

        try
        {
            await _db.ProductImages
                .Where(pi => pi.ProductId == existing.Id)
                .ExecuteDeleteAsync();

            var replacementImages = imageUrls.Select((url, index) => new ProductImage
            {
                ProductId = existing.Id,
                Url = url,
                SortOrder = index,
            }).ToList();

            if (replacementImages.Count > 0)
            {
                _db.ProductImages.AddRange(replacementImages);
            }

            await _db.SaveChangesAsync();

            var refreshed = await _db.Products
                .Include(p => p.Images)
                .FirstAsync(p => p.Id == existing.Id);

            return Ok(ToResponse(refreshed));
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { message = "Product was changed by another request. Reload and try again." });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var existing = await _db.Products.FindAsync(id);
        if (existing == null) return NotFound();

        DeleteLocalFileIfExists(existing.ImageUrl);
        DeleteLocalFileIfExists(existing.FileUrl);

        var imageUrls = await _db.ProductImages
            .Where(pi => pi.ProductId == existing.Id)
            .Select(pi => pi.Url)
            .ToListAsync();

        foreach (var imageUrl in imageUrls)
        {
            DeleteLocalFileIfExists(imageUrl);
        }

        _db.Products.Remove(existing);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static string NormalizeProductType(string? productType)
    {
        if (string.IsNullOrWhiteSpace(productType)) return "print";
        return productType.Trim().ToLowerInvariant();
    }

    private static List<string> BuildNormalizedImageList(string? imageUrl, List<string>? images)
    {
        var values = new List<string>();

        if (!string.IsNullOrWhiteSpace(imageUrl))
            values.Add(imageUrl.Trim());

        if (images != null)
        {
            values.AddRange(images
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Select(url => url.Trim()));
        }

        return values
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private ProductResponse ToResponse(Product product)
    {
        var finalPrice = ProductPricing.EffectivePrice(product.Price, product.DiscountPercentage);
        var originalPrice = decimal.Round((decimal)Math.Max(0, product.Price), 2, MidpointRounding.AwayFromZero);

        var orderedImages = product.Images
            .OrderBy(img => img.SortOrder)
            .Select(img => img.Url)
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .ToList();

        if (!string.IsNullOrWhiteSpace(product.ImageUrl)
            && !orderedImages.Any(url => string.Equals(url, product.ImageUrl, StringComparison.OrdinalIgnoreCase)))
        {
            orderedImages.Insert(0, product.ImageUrl);
        }

        return new ProductResponse(
            product.Id,
            product.Name,
            product.Description,
            product.ProductType,
            product.Category,
            product.ImageUrl,
            product.FileUrl,
            (double)finalPrice,
            (double)originalPrice,
            ProductPricing.ClampDiscount(product.DiscountPercentage),
            ProductPricing.ClampDiscount(product.DiscountPercentage) > 0,
            product.IsActive,
            product.TrackInventory,
            product.StockQuantity,
            !product.TrackInventory || product.StockQuantity > 0,
            orderedImages
        );
    }

    private void DeleteLocalFileIfExists(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return;
        if (_env.WebRootPath == null) return;

        var normalized = url.Trim();
        if (Uri.TryCreate(normalized, UriKind.Absolute, out var absoluteUri))
        {
            normalized = absoluteUri.AbsolutePath;
        }

        normalized = normalized.Replace('\\', '/');
        if (!normalized.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)) return;

        var fileName = Path.GetFileName(normalized);
        if (string.IsNullOrWhiteSpace(fileName)) return;
        if (fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0) return;

        var uploadsRoot = Path.GetFullPath(Path.Combine(_env.WebRootPath, "uploads"));
        var fullPath = Path.GetFullPath(Path.Combine(uploadsRoot, fileName));

        if (!fullPath.StartsWith(uploadsRoot + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            return;

        if (System.IO.File.Exists(fullPath))
        {
            System.IO.File.Delete(fullPath);
        }
    }
}

public record UpsertProductRequest(
    string Name,
    string Category,
    string? ProductType,
    string? Description,
    string? ImageUrl,
    List<string>? Images,
    string? FileUrl,
    double Price,
    double DiscountPercentage,
    bool IsActive = true,
    bool TrackInventory = false,
    int StockQuantity = 0
);

public record ProductResponse(
    Guid Id,
    string Name,
    string Description,
    string ProductType,
    string Category,
    string ImageUrl,
    string FileUrl,
    double Price,
    double OriginalPrice,
    double DiscountPercentage,
    bool HasDiscount,
    bool IsActive,
    bool TrackInventory,
    int StockQuantity,
    bool InStock,
    List<string> Images
);
