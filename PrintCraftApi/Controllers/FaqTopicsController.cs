using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PrintCraftApi.Data;
using PrintCraftApi.Models;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/faq-topics")]
[Route("api/[controller]")]
public class FaqTopicsController : ControllerBase
{
    private const string TopicsCacheKey = "catalog:faq-topics:active";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    private readonly PrintCraftDb _db;
    private readonly IMemoryCache? _cache;

    public FaqTopicsController(PrintCraftDb db, IMemoryCache? cache = null)
    {
        _db = db;
        _cache = cache;
    }

    /// <summary>
    /// Gets FAQ topics / solutions. By default returns active topics ordered by SortOrder.
    /// Use ?all=true to retrieve all topics for administration.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? all, CancellationToken cancellationToken = default)
    {
        if (all != true && _cache != null && _cache.TryGetValue(TopicsCacheKey, out List<FaqTopic>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var query = _db.FaqTopics.AsNoTracking();

        if (all != true)
        {
            query = query.Where(t => t.IsActive);
        }

        var topics = await query
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        if (all != true)
        {
            _cache?.Set(TopicsCacheKey, topics, CacheDuration);
        }

        return Ok(topics);
    }

    /// <summary>
    /// Gets a single FAQ topic by its URL slug (e.g. "vervangende-onderdelen-printen") or GUID.
    /// </summary>
    [HttpGet("{slugOrId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySlugOrId(string slugOrId, CancellationToken cancellationToken = default)
    {
        var normalized = slugOrId.Trim().ToLower();

        FaqTopic? topic = null;
        if (Guid.TryParse(normalized, out var guid))
        {
            topic = await _db.FaqTopics.AsNoTracking().FirstOrDefaultAsync(t => t.Id == guid, cancellationToken);
        }

        topic ??= await _db.FaqTopics.AsNoTracking().FirstOrDefaultAsync(t => t.Slug == normalized, cancellationToken);

        if (topic is null)
        {
            return NotFound(new { message = $"FAQ topic '{slugOrId}' not found." });
        }

        return Ok(topic);
    }

    /// <summary>
    /// Creates a new FAQ topic / solution landing page.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] FaqTopic topic, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(topic.Slug))
        {
            return BadRequest(new { message = "Slug is required." });
        }

        var normalizedSlug = topic.Slug.Trim().ToLower().Replace(" ", "-");
        var slugExists = await _db.FaqTopics.AnyAsync(t => t.Slug == normalizedSlug, cancellationToken);
        if (slugExists)
        {
            return Conflict(new { message = $"An FAQ topic with slug '{normalizedSlug}' already exists." });
        }

        var now = DateTime.UtcNow;
        var newTopic = new FaqTopic
        {
            Id = topic.Id == Guid.Empty ? Guid.NewGuid() : topic.Id,
            Slug = normalizedSlug,
            Key = topic.Key?.Trim(),
            Names = topic.Names ?? new(),
            Tagline = topic.Tagline ?? new(),
            Badge = topic.Badge ?? new(),
            HeroTitle = topic.HeroTitle ?? new(),
            HeroSubtitle = topic.HeroSubtitle ?? new(),
            Description = topic.Description ?? new(),
            Benefits = topic.Benefits ?? new(),
            RecommendedMaterials = topic.RecommendedMaterials ?? new(),
            LeadTime = topic.LeadTime ?? string.Empty,
            Precision = topic.Precision ?? string.Empty,
            MetaTitle = topic.MetaTitle ?? new(),
            MetaDescription = topic.MetaDescription ?? new(),
            MetaKeywords = topic.MetaKeywords ?? new(),
            Faqs = topic.Faqs ?? new(),
            IsActive = topic.IsActive,
            SortOrder = topic.SortOrder,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.FaqTopics.Add(newTopic);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(TopicsCacheKey);

        return CreatedAtAction(nameof(GetBySlugOrId), new { slugOrId = newTopic.Slug }, newTopic);
    }

    /// <summary>
    /// Updates an existing FAQ topic.
    /// </summary>
    [HttpPut("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Update(Guid id, [FromBody] FaqTopic request, CancellationToken cancellationToken = default)
    {
        var topic = await _db.FaqTopics.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (topic is null)
        {
            return NotFound(new { message = "FAQ topic not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.Slug))
        {
            var normalizedSlug = request.Slug.Trim().ToLower().Replace(" ", "-");
            if (topic.Slug != normalizedSlug)
            {
                var slugExists = await _db.FaqTopics.AnyAsync(t => t.Slug == normalizedSlug && t.Id != id, cancellationToken);
                if (slugExists)
                {
                    return Conflict(new { message = $"An FAQ topic with slug '{normalizedSlug}' already exists." });
                }
                topic.Slug = normalizedSlug;
            }
        }

        topic.Key = request.Key?.Trim();
        topic.Names = request.Names ?? topic.Names;
        topic.Tagline = request.Tagline ?? topic.Tagline;
        topic.Badge = request.Badge ?? topic.Badge;
        topic.HeroTitle = request.HeroTitle ?? topic.HeroTitle;
        topic.HeroSubtitle = request.HeroSubtitle ?? topic.HeroSubtitle;
        topic.Description = request.Description ?? topic.Description;
        topic.Benefits = request.Benefits ?? topic.Benefits;
        topic.RecommendedMaterials = request.RecommendedMaterials ?? topic.RecommendedMaterials;
        topic.LeadTime = request.LeadTime ?? topic.LeadTime;
        topic.Precision = request.Precision ?? topic.Precision;
        topic.MetaTitle = request.MetaTitle ?? topic.MetaTitle;
        topic.MetaDescription = request.MetaDescription ?? topic.MetaDescription;
        topic.MetaKeywords = request.MetaKeywords ?? topic.MetaKeywords;
        topic.Faqs = request.Faqs ?? topic.Faqs;
        topic.SortOrder = request.SortOrder;
        topic.IsActive = request.IsActive;
        topic.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(TopicsCacheKey);

        return Ok(topic);
    }

    /// <summary>
    /// Deletes an FAQ topic.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var topic = await _db.FaqTopics.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (topic is null)
        {
            return NotFound(new { message = "FAQ topic not found." });
        }

        _db.FaqTopics.Remove(topic);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(TopicsCacheKey);

        return Ok(new { message = "FAQ topic deleted successfully." });
    }

    /// <summary>
    /// Reseeds default FAQ topics.
    /// </summary>
    [HttpPost("seed")]
    [AllowAnonymous]
    public async Task<IActionResult> Seed([FromQuery] bool forceReload = false)
    {
        var result = await FaqTopicSeeder.EnsureDatabaseSeededAsync(_db, forceReload);
        _cache?.Remove(TopicsCacheKey);
        return Ok(result);
    }
}
