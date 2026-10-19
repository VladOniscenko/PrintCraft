using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PrintCraft.Features.Admin.Models;
using PrintCraft.Features.Admin.Services;
using PrintCraft.Features.Orders.Services;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Models;
using PrintCraft.Shared.Orders;
using PrintCraft.Shared.Services;

namespace PrintCraft.Features.Admin.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "admin")]
public class AdminOrderCommunicationsController : ControllerBase
{
    private readonly PrintCraftDb _db;
    private readonly IEmailService _emailService;
    private readonly IInvoiceService _invoiceService;
    private readonly IConfiguration _configuration;

    public AdminOrderCommunicationsController(
        PrintCraftDb db,
        IEmailService emailService,
        IInvoiceService invoiceService,
        IConfiguration configuration)
    {
        _db = db;
        _emailService = emailService;
        _invoiceService = invoiceService;
        _configuration = configuration;
    }

    // Permission: Admin Only
    [HttpGet("{id:guid}/invoice")]
    public async Task<IActionResult> DownloadInvoice(
        [FromRoute] Guid id,
        [FromQuery] string? language = "en",
        CancellationToken cancellationToken = default)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .AsSplitQuery()
            .Include(o => o.Items)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
        if (order == null) return NotFound(new { message = "Order not found" });

        var customer = order.UserId.HasValue 
            ? await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == order.UserId.Value, cancellationToken) 
            : null;
        var pdf = _invoiceService.Generate(order, customer, language);
        return File(pdf, "application/pdf", $"invoice-{order.Id:N}.pdf");
    }

    // Permission: Admin Only
    [HttpGet("{id:guid}/communications")]
    public async Task<IActionResult> GetOrderCommunications([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var exists = await _db.Orders.AnyAsync(o => o.Id == id, cancellationToken);
        if (!exists) return NotFound(new { message = "Order not found" });

        var entries = await _db.OrderCommunications
            .AsNoTracking()
            .Where(c => c.OrderId == id)
            .OrderByDescending(c => c.SentAt)
            .ToListAsync(cancellationToken);

        return Ok(entries);
    }

    // Permission: Admin Only
    [HttpGet("{id:guid}/status-history")]
    public async Task<IActionResult> GetOrderStatusHistory([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var exists = await _db.Orders.AnyAsync(o => o.Id == id, cancellationToken);
        if (!exists) return NotFound(new { message = "Order not found" });

        var entries = await _db.OrderStatusHistory
            .AsNoTracking()
            .Where(s => s.OrderId == id)
            .OrderByDescending(s => s.ChangedAt)
            .ToListAsync(cancellationToken);

        return Ok(entries);
    }

    // Permission: Admin Only
    [HttpGet("{id:guid}/notes")]
    public async Task<IActionResult> GetOrderNotes(
        [FromRoute] Guid id,
        [FromQuery] string? visibility,
        CancellationToken cancellationToken = default)
    {
        var exists = await _db.Orders.AnyAsync(o => o.Id == id, cancellationToken);
        if (!exists) return NotFound(new { message = "Order not found" });

        var normalizedVisibility = AdminOrderHelper.NormalizeNoteVisibility(visibility);
        var query = _db.OrderNotes
            .AsNoTracking()
            .Where(n => n.OrderId == id)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(visibility))
        {
            if (!AdminOrderHelper.IsAllowedNoteVisibility(normalizedVisibility))
                return BadRequest(new { message = "Visibility must be one of: internal, customer." });

            query = query.Where(n => EF.Functions.ILike(n.Visibility, normalizedVisibility));
        }

        var notes = await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(notes);
    }

    // Permission: Admin Only
    [HttpPost("{id:guid}/notes")]
    public async Task<IActionResult> AddOrderNote(
        [FromRoute] Guid id,
        [FromBody] CreateOrderNoteRequest payload)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (string.IsNullOrWhiteSpace(payload.Content))
            return BadRequest(new { message = "Note content is required." });

        var visibility = AdminOrderHelper.NormalizeNoteVisibility(payload.Visibility);
        if (!AdminOrderHelper.IsAllowedNoteVisibility(visibility))
            return BadRequest(new { message = "Visibility must be one of: internal, customer." });

        var note = new OrderNote
        {
            OrderId = id,
            Content = payload.Content.Trim(),
            Visibility = visibility,
            CreatedBy = "admin",
            CreatedAt = DateTime.UtcNow,
        };

        _db.OrderNotes.Add(note);
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogAdminActionAsync(_db, order, $"Added {visibility} note");

        return Ok(note);
    }

    // Permission: Admin Only
    [HttpDelete("{id:guid}/notes/{noteId}")]
    public async Task<IActionResult> DeleteOrderNote([FromRoute] Guid id, [FromRoute] string noteId)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        var normalizedNoteId = string.IsNullOrWhiteSpace(noteId)
            ? string.Empty
            : noteId.Trim().ToLowerInvariant();

        if (normalizedNoteId == "legacy-internal")
        {
            order.InternalNotes = null;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await AdminOrderHelper.LogAdminActionAsync(_db, order, "Deleted legacy internal note");
            return NoContent();
        }

        if (normalizedNoteId == "legacy-customer")
        {
            order.CustomerNotes = null;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await AdminOrderHelper.LogAdminActionAsync(_db, order, "Deleted legacy customer note");
            return NoContent();
        }

        if (!Guid.TryParse(noteId, out var parsedNoteId))
            return NotFound(new { message = "Note not found" });

        var note = await _db.OrderNotes.FirstOrDefaultAsync(n => n.Id == parsedNoteId && n.OrderId == id);
        if (note == null) return NotFound(new { message = "Note not found" });

        _db.OrderNotes.Remove(note);
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogAdminActionAsync(_db, order, $"Deleted note {note.Id}");

        return NoContent();
    }

    // Permission: Admin Only
    [HttpGet("{id:guid}/payments")]
    public async Task<IActionResult> GetOrderPayments([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var exists = await _db.Orders.AnyAsync(o => o.Id == id, cancellationToken);
        if (!exists) return NotFound(new { message = "Order not found" });

        var payments = await _db.Payments
            .AsNoTracking()
            .Where(p => p.OrderId == id)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(payments);
    }

    // Permission: Admin Only
    [HttpPost("{id:guid}/email")]
    public async Task<IActionResult> SendOrderEmail([FromRoute] Guid id, [FromBody] SendOrderEmailRequest payload)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        var recipient = await AdminOrderHelper.ResolveOrderEmailRecipientAsync(_db, order);
        if (recipient == null)
            return BadRequest(new { message = "No customer email found for this order." });

        var recipientEmail = recipient.Value.Email;
        var recipientName = recipient.Value.Name;

        var type = payload.Type?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(type))
            return BadRequest(new { message = "Email type is required." });

        switch (type)
        {
            case "quote_requested":
                await _emailService.SendQuoteRequestedEmailAsync(recipientEmail, recipientName, order.Id);
                await AdminOrderHelper.LogOrderCommunicationAsync(_db, order.Id, "quote_requested", "Quote request received", recipientEmail);
                return Ok(new { message = "Quote requested email sent." });

            case "quote_confirmation":
                AdminOrderHelper.RecalculateQuotedPrice(order);
                var quotePrice = order.QuotedPrice ?? 0m;
                if (quotePrice <= 0)
                    return BadRequest(new { message = "Quote total must be greater than zero. Set item and delivery prices first." });

                var quoteMessage = string.IsNullOrWhiteSpace(payload.Message)
                    ? AdminOrderHelper.DefaultQuoteConfirmationMessage
                    : payload.Message.Trim();

                var paymentFlow = AdminOrderHelper.NormalizePaymentFlow(payload.PaymentFlow ?? order.PaymentFlow);

                order.QuoteMessage = quoteMessage;
                order.PaymentFlow = paymentFlow;
                if (!string.Equals(order.Status, "paid", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(order.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    var previousStatus = order.Status;
                    order.Status = OrderStatus.AwaitingPayment;
                    QuoteLifecycle.MarkQuoteConfirmed(order, DateTime.UtcNow);
                    await AdminOrderHelper.LogStatusHistoryAsync(_db, order.Id, previousStatus, order.Status, "admin", AdminOrderHelper.IsBankTransferFlow(paymentFlow)
                        ? "Quote confirmation email sent with bank transfer instructions"
                        : "Quote confirmation email sent");
                }
                order.UpdatedAt = DateTime.UtcNow;

                Payment? manualPayment = null;

                if (AdminOrderHelper.IsBankTransferFlow(paymentFlow))
                {
                    manualPayment = await AdminOrderHelper.EnsureBankTransferPaymentAsync(_db, _configuration, order, quotePrice);
                }

                await _db.SaveChangesAsync();

                if (AdminOrderHelper.IsBankTransferFlow(paymentFlow))
                {
                    await _emailService.SendQuoteConfirmationBankTransferEmailAsync(
                        recipientEmail,
                        recipientName,
                        order.Id,
                        quotePrice,
                        quoteMessage,
                        manualPayment!.Reference);
                    await AdminOrderHelper.LogOrderCommunicationAsync(_db, order.Id, "quote_confirmation_bank_transfer", "Your quote is ready", recipientEmail);
                }
                else
                {
                    await _emailService.SendQuoteConfirmationEmailAsync(
                        recipientEmail,
                        recipientName,
                        order.Id,
                        quotePrice,
                        quoteMessage);
                    await AdminOrderHelper.LogOrderCommunicationAsync(_db, order.Id, "quote_confirmation", "Your quote is ready", recipientEmail);
                }
                return Ok(new { message = "Quote confirmation email sent." });

            case "order_sent_tracking":
                var trackingCode = string.IsNullOrWhiteSpace(payload.TrackingCode)
                    ? order.TrackingCode
                    : payload.TrackingCode.Trim();
                var trackingUrl = string.IsNullOrWhiteSpace(payload.TrackingUrl)
                    ? order.TrackingUrl
                    : payload.TrackingUrl.Trim();

                if (string.IsNullOrWhiteSpace(trackingCode))
                    return BadRequest(new { message = "Tracking code is required." });

                if (!string.IsNullOrWhiteSpace(payload.TrackingCode) || !string.IsNullOrWhiteSpace(payload.TrackingUrl))
                {
                    order.TrackingCode = trackingCode;
                    order.TrackingUrl = trackingUrl;
                    order.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();
                }

                await _emailService.SendOrderSentTrackingEmailAsync(
                    recipientEmail,
                    recipientName,
                    order.Id,
                    trackingCode,
                    trackingUrl);
                await AdminOrderHelper.LogOrderCommunicationAsync(_db, order.Id, "order_sent_tracking", "Your order has been sent", recipientEmail);
                return Ok(new { message = "Order sent email sent." });

            case "custom":
                if (string.IsNullOrWhiteSpace(payload.Subject) || string.IsNullOrWhiteSpace(payload.Body))
                    return BadRequest(new { message = "Custom email requires a subject and body." });

                await _emailService.SendCustomEmailAsync(
                    recipientEmail,
                    recipientName,
                    payload.Subject.Trim(),
                    payload.Body.Trim());

                await AdminOrderHelper.LogOrderCommunicationAsync(
                    _db,
                    order.Id,
                    string.IsNullOrWhiteSpace(payload.Template) ? "custom_email" : $"custom_email:{payload.Template.Trim().ToLowerInvariant()}",
                    payload.Subject.Trim(),
                    recipientEmail);

                return Ok(new { message = "Custom email sent." });

            default:
                return BadRequest(new { message = "Unsupported email type." });
        }
    }
}

