using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Models;
using PrintCraft.Shared.Services;
using PrintCraft.Shared.Validation;

namespace PrintCraftApi.Controllers;

[ApiController]
public sealed class SupportTicketsController : ControllerBase
{
    private readonly PrintCraftDb _db;
    private readonly IDiscordWebhookService _discordWebhookService;
    private readonly IEmailService _emailService;
    private readonly ILogger<SupportTicketsController> _logger;

    public SupportTicketsController(
        PrintCraftDb db,
        IDiscordWebhookService discordWebhookService,
        IEmailService emailService,
        ILogger<SupportTicketsController> logger)
    {
        _db = db;
        _discordWebhookService = discordWebhookService;
        _emailService = emailService;
        _logger = logger;
    }

    // Permission: Public Mutate (Whitelisted: Customer Support Ticket Submission)
    [HttpPost("api/support-tickets")]
    [AllowAnonymous]
    public async Task<IActionResult> CreateTicket(
        [FromBody] CreateSupportTicketRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null)
            return BadRequest(new { message = "Invalid ticket payload." });

        var email = request.UserEmail?.Trim();

        // Automatically associate UserId if the user is authenticated
        Guid? userId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdClaim, out var parsedUserId))
        {
            userId = parsedUserId;
        }

        // If email was not provided in body, fall back to authenticated user email
        if (string.IsNullOrWhiteSpace(email))
        {
            email = User.FindFirstValue(ClaimTypes.Email)?.Trim();
        }

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@') || email.Length > 256)
            return BadRequest(new { message = "A valid email address is required." });

        if (string.IsNullOrWhiteSpace(request.Subject))
            return BadRequest(new { message = "Subject is required." });

        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest(new { message = "Description is required." });

        if (InputSanitizer.ContainsSqlInjection(request.Subject) || InputSanitizer.ContainsSqlInjection(request.Description))
            return BadRequest(new { message = "Invalid input detected." });

        var category = SupportTicketCategory.General;
        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            var normalizedCategory = request.Category.Replace(" ", "").Replace("_", "");
            if (Enum.TryParse<SupportTicketCategory>(normalizedCategory, true, out var parsedCat))
            {
                category = parsedCat;
            }
        }

        // Sanitize attachment URLs if any
        var sanitizedAttachments = new List<string>();
        if (request.AttachmentUrls != null)
        {
            foreach (var url in request.AttachmentUrls)
            {
                if (!string.IsNullOrWhiteSpace(url) && !InputSanitizer.ContainsDirectoryTraversal(url))
                {
                    sanitizedAttachments.Add(url.Trim());
                }
            }
        }

        var ticket = new SupportTicket
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserEmail = email,
            OrderId = request.OrderId,
            Category = category,
            Subject = InputSanitizer.SanitizeText(request.Subject, 256) ?? request.Subject.Trim(),
            Description = InputSanitizer.SanitizeText(request.Description, 4000) ?? request.Description.Trim(),
            Status = SupportTicketStatus.Open,
            AttachmentUrls = sanitizedAttachments,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.SupportTickets.Add(ticket);
        await _db.SaveChangesAsync(cancellationToken);

        // Upon creation, trigger Discord webhook notification
        try
        {
            await _discordWebhookService.SendSupportTicketCreatedAsync(ticket, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to dispatch Discord webhook for ticket {TicketId}", ticket.Id);
        }

        // Trigger EmailService for customer acknowledgment and admin alert
        try
        {
            await _emailService.SendSupportTicketCreatedEmailsAsync(ticket);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to dispatch email notifications for ticket {TicketId}", ticket.Id);
        }

        return StatusCode(StatusCodes.Status201Created, ticket);
    }

    // Permission: Admin Only
    [HttpGet("api/admin/support-tickets")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetTickets(
        [FromQuery] string? status = null,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] bool sortDesc = true,
        CancellationToken cancellationToken = default)
    {
        var query = _db.SupportTickets
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
        {
            var normalizedStatus = status.Replace(" ", "").Replace("_", "");
            if (Enum.TryParse<SupportTicketStatus>(normalizedStatus, true, out var parsedStatus))
            {
                query = query.Where(t => t.Status == parsedStatus);
            }
        }

        query = (sortBy?.ToLowerInvariant(), sortDesc) switch
        {
            ("status", false) => query.OrderBy(t => t.Status).ThenByDescending(t => t.CreatedAt),
            ("status", true) => query.OrderByDescending(t => t.Status).ThenByDescending(t => t.CreatedAt),
            ("createdat", false) => query.OrderBy(t => t.CreatedAt),
            _ => query.OrderByDescending(t => t.CreatedAt)
        };

        var tickets = await query.ToListAsync(cancellationToken);
        return Ok(tickets);
    }

    // Permission: Admin Only
    [HttpPut("api/admin/support-tickets/{id:guid}/status")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> UpdateTicketStatus(
        Guid id,
        [FromBody] UpdateSupportTicketStatusRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Status))
            return BadRequest(new { message = "Status is required." });

        var normalizedStatus = request.Status.Replace(" ", "").Replace("_", "");
        if (!Enum.TryParse<SupportTicketStatus>(normalizedStatus, true, out var newStatus))
            return BadRequest(new { message = "Invalid ticket status value." });

        var ticket = await _db.SupportTickets.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (ticket == null)
            return NotFound(new { message = "Ticket not found." });

        ticket.Status = newStatus;
        ticket.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ticket);
    }
}

public sealed record CreateSupportTicketRequest(
    string? UserEmail,
    Guid? OrderId,
    string? Category,
    string? Subject,
    string? Description,
    List<string>? AttachmentUrls);

public sealed record UpdateSupportTicketStatusRequest(string Status);
