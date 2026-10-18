using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PrintCraftApi.Data;
using PrintCraftApi.Models;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/hero-slides")]
public class HeroSlidesController : ControllerBase
{
    private const string ActiveSlidesCacheKey = "catalog:hero-slides:active";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    private readonly PrintCraftDb _db;
    private readonly IWebHostEnvironment? _env;
    private readonly IMemoryCache? _cache;

    public HeroSlidesController(PrintCraftDb db, IWebHostEnvironment? env = null, IMemoryCache? cache = null)
    {
        _db = db;
        _env = env;
        _cache = cache;
    }

    /// <summary>
    /// Public endpoint returning active slides sorted by SortOrder.
    /// </summary>
    // Permission: Public Read
    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActive(CancellationToken cancellationToken = default)
    {
        if (_cache != null && _cache.TryGetValue(ActiveSlidesCacheKey, out List<HeroSlide>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var activeSlides = await _db.HeroSlides
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        _cache?.Set(ActiveSlidesCacheKey, activeSlides, CacheDuration);
        return Ok(activeSlides);
    }

    /// <summary>
    /// Public endpoint returning slides sorted by SortOrder.
    /// Supports ?activeOnly=true/false and ?all=true
    /// </summary>
    // Permission: Public Read
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly, [FromQuery] bool? all, CancellationToken cancellationToken = default)
    {
        var query = _db.HeroSlides.AsNoTracking();

        if (activeOnly == true || (all != true && activeOnly != false))
        {
            query = query.Where(s => s.IsActive);
        }

        var slides = await query
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(slides);
    }

    /// <summary>
    /// Gets a single hero slide by Id.
    /// </summary>
    // Permission: Public Read
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var slide = await _db.HeroSlides
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (slide is null)
        {
            return NotFound(new { message = "Hero slide not found." });
        }

        return Ok(slide);
    }

    /// <summary>
    /// Creates a new hero slide.
    /// </summary>
    // Permission: Admin Only
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] HeroSlide slide, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(slide.Title))
        {
            return BadRequest(new { message = "Title is required." });
        }

        if (string.IsNullOrWhiteSpace(slide.MediaUrl))
        {
            return BadRequest(new { message = "MediaUrl is required." });
        }

        if (!string.IsNullOrWhiteSpace(slide.MediaType) && !HeroMediaType.IsValid(slide.MediaType))
        {
            return BadRequest(new { message = "MediaType must be either 'image' or 'model3d'." });
        }

        var now = DateTime.UtcNow;
        var newSlide = new HeroSlide
        {
            Id = slide.Id == Guid.Empty ? Guid.NewGuid() : slide.Id,
            Title = slide.Title.Trim(),
            Subtext = slide.Subtext?.Trim() ?? string.Empty,
            PriceText = slide.PriceText?.Trim() ?? string.Empty,
            MediaUrl = slide.MediaUrl.Trim(),
            MediaType = HeroMediaType.Normalize(slide.MediaType),
            InstructionTooltip = slide.InstructionTooltip?.Trim(),
            TitleNl = slide.TitleNl?.Trim(),
            SubtextNl = slide.SubtextNl?.Trim(),
            PriceTextNl = slide.PriceTextNl?.Trim(),
            InstructionTooltipNl = slide.InstructionTooltipNl?.Trim(),
            IsActive = slide.IsActive,
            SortOrder = slide.SortOrder,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.HeroSlides.Add(newSlide);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(ActiveSlidesCacheKey);

        return CreatedAtAction(nameof(GetById), new { id = newSlide.Id }, newSlide);
    }

    /// <summary>
    /// Updates an existing hero slide.
    /// </summary>
    // Permission: Admin Only
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] HeroSlide request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { message = "Title is required." });
        }

        if (string.IsNullOrWhiteSpace(request.MediaUrl))
        {
            return BadRequest(new { message = "MediaUrl is required." });
        }

        if (!string.IsNullOrWhiteSpace(request.MediaType) && !HeroMediaType.IsValid(request.MediaType))
        {
            return BadRequest(new { message = "MediaType must be either 'image' or 'model3d'." });
        }

        var existing = await _db.HeroSlides.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (existing is null)
        {
            return NotFound(new { message = "Hero slide not found." });
        }

        existing.Title = request.Title.Trim();
        existing.Subtext = request.Subtext?.Trim() ?? string.Empty;
        existing.PriceText = request.PriceText?.Trim() ?? string.Empty;
        existing.MediaUrl = request.MediaUrl.Trim();
        existing.MediaType = HeroMediaType.Normalize(request.MediaType);
        existing.InstructionTooltip = request.InstructionTooltip?.Trim();
        existing.TitleNl = request.TitleNl?.Trim();
        existing.SubtextNl = request.SubtextNl?.Trim();
        existing.PriceTextNl = request.PriceTextNl?.Trim();
        existing.InstructionTooltipNl = request.InstructionTooltipNl?.Trim();
        existing.IsActive = request.IsActive;
        existing.SortOrder = request.SortOrder;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(ActiveSlidesCacheKey);

        return Ok(existing);
    }

    /// <summary>
    /// Deletes a hero slide.
    /// </summary>
    // Permission: Admin Only
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await _db.HeroSlides.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (existing is null)
        {
            return NotFound(new { message = "Hero slide not found." });
        }

        _db.HeroSlides.Remove(existing);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(ActiveSlidesCacheKey);

        return NoContent();
    }

    /// <summary>
    /// Reseeds default hero slides and ensures all seed files exist on disk.
    /// </summary>
    // Permission: Admin Only
    [HttpPost("seed-defaults")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> SeedDefaults(CancellationToken cancellationToken = default)
    {
        HeroSlideSeeder.EnsureSeedAssets(_env?.WebRootPath, _env?.ContentRootPath);

        var defaults = HeroSlideSeeder.GetDefaultSlides();
        var existingIds = await _db.HeroSlides.Select(s => s.Id).ToListAsync(cancellationToken);

        foreach (var def in defaults)
        {
            if (!existingIds.Contains(def.Id))
            {
                _db.HeroSlides.Add(def);
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(ActiveSlidesCacheKey);

        var allSlides = await _db.HeroSlides
            .AsNoTracking()
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(allSlides);
    }

    /// <summary>
    /// Uploads a media file (3D model or image) specifically for hero slides.
    /// </summary>
    // Permission: Admin Only
    [HttpPost("upload")]
    [RequestSizeLimit(50 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 50 * 1024 * 1024)]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Upload([FromForm] IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded." });
        }

        const long maxBytes = 50 * 1024 * 1024; // 50MB
        if (file.Length > maxBytes)
        {
            return BadRequest(new { message = "File is too large. Maximum size is 50 MB." });
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var modelExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".stl", ".obj", ".3mf", ".step", ".stp"
        };
        var imageExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"
        };

        if (!modelExtensions.Contains(ext) && !imageExtensions.Contains(ext))
        {
            return BadRequest(new { message = "Unsupported file type. Supported types: STL, OBJ, 3MF, STEP, PNG, JPG, WEBP, SVG, GIF." });
        }

        var mediaType = modelExtensions.Contains(ext) ? HeroMediaType.Model3d : HeroMediaType.Image;

        var webRoot = _env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var heroDir = Path.Combine(webRoot, "uploads", "hero");
        var uploadsDir = Path.Combine(webRoot, "uploads");

        Directory.CreateDirectory(heroDir);
        Directory.CreateDirectory(uploadsDir);

        var originalCleanName = Path.GetFileNameWithoutExtension(file.FileName)
            .Replace(" ", "-")
            .Replace("_", "-");
        // Keep clean characters
        originalCleanName = string.Concat(originalCleanName.Where(c => char.IsLetterOrDigit(c) || c == '-'));
        if (string.IsNullOrWhiteSpace(originalCleanName))
        {
            originalCleanName = "hero-asset";
        }

        var uniquePrefix = Guid.NewGuid().ToString("N")[..8];
        var safeFileName = $"{uniquePrefix}-{originalCleanName}{ext}";
        var heroFilePath = Path.Combine(heroDir, safeFileName);
        var uploadFilePath = Path.Combine(uploadsDir, safeFileName);

        await using (var stream = new FileStream(heroFilePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Also duplicate to uploads root for direct accessibility
        try
        {
            System.IO.File.Copy(heroFilePath, uploadFilePath, true);
        }
        catch { }

        return Ok(new
        {
            url = $"/uploads/hero/{safeFileName}",
            fileName = safeFileName,
            mediaType,
            sizeBytes = file.Length
        });
    }

    /// <summary>
    /// Lists all candidate files (3D models and images) available in uploads.
    /// </summary>
    // Permission: Admin Only
    [HttpGet("files")]
    [Authorize(Roles = "admin")]
    public IActionResult GetAvailableFiles()
    {
        var webRoot = _env?.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "uploads");

        if (!Directory.Exists(uploadsDir))
        {
            return Ok(Array.Empty<object>());
        }

        var modelExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".stl", ".obj", ".3mf", ".step", ".stp"
        };
        var imageExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"
        };

        var allFiles = Directory
            .EnumerateFiles(uploadsDir, "*", SearchOption.AllDirectories)
            .Select(path => new FileInfo(path))
            .Where(info => !info.Name.EndsWith(".upload-meta.json", StringComparison.OrdinalIgnoreCase))
            .Where(info => modelExtensions.Contains(info.Extension) || imageExtensions.Contains(info.Extension))
            .OrderByDescending(info => info.LastWriteTimeUtc)
            .Select(info =>
            {
                var relPath = Path.GetRelativePath(uploadsDir, info.FullName).Replace('\\', '/');
                var isModel = modelExtensions.Contains(info.Extension);
                return new
                {
                    fileName = info.Name,
                    relativePath = relPath,
                    url = $"/uploads/{relPath}",
                    mediaType = isModel ? HeroMediaType.Model3d : HeroMediaType.Image,
                    extension = info.Extension.ToLowerInvariant(),
                    sizeBytes = info.Length,
                    lastModifiedUtc = info.LastWriteTimeUtc
                };
            })
            .ToArray();

        return Ok(allFiles);
    }
}

