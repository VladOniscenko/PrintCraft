using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PrintCraftApi.Data;
using PrintCraftApi.Models;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FaqController : ControllerBase
{
    private const string FaqCacheKey = "catalog:faq:active";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    private readonly PrintCraftDb _db;
    private readonly IMemoryCache? _cache;

    public FaqController(PrintCraftDb db, IMemoryCache? cache = null)
    {
        _db = db;
        _cache = cache;
    }

    /// <summary>
    /// Gets FAQ items. By default returns only active items sorted by SortOrder.
    /// Use ?all=true to retrieve all items including inactive ones for administration.
    /// </summary>
    // Permission: Public Read
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? all, [FromQuery] string? category, CancellationToken cancellationToken = default)
    {
        if (all != true && string.IsNullOrEmpty(category) && _cache != null && _cache.TryGetValue(FaqCacheKey, out List<FaqItem>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var query = _db.FaqItems.AsNoTracking();

        if (all != true)
        {
            query = query.Where(f => f.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(f => f.Category == category.Trim().ToLower());
        }

        var items = await query
            .OrderBy(f => f.SortOrder)
            .ThenBy(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        foreach (var item in items)
        {
            HydrateFaqTranslations(item);
        }

        if (all != true && string.IsNullOrEmpty(category))
        {
            _cache?.Set(FaqCacheKey, items, CacheDuration);
        }

        return Ok(items);
    }

    /// <summary>
    /// Gets a single FAQ item by ID.
    /// </summary>
    // Permission: Public Read
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await _db.FaqItems.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound(new { message = "FAQ item not found." });
        }
        HydrateFaqTranslations(item);
        return Ok(item);
    }

    /// <summary>
    /// Creates a new FAQ item.
    /// </summary>
    // Permission: Admin Only
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] FaqItem item, CancellationToken cancellationToken = default)
    {
        if (item.Question == null || item.Question.Count == 0 || item.Question.Values.All(string.IsNullOrWhiteSpace))
        {
            return BadRequest(new { message = "At least one question translation is required." });
        }

        if (item.Answer == null || item.Answer.Count == 0 || item.Answer.Values.All(string.IsNullOrWhiteSpace))
        {
            return BadRequest(new { message = "At least one answer translation is required." });
        }

        var now = DateTime.UtcNow;
        var newItem = new FaqItem
        {
            Id = item.Id == Guid.Empty ? Guid.NewGuid() : item.Id,
            Question = item.Question,
            Answer = item.Answer,
            Category = string.IsNullOrWhiteSpace(item.Category) ? "general" : item.Category.Trim().ToLower(),
            SortOrder = item.SortOrder,
            IsActive = item.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.FaqItems.Add(newItem);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(FaqCacheKey);

        return CreatedAtAction(nameof(GetById), new { id = newItem.Id }, newItem);
    }

    /// <summary>
    /// Updates an existing FAQ item.
    /// </summary>
    // Permission: Admin Only
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] FaqItem request, CancellationToken cancellationToken = default)
    {
        var item = await _db.FaqItems.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound(new { message = "FAQ item not found." });
        }

        if (request.Question != null && request.Question.Count > 0)
        {
            item.Question = request.Question;
        }

        if (request.Answer != null && request.Answer.Count > 0)
        {
            item.Answer = request.Answer;
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            item.Category = request.Category.Trim().ToLower();
        }

        item.SortOrder = request.SortOrder;
        item.IsActive = request.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(FaqCacheKey);

        return Ok(item);
    }

    /// <summary>
    /// Deletes an FAQ item.
    /// </summary>
    // Permission: Admin Only
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await _db.FaqItems.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (item is null)
        {
            return NotFound(new { message = "FAQ item not found." });
        }

        _db.FaqItems.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(FaqCacheKey);

        return Ok(new { message = "FAQ item deleted successfully." });
    }

    /// <summary>
    /// Reseeds default FAQ items.
    /// </summary>
    // Permission: Admin Only
    [HttpPost("seed")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Seed([FromQuery] bool forceReload = false)
    {
        var result = await FaqItemSeeder.EnsureDatabaseSeededAsync(_db, forceReload);
        _cache?.Remove(FaqCacheKey);
        return Ok(result);
    }

    private static readonly Lazy<List<FaqItem>> DefaultFaqs = new(FaqItemSeeder.GetDefaultFaqItems);

    private static void HydrateFaqTranslations(FaqItem target)
    {
        var def = DefaultFaqs.Value.FirstOrDefault(d => d.Id == target.Id);
        if (def == null) return;

        target.Question = MergeDict(target.Question, def.Question);
        target.Answer = MergeDict(target.Answer, def.Answer);
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
