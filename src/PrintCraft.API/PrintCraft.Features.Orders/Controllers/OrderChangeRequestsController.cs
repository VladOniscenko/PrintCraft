using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Models;
using PrintCraft.Features.Orders.Models;
using PrintCraft.Shared.Services;
using PrintCraft.Shared.Orders;
using PrintCraft.Features.Orders.Services;

namespace PrintCraft.Features.Orders.Controllers;

[ApiController]
public class OrderChangeRequestsController : ControllerBase
{
    private readonly PrintCraftDb _db;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OrderChangeRequestsController> _logger;

    public OrderChangeRequestsController(
        PrintCraftDb db,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<OrderChangeRequestsController> logger)
    {
        _db = db;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CUSTOMER ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Customer submits updated description and replacement file for a requested change.
    /// </summary>
    // Permission: User (Own Resource)
    [HttpPost("api/orders/{orderId:guid}/items/{itemId:guid}/change-requests/{requestId:guid}/submit")]
    [Authorize]
    public async Task<IActionResult> SubmitRevision(
        [FromRoute] Guid orderId,
        [FromRoute] Guid itemId,
        [FromRoute] Guid requestId,
        [FromBody] SubmitOrderItemRevisionRequest payload,
        CancellationToken cancellationToken = default)
    {
        var userIdStr = User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var userId = Guid.Parse(userIdStr);
        var isAdmin = User?.IsInRole("admin") ?? false;

        var order = await _db.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Attachments)
            .Include(o => o.Notes)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null || (!isAdmin && order.UserId != userId))
        {
            return NotFound(new { message = "Order not found or access denied." });
        }

        var item = order.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
        {
            return NotFound(new { message = "Order item not found." });
        }

        var changeRequest = await _db.OrderItemChangeRequests
            .FirstOrDefaultAsync(cr => cr.Id == requestId && cr.OrderItemId == itemId && cr.OrderId == orderId, cancellationToken);

        if (changeRequest == null)
        {
            return NotFound(new { message = "Change request not found." });
        }

        if (changeRequest.Status != "pending_customer")
        {
            return BadRequest(new { message = $"Cannot submit revision. Change request is currently in status '{changeRequest.Status}'." });
        }

        var newFileUrl = payload.NewFileUrl?.Trim();
        var newFileName = payload.NewFileName?.Trim();
        var notes = payload.CustomerNotes?.Trim() ?? string.Empty;

        if (changeRequest.RequiresNewFile && string.IsNullOrWhiteSpace(newFileUrl))
        {
            return BadRequest(new { message = "A replacement 3D model file is required for this revision." });
        }

        // If a new file was uploaded, archive the previous model in Attachments to preserve history
        if (!string.IsNullOrWhiteSpace(newFileUrl) && !string.IsNullOrWhiteSpace(item.FileUrl) && item.FileUrl != newFileUrl)
        {
            var alreadyArchived = item.Attachments.Any(a => a.Url == item.FileUrl);
            if (!alreadyArchived)
            {
                var prevAttachment = new OrderItemAttachment
                {
                    OrderItemId = item.Id,
                    Url = item.FileUrl,
                    FileName = item.fileName ?? "previous_model",
                    Kind = "model"
                };
                item.Attachments.Add(prevAttachment);
                _db.OrderItemAttachments.Add(prevAttachment);
            }

            item.FileUrl = newFileUrl;
            if (!string.IsNullOrWhiteSpace(newFileName))
            {
                item.fileName = newFileName;
            }
        }

        changeRequest.SubmittedFileUrl = newFileUrl;
        changeRequest.SubmittedFileName = newFileName;
        changeRequest.CustomerNotes = notes;
        changeRequest.SubmittedAt = DateTime.UtcNow;
        changeRequest.Status = "revision_submitted";

        // Log timeline note
        var note = new OrderNote
        {
            OrderId = order.Id,
            Content = $"Customer submitted revision for item '{item.fileName ?? "model"}': {(string.IsNullOrWhiteSpace(notes) ? "New model uploaded" : notes)}",
            Visibility = "customer",
            CreatedBy = order.FullName,
            CreatedAt = DateTime.UtcNow
        };
        _db.OrderNotes.Add(note);

        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Revision submitted for Order {OrderId}, Item {ItemId}, ChangeRequest {RequestId}", orderId, itemId, requestId);

        return Ok(MapToDto(changeRequest));
    }

    /// <summary>
    /// Customer fetches all revision change requests for a given item.
    /// </summary>
    // Permission: User (Own Resource)
    [HttpGet("api/orders/{orderId:guid}/items/{itemId:guid}/change-requests")]
    [Authorize]
    public async Task<IActionResult> GetCustomerChangeRequests(
        [FromRoute] Guid orderId,
        [FromRoute] Guid itemId,
        CancellationToken cancellationToken = default)
    {
        var userIdStr = User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var userId = Guid.Parse(userIdStr);
        var isAdmin = User?.IsInRole("admin") ?? false;

        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order == null || (!isAdmin && order.UserId != userId))
        {
            return NotFound(new { message = "Order not found or access denied." });
        }

        var requests = await _db.OrderItemChangeRequests
            .AsNoTracking()
            .Where(cr => cr.OrderId == orderId && cr.OrderItemId == itemId)
            .OrderByDescending(cr => cr.RequestedAt)
            .ToListAsync(cancellationToken);

        return Ok(requests.Select(MapToDto));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Admin creates a change request for an order item (e.g. broken model, thin walls, scale).
    /// </summary>
    // Permission: Admin Only
    [HttpPost("api/admin/orders/{orderId:guid}/items/{itemId:guid}/change-requests")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateChangeRequest(
        [FromRoute] Guid orderId,
        [FromRoute] Guid itemId,
        [FromBody] CreateOrderItemChangeRequestRequest payload,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(payload.AdminNotes))
        {
            return BadRequest(new { message = "Admin notes explaining the requested change are required." });
        }

        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null)
        {
            return NotFound(new { message = "Order not found." });
        }

        var item = order.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
        {
            return NotFound(new { message = "Order item not found." });
        }

        var adminEmail = User?.FindFirstValue(ClaimTypes.Email) ?? "Admin";

        // Mark any currently active change requests for this item as superseded to begin new loop iteration
        var activeRequests = await _db.OrderItemChangeRequests
            .Where(cr => cr.OrderItemId == itemId && (cr.Status == "pending_customer" || cr.Status == "revision_submitted"))
            .ToListAsync(cancellationToken);

        foreach (var req in activeRequests)
        {
            req.Status = "superseded";
            req.ResolvedAt = DateTime.UtcNow;
            req.ResolvedBy = adminEmail;
            req.ResolutionNotes = "Superseded by a new change request.";
        }

        var changeRequest = new OrderItemChangeRequest
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            OrderItemId = item.Id,
            Status = "pending_customer",
            ReasonCategory = string.IsNullOrWhiteSpace(payload.ReasonCategory) ? "broken_geometry" : payload.ReasonCategory.Trim(),
            AdminNotes = payload.AdminNotes.Trim(),
            RequiresNewFile = payload.RequiresNewFile,
            RequestedBy = adminEmail,
            RequestedAt = DateTime.UtcNow,
            PreviousFileUrl = item.FileUrl,
            PreviousFileName = item.fileName
        };

        _db.OrderItemChangeRequests.Add(changeRequest);

        // Add order note visible to customer
        var note = new OrderNote
        {
            OrderId = order.Id,
            Content = $"Changes requested for item '{item.fileName ?? "model"}': [{FormatReasonLabel(changeRequest.ReasonCategory)}] {changeRequest.AdminNotes}",
            Visibility = "customer",
            CreatedBy = "PrintCraft Team",
            CreatedAt = DateTime.UtcNow
        };
        _db.OrderNotes.Add(note);

        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        // Send email alert to customer
        try
        {
            var customerUser = order.UserId.HasValue
                ? await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == order.UserId.Value, cancellationToken)
                : null;

            var recipientEmail = customerUser?.Email;
            if (!string.IsNullOrWhiteSpace(recipientEmail))
            {
                var frontendBaseUrl = _configuration["FrontendBaseUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
                var orderUrl = $"{frontendBaseUrl}/orders/{order.Id}";
                var subject = $"PrintCraft: Action Required - Changes requested for Order #{order.Id.ToString().Substring(0, 8)}";
                var body = $"Hello {order.FullName},\n\nOur 3D printing engineering team reviewed your order and requires changes for item '{item.fileName ?? "3D model"}':\n\nReason: {FormatReasonLabel(changeRequest.ReasonCategory)}\nDetails: {changeRequest.AdminNotes}\n\nPlease visit your order portal to submit your updated model or description:\n{orderUrl}\n\nBest regards,\nPrintCraft Team";

                await _emailService.SendCustomEmailAsync(recipientEmail, order.FullName, subject, body);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send change request email for Order {OrderId}", orderId);
        }

        return Ok(MapToDto(changeRequest));
    }

    /// <summary>
    /// Admin resolves / accepts the customer revision.
    /// </summary>
    // Permission: Admin Only
    [HttpPost("api/admin/orders/{orderId:guid}/items/{itemId:guid}/change-requests/{requestId:guid}/resolve")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ResolveChangeRequest(
        [FromRoute] Guid orderId,
        [FromRoute] Guid itemId,
        [FromRoute] Guid requestId,
        [FromBody] ResolveOrderItemChangeRequestRequest? payload,
        CancellationToken cancellationToken = default)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null)
        {
            return NotFound(new { message = "Order not found." });
        }

        var item = order.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
        {
            return NotFound(new { message = "Order item not found." });
        }

        var changeRequest = await _db.OrderItemChangeRequests
            .FirstOrDefaultAsync(cr => cr.Id == requestId && cr.OrderItemId == itemId && cr.OrderId == orderId, cancellationToken);

        if (changeRequest == null)
        {
            return NotFound(new { message = "Change request not found." });
        }

        var adminEmail = User?.FindFirstValue(ClaimTypes.Email) ?? "Admin";

        changeRequest.Status = "resolved";
        changeRequest.ResolvedBy = adminEmail;
        changeRequest.ResolvedAt = DateTime.UtcNow;
        changeRequest.ResolutionNotes = payload?.ResolutionNotes?.Trim() ?? "Revision accepted and verified.";

        var note = new OrderNote
        {
            OrderId = order.Id,
            Content = $"Revision for item '{item.fileName ?? "model"}' accepted: {changeRequest.ResolutionNotes}",
            Visibility = "customer",
            CreatedBy = "PrintCraft Team",
            CreatedAt = DateTime.UtcNow
        };
        _db.OrderNotes.Add(note);

        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(MapToDto(changeRequest));
    }

    /// <summary>
    /// Admin fetches all revision change requests for an order item.
    /// </summary>
    // Permission: Admin Only
    [HttpGet("api/admin/orders/{orderId:guid}/items/{itemId:guid}/change-requests")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetAdminChangeRequests(
        [FromRoute] Guid orderId,
        [FromRoute] Guid itemId,
        CancellationToken cancellationToken = default)
    {
        var requests = await _db.OrderItemChangeRequests
            .AsNoTracking()
            .Where(cr => cr.OrderId == orderId && cr.OrderItemId == itemId)
            .OrderByDescending(cr => cr.RequestedAt)
            .ToListAsync(cancellationToken);

        return Ok(requests.Select(MapToDto));
    }

    private static OrderItemChangeRequestDto MapToDto(OrderItemChangeRequest cr)
    {
        return new OrderItemChangeRequestDto
        {
            Id = cr.Id,
            OrderItemId = cr.OrderItemId,
            OrderId = cr.OrderId,
            Status = cr.Status,
            ReasonCategory = cr.ReasonCategory,
            AdminNotes = cr.AdminNotes,
            RequiresNewFile = cr.RequiresNewFile,
            RequestedBy = cr.RequestedBy,
            RequestedAt = cr.RequestedAt,
            PreviousFileUrl = cr.PreviousFileUrl,
            PreviousFileName = cr.PreviousFileName,
            SubmittedFileUrl = cr.SubmittedFileUrl,
            SubmittedFileName = cr.SubmittedFileName,
            CustomerNotes = cr.CustomerNotes,
            SubmittedAt = cr.SubmittedAt,
            ResolvedBy = cr.ResolvedBy,
            ResolutionNotes = cr.ResolutionNotes,
            ResolvedAt = cr.ResolvedAt
        };
    }

    private static string FormatReasonLabel(string category)
    {
        return category.ToLowerInvariant() switch
        {
            "broken_geometry" => "Broken Geometry / Non-Manifold Mesh",
            "wall_thickness" => "Wall Thickness Below Minimum Threshold",
            "scale_or_size" => "Incorrect Scale or Dimensions",
            "unsupported_format" => "Unsupported or Corrupted File",
            "orientation" => "Orientation or Support Redesign Needed",
            _ => "Custom Change Request"
        };
    }
}
