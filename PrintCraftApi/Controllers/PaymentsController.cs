using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Configuration;
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

    [HttpPost("create")]
    [Authorize]
    [EnableRateLimiting("CheckoutLimit")]
    public async Task<IActionResult> CreateCheckout([FromBody] CheckoutRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        var cart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId.Value);
        if (cart == null || cart.Items.Count == 0) return BadRequest(new { message = "Cart is empty" });
        var shipping = ShippingInfoValidator.Validate(request.FullName, request.PhoneNumber, request.AddressLine1, request.City, request.PostalCode);
        if (!shipping.IsValid) return BadRequest(new { message = "Please correct shipping info and try again.", errors = shipping.Errors });

        var items = new List<OrderItem>();
        decimal subtotal = 0m;
        foreach (var cartItem in cart.Items)
        {
            if (cartItem.Count <= 0 || cartItem.Count > AppLimits.MaxItemQuantity) return BadRequest(new { message = "Invalid cart item quantity." });
            var product = await _db.Products.FindAsync(cartItem.ProductId);
            if (product == null) return BadRequest(new { message = $"Product {cartItem.ProductId} not found" });
            var price = ProductPricing.EffectivePrice(product.Price, product.DiscountPercentage);
            subtotal += price * cartItem.Count;
            items.Add(new OrderItem { fileName = product.Name ?? "Unknown Item", FileUrl = product.ImageUrl ?? string.Empty, Material = cartItem.Material, Color = cartItem.Color, Count = cartItem.Count, Price = (double)price });
        }

        var order = new Order
        {
            UserId = userId,
            FullName = shipping.FullName,
            AddressLine1 = shipping.AddressLine1,
            City = shipping.City,
            PostalCode = shipping.PostalCode,
            PhoneNumber = shipping.PhoneNumber,
            PaymentFlow = "bank_transfer",
            DeliveryPrice = 6.95m,
            Status = "pending_payment",
            OrderType = "online",
            Items = items,
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();
        var payment = await EnsureBankTransferPaymentAsync(order, subtotal + order.DeliveryPrice);
        _db.CartItems.RemoveRange(cart.Items);
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(userId.Value);
        try { await _discord.SendBookingCreatedAsync(order, user); } catch (Exception ex) { _logger.LogWarning(ex, "Booking notification failed for {OrderId}", order.Id); }
        return Ok(new { orderId = order.Id, paymentReference = payment.Reference, paymentFlow = "bank_transfer", bankTransferDetails = BankTransferDetails() });
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

public record CheckoutRequest(string FullName, string PhoneNumber, string AddressLine1, string City, string PostalCode);
