using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;
using PrintCraftApi.Models;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/hero-slides")]
public class HeroSlidesController : ControllerBase
{
    private readonly PrintCraftDb _db;

    public HeroSlidesController(PrintCraftDb db)
    {
        _db = db;
    }

    /// <summary>
    /// Public endpoint returning active slides sorted by SortOrder.
    /// </summary>
    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActive()
    {
        var activeSlides = await _db.HeroSlides
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.CreatedAt)
            .ToListAsync();

        return Ok(activeSlides);
    }

    /// <summary>
    /// Public endpoint returning slides sorted by SortOrder.
    /// Supports ?activeOnly=true/false and ?all=true
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly, [FromQuery] bool? all)
    {
        var query = _db.HeroSlides.AsNoTracking();

        if (activeOnly == true || (all != true && activeOnly != false))
        {
            query = query.Where(s => s.IsActive);
        }

        var slides = await query
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.CreatedAt)
            .ToListAsync();

        return Ok(slides);
    }

    /// <summary>
    /// Gets a single hero slide by Id.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id)
    {
        var slide = await _db.HeroSlides
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (slide is null)
        {
            return NotFound(new { message = "Hero slide not found." });
        }

        return Ok(slide);
    }

    /// <summary>
    /// Creates a new hero slide.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] HeroSlide slide)
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
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = newSlide.Id }, newSlide);
    }

    /// <summary>
    /// Updates an existing hero slide.
    /// </summary>
    [HttpPut("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Update(Guid id, [FromBody] HeroSlide request)
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

        var existing = await _db.HeroSlides.FirstOrDefaultAsync(s => s.Id == id);
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

        await _db.SaveChangesAsync();

        return Ok(existing);
    }

    /// <summary>
    /// Deletes a hero slide.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Delete(Guid id)
    {
        var existing = await _db.HeroSlides.FirstOrDefaultAsync(s => s.Id == id);
        if (existing is null)
        {
            return NotFound(new { message = "Hero slide not found." });
        }

        _db.HeroSlides.Remove(existing);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

