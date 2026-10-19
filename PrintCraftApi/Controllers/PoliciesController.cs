using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PrintCraftApi.Data;
using PrintCraftApi.Models;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PoliciesController : ControllerBase
{
    private const string PoliciesCacheKey = "catalog:policies:active";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    private static readonly HashSet<string> SystemPolicySlugs = new(StringComparer.OrdinalIgnoreCase)
    {
        "privacy",
        "terms",
        "refunds",
        "shipping"
    };

    private readonly PrintCraftDb _db;
    private readonly IMemoryCache? _cache;

    public PoliciesController(PrintCraftDb db, IMemoryCache? cache = null)
    {
        _db = db;
        _cache = cache;
    }

    /// <summary>
    /// Gets all policies. By default returns active policies.
    /// Use ?all=true to retrieve all policies for admin management.
    /// </summary>
    // Permission: Public Read
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? all, CancellationToken cancellationToken = default)
    {
        if (all != true && _cache != null && _cache.TryGetValue(PoliciesCacheKey, out List<PolicyTemplate>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var query = _db.PolicyTemplates.AsNoTracking();

        if (all != true)
        {
            query = query.Where(p => p.IsActive);
        }

        var policies = await query
            .OrderBy(p => p.Slug)
            .ToListAsync(cancellationToken);

        if (all != true)
        {
            _cache?.Set(PoliciesCacheKey, policies, CacheDuration);
        }

        return Ok(policies);
    }

    /// <summary>
    /// Gets a single policy by URL slug (e.g. "privacy") or GUID.
    /// </summary>
    // Permission: Public Read
    [HttpGet("{slugOrId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBySlugOrId(string slugOrId, CancellationToken cancellationToken = default)
    {
        var normalized = slugOrId.Trim().ToLowerInvariant();

        PolicyTemplate? policy = null;
        if (Guid.TryParse(normalized, out var guid))
        {
            policy = await _db.PolicyTemplates.AsNoTracking().FirstOrDefaultAsync(p => p.Id == guid, cancellationToken);
        }

        policy ??= await _db.PolicyTemplates.AsNoTracking().FirstOrDefaultAsync(p => p.Slug.ToLower() == normalized, cancellationToken);

        if (policy is null)
        {
            return NotFound(new { message = $"Policy '{slugOrId}' not found." });
        }

        return Ok(policy);
    }

    /// <summary>
    /// Creates a new policy template.
    /// </summary>
    // Permission: Admin Only
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Create([FromBody] PolicyTemplate request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Slug))
        {
            return BadRequest(new { message = "Policy slug is required." });
        }

        var normalizedSlug = request.Slug.Trim().ToLowerInvariant().Replace(" ", "-");
        var slugExists = await _db.PolicyTemplates.AnyAsync(p => p.Slug.ToLower() == normalizedSlug, cancellationToken);
        if (slugExists)
        {
            return Conflict(new { message = $"A policy with slug '{normalizedSlug}' already exists." });
        }

        var now = DateTime.UtcNow;
        var newPolicy = new PolicyTemplate
        {
            Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id,
            Slug = normalizedSlug,
            Title = request.Title ?? new(),
            LastUpdated = request.LastUpdated ?? new(),
            Sections = request.Sections ?? new(),
            ContactTitle = request.ContactTitle ?? new(),
            ContactBody = request.ContactBody ?? new(),
            IsActive = request.IsActive,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.PolicyTemplates.Add(newPolicy);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(PoliciesCacheKey);

        return CreatedAtAction(nameof(GetBySlugOrId), new { slugOrId = newPolicy.Slug }, newPolicy);
    }

    /// <summary>
    /// Updates an existing policy template.
    /// </summary>
    // Permission: Admin Only
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PolicyTemplate request, CancellationToken cancellationToken = default)
    {
        var policy = await _db.PolicyTemplates.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (policy is null)
        {
            return NotFound(new { message = "Policy not found." });
        }

        if (!string.IsNullOrWhiteSpace(request.Slug))
        {
            var normalizedSlug = request.Slug.Trim().ToLowerInvariant().Replace(" ", "-");
            if (policy.Slug.ToLower() != normalizedSlug)
            {
                if (SystemPolicySlugs.Contains(policy.Slug))
                {
                    return BadRequest(new { message = $"Cannot rename core system policy slug '{policy.Slug}'." });
                }

                var slugExists = await _db.PolicyTemplates.AnyAsync(p => p.Slug.ToLower() == normalizedSlug && p.Id != id, cancellationToken);
                if (slugExists)
                {
                    return Conflict(new { message = $"A policy with slug '{normalizedSlug}' already exists." });
                }
                policy.Slug = normalizedSlug;
            }
        }

        policy.Title = request.Title ?? policy.Title;
        policy.LastUpdated = request.LastUpdated ?? policy.LastUpdated;
        policy.Sections = request.Sections ?? policy.Sections;
        policy.ContactTitle = request.ContactTitle ?? policy.ContactTitle;
        policy.ContactBody = request.ContactBody ?? policy.ContactBody;
        policy.IsActive = request.IsActive;
        policy.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(PoliciesCacheKey);

        return Ok(policy);
    }

    /// <summary>
    /// Deletes a policy template. Core system policies cannot be deleted.
    /// </summary>
    // Permission: Admin Only
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var policy = await _db.PolicyTemplates.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (policy is null)
        {
            return NotFound(new { message = "Policy not found." });
        }

        if (SystemPolicySlugs.Contains(policy.Slug))
        {
            return BadRequest(new { message = $"Core system policy '{policy.Slug}' cannot be deleted. You can edit its content or reset it to factory defaults." });
        }

        _db.PolicyTemplates.Remove(policy);
        await _db.SaveChangesAsync(cancellationToken);
        _cache?.Remove(PoliciesCacheKey);

        return Ok(new { message = "Policy deleted successfully." });
    }

    /// <summary>
    /// Reseeds default policy templates.
    /// </summary>
    // Permission: Admin Only
    [HttpPost("seed")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Seed([FromQuery] bool forceReload = false)
    {
        var result = await PolicyTemplateSeeder.EnsureDatabaseSeededAsync(_db, forceReload);
        _cache?.Remove(PoliciesCacheKey);
        return Ok(result);
    }
}

