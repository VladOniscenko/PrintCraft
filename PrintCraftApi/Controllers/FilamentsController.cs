using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PrintCraftApi.Data;
using PrintCraftApi.Models;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilamentsController : ControllerBase
{
    private const string FilamentsCacheKey = "catalog:filaments";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    public sealed class UpdateFilamentRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Material { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public decimal PricePerGram { get; set; }
        public int StockQuantity { get; set; }
    }

    private readonly PrintCraftDb _db;
    private readonly IMemoryCache? _cache;

    public FilamentsController(PrintCraftDb db, IMemoryCache? cache = null)
    {
        _db = db;
        _cache = cache;
    }

    // Permission: Public Read
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken = default)
    {
        if (_cache != null && _cache.TryGetValue(FilamentsCacheKey, out List<Filament>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var filaments = await _db.Filaments
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        _cache?.Set(FilamentsCacheKey, filaments, CacheDuration);
        return Ok(filaments);
    }

    // Permission: Admin Only
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] Filament filament, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(filament.Name) || string.IsNullOrWhiteSpace(filament.Material) || string.IsNullOrWhiteSpace(filament.Color))
            return BadRequest(new { message = "Name, material and color are required." });

        if (filament.PricePerGram < 0 || filament.StockQuantity < 0)
            return BadRequest(new { message = "Price and stock cannot be negative." });

        _db.Filaments.Add(filament);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(FilamentsCacheKey);
        return CreatedAtAction(nameof(GetAll), new { id = filament.Id }, filament);
    }

    // Permission: Admin Only
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateFilamentRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Material) || string.IsNullOrWhiteSpace(request.Color))
            return BadRequest(new { message = "Name, material and color are required." });

        if (request.PricePerGram < 0 || request.StockQuantity < 0)
            return BadRequest(new { message = "Price and stock cannot be negative." });

        var filament = await _db.Filaments.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (filament is null)
            return NotFound(new { message = "Filament not found." });

        filament.Name = request.Name.Trim();
        filament.Material = request.Material.Trim();
        filament.Color = request.Color.Trim();
        filament.PricePerGram = request.PricePerGram;
        filament.StockQuantity = request.StockQuantity;

        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(FilamentsCacheKey);
        return Ok(filament);
    }

    // Permission: Admin Only
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var filament = await _db.Filaments.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (filament is null)
            return NotFound(new { message = "Filament not found." });

        _db.Filaments.Remove(filament);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(FilamentsCacheKey);
        return NoContent();
    }
}
