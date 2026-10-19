using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PrintCraft.Features.Admin.Models;
using PrintCraft.Features.Admin.Services;
using PrintCraft.Features.Filaments.Services;
using PrintCraft.Features.Orders.Services;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Models;
using PrintCraft.Shared.Orders;
using PrintCraft.Shared.Services;

namespace PrintCraft.Features.Admin.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "admin")]
public class AdminPricingController : ControllerBase
{
    private readonly PrintCraftDb _db;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public AdminPricingController(
        PrintCraftDb db,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _db = db;
        _emailService = emailService;
        _configuration = configuration;
    }

    // Permission: Admin Only
    [HttpPost("{orderId:guid}/items/{itemId:guid}/calculate-price")]
    public async Task<IActionResult> CalculateItemPrice(
        [FromRoute] Guid orderId,
        [FromRoute] Guid itemId,
        [FromServices] IPrintPricingService pricingService)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return NotFound(new { message = "Order not found" });

        var item = order.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return NotFound(new { message = "Item not found" });

        var fileUrl = item.FileUrl;
        if ((string.IsNullOrWhiteSpace(fileUrl) || !AdminOrderHelper.IsPrintable3DModelUrl(fileUrl)) && item.Attachments != null && item.Attachments.Count > 0)
        {
            var modelAttachment = item.Attachments.FirstOrDefault(a => AdminOrderHelper.IsPrintable3DModelUrl(a.Url));
            if (modelAttachment != null)
            {
                fileUrl = modelAttachment.Url;
            }
        }

        var is3DModel = AdminOrderHelper.IsPrintable3DModelUrl(fileUrl);

        if (!is3DModel)
        {
            return BadRequest(new { message = "Item does not have a printable 3D model file (.stl, .obj, .3mf, .step, .zip)." });
        }

        var fileName = AdminOrderHelper.ExtractFileNameFromAssetUrl(fileUrl);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return BadRequest(new { message = "Invalid model file URL." });
        }

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        var filePath = Path.Combine(uploadsFolder, fileName);
        if (!System.IO.File.Exists(filePath))
        {
            var altPath = Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", fileName);
            if (System.IO.File.Exists(altPath))
            {
                filePath = altPath;
            }
        }

        if (!System.IO.File.Exists(filePath) && string.IsNullOrWhiteSpace(item.Size))
        {
            return NotFound(new { message = $"File '{fileName}' was not found on server." });
        }

        double scaleFactor = PrintPricingService.ResolveScaleFactor(item);

        await pricingService.CalculatePricingAsync(
            item.Id,
            System.IO.File.Exists(filePath) ? filePath : string.Empty,
            scaleFactor,
            item.InfillPercent,
            item.PrintQuality,
            item.SupportsNeeded
        );

        // Reload item to get updated values
        await _db.Entry(item).ReloadAsync();
        AdminOrderHelper.RecalculateQuotedPrice(order);
        await _db.SaveChangesAsync();

        return Ok(item);
    }

    // Permission: Admin Only
    [HttpPost("{orderId:guid}/calculate-price")]
    public async Task<IActionResult> CalculateAllItemsPrice(
        [FromRoute] Guid orderId,
        [FromServices] IPrintPricingService pricingService)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return NotFound(new { message = "Order not found" });

        foreach (var item in order.Items)
        {
            var fileUrl = item.FileUrl;
            if ((string.IsNullOrWhiteSpace(fileUrl) || !AdminOrderHelper.IsPrintable3DModelUrl(fileUrl)) && item.Attachments != null && item.Attachments.Count > 0)
            {
                var modelAttachment = item.Attachments.FirstOrDefault(a => AdminOrderHelper.IsPrintable3DModelUrl(a.Url));
                if (modelAttachment != null)
                {
                    fileUrl = modelAttachment.Url;
                }
            }

            var is3DModel = AdminOrderHelper.IsPrintable3DModelUrl(fileUrl);

            if (!is3DModel) continue;

            var fileName = AdminOrderHelper.ExtractFileNameFromAssetUrl(fileUrl);
            if (string.IsNullOrWhiteSpace(fileName)) continue;

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            var filePath = Path.Combine(uploadsFolder, fileName);
            if (!System.IO.File.Exists(filePath))
            {
                var altPath = Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", fileName);
                if (System.IO.File.Exists(altPath))
                {
                    filePath = altPath;
                }
            }

            if (!System.IO.File.Exists(filePath) && string.IsNullOrWhiteSpace(item.Size)) continue;

            double scaleFactor = PrintPricingService.ResolveScaleFactor(item);

            await pricingService.CalculatePricingAsync(
                item.Id,
                System.IO.File.Exists(filePath) ? filePath : string.Empty,
                scaleFactor,
                item.InfillPercent,
                item.PrintQuality,
                item.SupportsNeeded
            );
            
            await _db.Entry(item).ReloadAsync();
        }

        AdminOrderHelper.RecalculateQuotedPrice(order);
        await _db.SaveChangesAsync();

        return Ok(order);
    }

    // Permission: Admin Only
    [HttpPost("{id:guid}/process-quote")]
    public async Task<IActionResult> ProcessFullQuote(
        [FromRoute] Guid id,
        [FromBody] ProcessFullQuoteRequest payload)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (AdminOrderHelper.IsPricingLocked(order))
            return BadRequest(new { message = "Pricing cannot be changed after payment." });

        // 1. Update all prices
        foreach (var item in order.Items)
        {
            if (payload.ItemPrices.TryGetValue(item.Id, out var unitPrice))
            {
                item.UnitPrice = unitPrice >= 0 ? unitPrice : 0;
            }
            if (payload.ItemPlateCosts != null && payload.ItemPlateCosts.TryGetValue(item.Id, out var plateCost))
            {
                item.PlateCost = plateCost >= 0 ? plateCost : 2.0;
            }
            item.Price = item.UnitPrice;
        }

        order.DeliveryPrice = payload.DeliveryPrice >= 0 ? payload.DeliveryPrice : 0;
        order.ServiceFeePrice = payload.ServiceFeePrice >= 0 ? payload.ServiceFeePrice : 0;
        order.OrderDiscountAmount = payload.OrderDiscountAmount >= 0 ? payload.OrderDiscountAmount : 0;

        AdminOrderHelper.RecalculateQuotedPrice(order);

        if ((order.QuotedPrice ?? 0m) <= 0)
            return BadRequest(new { message = "Quote total must be greater than zero." });

        // 2. Set Status & Details
        var paymentFlow = AdminOrderHelper.NormalizePaymentFlow(payload.PaymentFlow);
        var previousStatus = order.Status;

        order.QuoteMessage = string.IsNullOrWhiteSpace(payload.QuoteMessage) ? AdminOrderHelper.DefaultQuoteConfirmationMessage : payload.QuoteMessage;
        order.PaymentFlow = paymentFlow;
        order.Status = OrderStatus.AwaitingPayment;
        QuoteLifecycle.MarkQuoteConfirmed(order, DateTime.UtcNow);
        order.UpdatedAt = DateTime.UtcNow;

        // 3. Handle Bank Transfer Payment Generation
        Payment? manualPayment = null;
        if (AdminOrderHelper.IsBankTransferFlow(paymentFlow))
        {
            manualPayment = await AdminOrderHelper.EnsureBankTransferPaymentAsync(_db, _configuration, order, order.QuotedPrice ?? 0m);
        }

        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogStatusHistoryAsync(_db, order.Id, previousStatus, order.Status, "admin", "Full quote processed and sent.");

        // 4. Send the Email
        var recipient = await AdminOrderHelper.ResolveOrderEmailRecipientAsync(_db, order);
        if (recipient != null)
        {
            if (AdminOrderHelper.IsBankTransferFlow(paymentFlow))
            {
                await _emailService.SendQuoteConfirmationBankTransferEmailAsync(
                    recipient.Value.Email, recipient.Value.Name, order.Id, order.QuotedPrice ?? 0m, order.QuoteMessage, manualPayment!.Reference);
            }
            else
            {
                await _emailService.SendQuoteConfirmationEmailAsync(
                    recipient.Value.Email, recipient.Value.Name, order.Id, order.QuotedPrice ?? 0m, order.QuoteMessage);
            }
            await AdminOrderHelper.LogOrderCommunicationAsync(_db, order.Id, "quote_confirmation", "Your quote is ready", recipient.Value.Email);
        }

        return Ok(order);
    }

    // Permission: Admin Only
    [HttpPut("{id:guid}/paid")]
    public async Task<IActionResult> MarkPaid([FromRoute] Guid id)
    {
        var order = await _db.Orders
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (!AdminOrderHelper.CanTransitionStatus(order.Status, "paid", order.IsPaid))
            return BadRequest(new { message = "Paid status is not allowed from the current state." });

        var previousStatus = order.Status;
        order.Status = "paid";
        order.IsPaid = true;
        order.UpdatedAt = DateTime.UtcNow;

        var paymentRecord = order.Payments
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefault();

        if (paymentRecord != null)
        {
            paymentRecord.Status = "paid";
            paymentRecord.PaidAt ??= DateTime.UtcNow;
            paymentRecord.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogStatusHistoryAsync(_db, order.Id, previousStatus, order.Status, "admin", "Marked as paid");

        return Ok(order);
    }

    // Permission: Admin Only
    [HttpPut("{id:guid}/items/{itemId:guid}")]
    public async Task<IActionResult> UpdateOrderItem(
        [FromRoute] Guid id,
        [FromRoute] Guid itemId,
        [FromBody] UpdateItemRequest payload)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (AdminOrderHelper.IsPricingLocked(order))
            return BadRequest(new { message = "Pricing cannot be changed after payment or production progress." });

        var item = order.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return NotFound(new { message = "Item not found" });

        if (payload.UnitPrice < 0)
            return BadRequest(new { message = "Item price cannot be negative." });

        item.UnitPrice = payload.UnitPrice;
        if (payload.PlateCost.HasValue)
        {
            if (payload.PlateCost.Value < 0) return BadRequest(new { message = "Plate cost cannot be negative." });
            item.PlateCost = payload.PlateCost.Value;
        }

        item.Price = item.UnitPrice;

        AdminOrderHelper.RecalculateQuotedPrice(order);
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogAdminActionAsync(_db, order, $"Updated order item price for item {item.Id}");

        return Ok(order);
    }

    // Permission: Admin Only
    [HttpPatch("{id:guid}/service-fee")]
    public async Task<IActionResult> UpdateFeePrice([FromRoute] Guid id, [FromBody] FeePriceRequest payload)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (AdminOrderHelper.IsPricingLocked(order))
            return BadRequest(new { message = "Pricing cannot be changed after payment or production progress." });

        if (payload.ServiceFeePrice < 0)
            return BadRequest(new { message = "Fee price cannot be negative." });

        order.ServiceFeePrice = payload.ServiceFeePrice;
        AdminOrderHelper.RecalculateQuotedPrice(order);
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogAdminActionAsync(_db, order, $"Updated service fee to {order.ServiceFeePrice:F2}");
        return Ok(order);
    }

    // Permission: Admin Only
    [HttpPatch("{id:guid}/delivery-price")]
    public async Task<IActionResult> UpdateDeliveryPrice([FromRoute] Guid id, [FromBody] DeliveryPriceRequest payload)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (AdminOrderHelper.IsPricingLocked(order))
            return BadRequest(new { message = "Pricing cannot be changed after payment or production progress." });

        if (payload.DeliveryPrice < 0)
            return BadRequest(new { message = "Delivery price cannot be negative." });

        order.DeliveryPrice = payload.DeliveryPrice;
        AdminOrderHelper.RecalculateQuotedPrice(order);
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogAdminActionAsync(_db, order, $"Updated delivery fee to {order.DeliveryPrice:F2}");
        return Ok(order);
    }

    // Permission: Admin Only
    [HttpPatch("{id:guid}/order-discount")]
    public async Task<IActionResult> UpdateOrderDiscount([FromRoute] Guid id, [FromBody] OrderDiscountRequest payload)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (AdminOrderHelper.IsPricingLocked(order))
            return BadRequest(new { message = "Pricing cannot be changed after payment or production progress." });

        if (payload.OrderDiscountAmount < 0)
            return BadRequest(new { message = "Order discount cannot be negative." });

        order.OrderDiscountAmount = payload.OrderDiscountAmount;
        AdminOrderHelper.RecalculateQuotedPrice(order);
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await AdminOrderHelper.LogAdminActionAsync(_db, order, $"Updated order discount to {order.OrderDiscountAmount:F2}");
        return Ok(order);
    }
}

