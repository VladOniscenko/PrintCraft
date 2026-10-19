using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraft.Features.Admin.Models;
using PrintCraft.Features.Admin.Services;
using PrintCraft.Features.Orders.Models;
using PrintCraft.Features.Orders.Services;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Models;
using PrintCraft.Shared.Orders;

namespace PrintCraft.Features.Admin.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly PrintCraftDb _db;

    public AdminOrdersController(PrintCraftDb db)
    {
        _db = db;
    }

    // Permission: Admin Only
    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDir,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 20;

        var query = _db.Orders
            .AsSplitQuery()
            .Include(o => o.Items)
                .ThenInclude(i => i.Attachments)
            .Include(o => o.Payments)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var q = search.Trim();
            if (Guid.TryParse(q, out var searchId))
            {
                query = query.Where(o => o.Id == searchId);
            }
            else
            {
                query = query.Where(o => EF.Functions.ILike(o.FullName, $"%{q}%")
                    || EF.Functions.ILike(o.AddressLine1, $"%{q}%")
                    || EF.Functions.ILike(o.City, $"%{q}%")
                    || EF.Functions.ILike(o.PhoneNumber, $"%{q}%")
                    || EF.Functions.ILike(o.Status, $"%{q}%")
                    || (!string.IsNullOrEmpty(o.QuoteMessage) && EF.Functions.ILike(o.QuoteMessage, $"%{q}%"))
                );
            }
        }

        if (!string.IsNullOrEmpty(status) && status != "All")
            query = query.Where(o => o.Status == status);

        query = sortBy?.ToLower() switch
        {
            "createdat" => sortDir?.ToLower() == "desc"
                ? query.OrderByDescending(o => o.CreatedAt)
                : query.OrderBy(o => o.CreatedAt),
            "status" => sortDir?.ToLower() == "desc"
                ? query.OrderByDescending(o => o.Status)
                : query.OrderBy(o => o.Status),
            "quotedprice" => sortDir?.ToLower() == "desc"
                ? query.OrderByDescending(o => o.QuotedPrice)
                : query.OrderBy(o => o.QuotedPrice),
            _ => query.OrderByDescending(o => o.CreatedAt),
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var results = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        await AdminOrderHelper.RefreshQuoteStatusesAsync(_db, results, "system", cancellationToken);

        return Ok(new { results, totalCount, page, pageSize });
    }

    // Permission: Admin Only
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrderById([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var order = await _db.Orders
            .AsSplitQuery()
            .Include(o => o.Items)
                .ThenInclude(i => i.Attachments)
            .Include(o => o.Items)
                .ThenInclude(i => i.ChangeRequests)
            .Include(o => o.Payments)
            .Include(o => o.Notes)
            .Include(o => o.Communications)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

        if (order == null)
            return NotFound(new { message = "Order not found" });

        await AdminOrderHelper.RefreshQuoteStatusesAsync(_db, new[] { order }, "system", cancellationToken);

        var recipient = await AdminOrderHelper.ResolveOrderEmailRecipientAsync(_db, order);
        var email = recipient?.Email ?? string.Empty;

        string? preferredLanguage = null;
        if (order.UserId.HasValue)
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == order.UserId.Value, cancellationToken);
            preferredLanguage = user?.PreferredLanguage;
        }

        var dto = OrderDetailsMapper.MapToDetailsDto(order, email, preferredLanguage);
        return Ok(dto);
    }

    // Permission: Admin Only
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateOrderStatus(
        [FromRoute] Guid id,
        [FromBody] StatusTransitionRequest payload,
        [FromServices] OrderStatusStateMachine? stateMachine = null)
    {
        stateMachine ??= new OrderStatusStateMachine(_db);
        var order = await _db.Orders
            .Include(o => o.Items)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound(new { message = "Order not found" });

        var previousStatus = order.Status;
        var result = await stateMachine.TryTransitionAsync(order, payload);

        if (!result.Success)
            return BadRequest(new { message = result.ErrorMessage });

        // Flag for refund review if a paid order was cancelled
        if (result.FlagForRefundReview)
        {
            order.FlaggedForRefundReview = true;
            _db.OrderNotes.Add(new OrderNote
            {
                OrderId = id,
                Content = "⚠️ This order was cancelled after payment. Refund review required.",
                Visibility = "internal",
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow,
            });
        }

        // Clear hold reason when leaving OnHold
        if (!string.Equals(order.Status, OrderStatus.OnHold, StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(previousStatus)
            && string.Equals(previousStatus, OrderStatus.OnHold, StringComparison.OrdinalIgnoreCase))
        {
            order.HoldReason = null;
        }

        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogStatusHistoryAsync(_db, order.Id, previousStatus, order.Status, "admin",
            payload.HoldReason ?? "Status updated via Kanban");

        return Ok(new
        {
            order,
            flaggedForRefundReview = result.FlagForRefundReview,
        });
    }

    // Permission: Admin Only
    public async Task<IActionResult> UpdateOrderStatus(Guid id, UpdateOrderStatusRequest payload)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (!AdminOrderHelper.CanTransitionStatus(order.Status, payload.Status, order.IsPaid))
            return BadRequest(new { message = "Invalid status transition for this order." });

        var previousStatus = order.Status;
        var nextStatus = AdminOrderHelper.NormalizeStatus(payload.Status);
        order.Status = nextStatus;
        if (string.Equals(nextStatus, "quoted", StringComparison.OrdinalIgnoreCase))
        {
            QuoteLifecycle.MarkQuoteConfirmed(order, DateTime.UtcNow);
        }
        else if (string.Equals(nextStatus, OrderStatus.QuoteRequested, StringComparison.OrdinalIgnoreCase))
        {
            QuoteLifecycle.ClearQuoteWindow(order);
        }

        if (string.Equals(nextStatus, "paid", StringComparison.OrdinalIgnoreCase))
            order.IsPaid = true;

        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogStatusHistoryAsync(_db, order.Id, previousStatus, order.Status, "admin", "Status updated");

        return Ok(order);
    }

    // Permission: Admin Only
    [HttpPatch("{id:guid}/customer")]
    public async Task<IActionResult> UpdateOrderCustomer([FromRoute] Guid id, [FromBody] UpdateOrderCustomerRequest payload)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        order.FullName = payload.FullName;
        order.AddressLine1 = payload.AddressLine1;
        order.AddressLine2 = payload.AddressLine2;
        order.City = payload.City;
        order.PostalCode = payload.PostalCode;
        order.PhoneNumber = payload.PhoneNumber;
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogAdminActionAsync(_db, order, "Updated customer shipping details");
        return Ok(order);
    }

    // Permission: Admin Only
    [HttpPatch("{id:guid}/tracking")]
    public async Task<IActionResult> UpdateTracking([FromRoute] Guid id, [FromBody] TrackingRequest payload)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        order.TrackingCode = string.IsNullOrWhiteSpace(payload.TrackingCode)
            ? null
            : payload.TrackingCode.Trim();
        order.TrackingUrl = string.IsNullOrWhiteSpace(payload.TrackingUrl)
            ? null
            : payload.TrackingUrl.Trim();
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogAdminActionAsync(_db, order, "Updated tracking information");
        return Ok(order);
    }

    // Permission: Admin Only
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteOrder([FromRoute] Guid id)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (!AdminOrderHelper.IsPendingStatus(order.Status))
            return BadRequest(new { message = "Only pending orders can be deleted." });

        // Delete associated files
        foreach (var item in order.Items)
        {
            if (!string.IsNullOrEmpty(item.FileUrl))
            {
                AdminOrderHelper.DeleteUploadFileIfExists(item.FileUrl);
            }

            if (!string.IsNullOrEmpty(item.ImageUrl))
            {
                AdminOrderHelper.DeleteUploadFileIfExists(item.ImageUrl);
            }

            foreach (var attachment in item.Attachments)
            {
                if (!string.IsNullOrWhiteSpace(attachment.Url))
                {
                    AdminOrderHelper.DeleteUploadFileIfExists(attachment.Url);
                }
            }
        }

        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

