using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;
using PrintCraftApi.Validation;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly PrintCraftDb _db;
    private readonly IConfiguration _configuration;
    private readonly IDiscordWebhookService _discord;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(PrintCraftDb db, IConfiguration configuration, IDiscordWebhookService discord, ILogger<PaymentsController> logger)
    {
        _db = db;
        _configuration = configuration;
        _discord = discord;
        _logger = logger;
    }

    [HttpPost("orders/{orderId:guid}/create")]
    [Authorize]
    [EnableRateLimiting("CheckoutLimit")]
    public async Task<IActionResult> CreateQuotedOrderPayment(Guid orderId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var order = await _db.Orders.Include(o => o.Payments).FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId.Value);
        if (order == null) return NotFound(new { message = "Order not found" });
        if (order.IsPaid) return BadRequest(new { message = "Order is already paid." });
        if (order.PaymentFlow != "bank_transfer") return BadRequest(new { message = "Only bank transfer payments are supported." });
        if (OrderCustomerMapper.IsQuotePending(order)) return BadRequest(new { message = "This quote is still under review and cannot be paid yet." });
        var shipping = ShippingInfoValidator.Validate(order.FullName, order.PhoneNumber, order.AddressLine1, order.City, order.PostalCode);
        if (!shipping.IsValid) return BadRequest(new { message = "Shipping details are required before payment.", errors = shipping.Errors });
        var amount = order.QuotedPrice ?? order.FinalTotalAmount;
        var payment = order.Payments
            .Where(p => string.Equals(p.Provider, "bank_transfer", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefault() ?? await EnsureBankTransferPaymentAsync(order, amount);
        return Ok(new { orderId, paymentReference = payment.Reference, paymentFlow = "bank_transfer", bankTransferDetails = BankTransferDetails() });
    }

    private async Task<Payment> EnsureBankTransferPaymentAsync(Order order, decimal amount)
    {
        var payment = await _db.Payments.Where(p => p.OrderId == order.Id && p.Provider == "bank_transfer" && p.Status != "paid").OrderByDescending(p => p.CreatedAt).FirstOrDefaultAsync();
        if (payment != null) { payment.Amount = amount; payment.UpdatedAt = DateTime.UtcNow; await _db.SaveChangesAsync(); return payment; }
        var reference = $"PC-{order.Id:N}"[..20].ToUpperInvariant();
        payment = new Payment { OrderId = order.Id, Provider = "bank_transfer", Reference = reference, Currency = (_configuration["CurrencyCode"] ?? "EUR").ToUpperInvariant(), Amount = amount, Status = "pending", Method = "bank_transfer" };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();
        return payment;
    }

    private object BankTransferDetails() => new
    {
        accountName = _configuration["BankTransfer:AccountName"],
        iban = _configuration["BankTransfer:Iban"],
        bic = _configuration["BankTransfer:Bic"]
    };

    private Guid? GetUserId() => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}

