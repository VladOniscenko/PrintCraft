using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Models;

namespace PrintCraft.Features.Content.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CitiesController : ControllerBase
{
    private const string CitiesCacheKey = "catalog:cities:active";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    private readonly PrintCraftDb _db;
    private readonly IMemoryCache? _cache;

    public CitiesController(PrintCraftDb db, IMemoryCache? cache = null)
    {
        _db = db;
        _cache = cache;
    }

    /// <summary>
    /// Gets cities. By default returns active cities ordered by SortOrder then Name.
    /// Use ?all=true to retrieve all cities for administration.
    /// </summary>
    // Permission: Public Read
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? all, [FromQuery] string? province, CancellationToken cancellationToken = default)
    {
        if (all != true && string.IsNullOrEmpty(province) && _cache != null && _cache.TryGetValue(CitiesCacheKey, out List<City>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var query = _db.Cities.AsNoTracking();

        if (all != true)
        {
            query = query.Where(c => c.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(province))
        {
            query = query.Where(c => c.Province == province.Trim());
        }

        var cities = await query
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Slug)
            .ToListAsync(cancellationToken);

        foreach (var city in cities)
        {
            HydrateCityTranslations(city);
        }

        if (all != true && string.IsNullOrEmpty(province))
        {
            _cache?.Set(CitiesCacheKey, cities, CacheDuration);
        }

        return Ok(cities);
    }

    /// <summary>
    /// Gets a single city by its URL slug (e.g. "amsterdam") or GUID.
    /// </summary>
    // Permission: Public Read
    [HttpGet("{slugOrId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySlugOrId(string slugOrId, CancellationToken cancellationToken = default)
    {
        var normalized = slugOrId.Trim().ToLower();

        City? city = null;
        if (Guid.TryParse(normalized, out var guid))
        {
            city = await _db.Cities.AsNoTracking().FirstOrDefaultAsync(c => c.Id == guid, cancellationToken);
        }

        city ??= await _db.Cities.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == normalized, cancellationToken);

        if (city is null)
        {
            return NotFound(new { message = $"City '{slugOrId}' not found." });
        }

        HydrateCityTranslations(city);
        return Ok(city);
    }

    /// <summary>
    /// Creates a new city.
    /// </summary>
    // Permission: Admin Only
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] City city, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(city.Slug))
        {
            return BadRequest(new { message = "Slug is required." });
        }

        var normalizedSlug = city.Slug.Trim().ToLower().Replace(" ", "-");
        var slugExists = await _db.Cities.AnyAsync(c => c.Slug == normalizedSlug, cancellationToken);
        if (slugExists)
        {
            return Conflict(new { message = $"A city with slug '{normalizedSlug}' already exists." });
        }

        var now = DateTime.UtcNow;
        var newCity = new City
        {
            Id = city.Id == Guid.Empty ? Guid.NewGuid() : city.Id,
            Slug = normalizedSlug,
            Names = city.Names ?? new(),
            Province = city.Province?.Trim() ?? string.Empty,
            Latitude = city.Latitude,
            Longitude = city.Longitude,
            SortOrder = city.SortOrder,
            IsActive = city.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Cities.Add(newCity);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(CitiesCacheKey);

        return CreatedAtAction(nameof(GetBySlugOrId), new { slugOrId = newCity.Slug }, newCity);
    }

    /// <summary>
    /// Updates an existing city.
    /// </summary>
    // Permission: Admin Only
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] City request, CancellationToken cancellationToken = default)
    {
        var city = await _db.Cities.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (city is null)
        {
            return NotFound(new { message = "City not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.Slug))
        {
            var normalizedSlug = request.Slug.Trim().ToLower().Replace(" ", "-");
            if (city.Slug != normalizedSlug)
            {
                var slugExists = await _db.Cities.AnyAsync(c => c.Slug == normalizedSlug && c.Id != id, cancellationToken);
                if (slugExists)
                {
                    return Conflict(new { message = $"A city with slug '{normalizedSlug}' already exists." });
                }
                city.Slug = normalizedSlug;
            }
        }

        city.Names = request.Names ?? city.Names;
        city.Province = request.Province?.Trim() ?? city.Province;
        city.Latitude = request.Latitude;
        city.Longitude = request.Longitude;
        city.SortOrder = request.SortOrder;
        city.IsActive = request.IsActive;
        city.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(CitiesCacheKey);

        return Ok(city);
    }

    /// <summary>
    /// Deletes a city.
    /// </summary>
    // Permission: Admin Only
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var city = await _db.Cities.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (city is null)
        {
            return NotFound(new { message = "City not found." });
        }

        _db.Cities.Remove(city);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(CitiesCacheKey);

        return Ok(new { message = "City deleted successfully." });
    }

    /// <summary>
    /// Reseeds default cities.
    /// </summary>
    // Permission: Admin Only
    [HttpPost("seed")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Seed([FromQuery] bool forceReload = false)
    {
        var result = await CitySeeder.EnsureDatabaseSeededAsync(_db, forceReload);
        _cache?.Remove(CitiesCacheKey);
        return Ok(result);
    }

    private static readonly Lazy<List<City>> DefaultCities = new(CitySeeder.GetDefaultCities);

    private static void HydrateCityTranslations(City target)
    {
        var def = DefaultCities.Value.FirstOrDefault(d => d.Id == target.Id)
            ?? DefaultCities.Value.FirstOrDefault(d => string.Equals(d.Slug, target.Slug, StringComparison.OrdinalIgnoreCase));
        if (def == null) return;

        target.Names = MergeDict(target.Names, def.Names);
    }

    private static Dictionary<string, string> MergeDict(Dictionary<string, string>? target, Dictionary<string, string>? fallback)
    {
        var result = target == null
            ? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            : new Dictionary<string, string>(target, StringComparer.OrdinalIgnoreCase);

        if (fallback != null)
        {
            foreach (var (k, v) in fallback)
            {
                if (!result.TryGetValue(k, out var val) || string.IsNullOrWhiteSpace(val))
                {
                    result[k] = v;
                }
            }
        }

        return result;
    }
}
