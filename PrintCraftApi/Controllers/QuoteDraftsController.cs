using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrintCraftApi.Services;
using PrintCraftApi.Validation;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/quote-drafts")]
public sealed class QuoteDraftsController : ControllerBase
{
    private readonly IQuoteDraftService _drafts;

    public QuoteDraftsController(IQuoteDraftService drafts) => _drafts = drafts;

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateQuoteDraftRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FileUrl) && string.IsNullOrWhiteSpace(request.Description))
            return BadRequest(new { message = "Add a file or describe your project." });

        if (InputSanitizer.ContainsDirectoryTraversal(request.FileUrl))
            return BadRequest(new { message = "Invalid file URL." });

        if (InputSanitizer.ContainsSqlInjection(request.Description) || InputSanitizer.ContainsSqlInjection(request.FileName))
            return BadRequest(new { message = "Invalid input detected." });

        var visitorKey = Request.Headers["X-Visitor-Id"].FirstOrDefault();
        var sanitizedFileUrl = request.FileUrl?.Trim() ?? "";
        var sanitizedFileName = InputSanitizer.SanitizeFileName(request.FileName) ?? "";
        var sanitizedDescription = InputSanitizer.SanitizeText(request.Description, 4000) ?? "";
        var sanitizedMaterial = InputSanitizer.SanitizeText(request.Material, 50) ?? "PLA";

        var result = await _drafts.CreateAsync(sanitizedFileUrl, sanitizedFileName, sanitizedDescription, sanitizedMaterial, visitorKey, cancellationToken);
        return Ok(result);
    }

    [HttpPost("redeem")]
    [Authorize]
    public async Task<IActionResult> Redeem([FromBody] RedeemQuoteDraftRequest request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)) return Unauthorized();
        var draft = await _drafts.RedeemAsync(request.QuoteToken, userId, cancellationToken);
        return draft == null
            ? BadRequest(new { message = "This quote draft is invalid or expired." })
            : Ok(new { draft.Id, draft.FileUrl, draft.FileName, draft.Material, draft.Estimate, draft.UserId });
    }
}

public record CreateQuoteDraftRequest(string? FileUrl, string? FileName, string? Description, string? Material);
public record RedeemQuoteDraftRequest(string QuoteToken);
