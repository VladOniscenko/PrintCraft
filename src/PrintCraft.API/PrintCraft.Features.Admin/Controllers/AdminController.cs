using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PrintCraft.Features.Admin.Models;
using PrintCraft.Features.Content.Data;
using PrintCraft.Features.Filaments.Data;
using PrintCraft.Features.Notifications.Data;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Orders;

namespace PrintCraft.Features.Admin.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly PrintCraftDb _db;

    public AdminController(PrintCraftDb db)
    {
        _db = db;
    }

    // Permission: Admin Only
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken = default)
    {
        var totalUsers = await _db.Users.CountAsync(cancellationToken);
        var totalOrders = await _db.Orders.CountAsync(cancellationToken);
        var pendingOrders = await _db.Orders.CountAsync(o => o.Status == OrderStatus.QuoteRequested || o.Status == "pending" || o.Status == "quoted", cancellationToken);

        return Ok(new
        {
            totalUsers,
            totalOrders,
            pendingOrders
        });
    }

    // Permission: Admin Only
    [HttpPost("seed-defaults")]
    public async Task<IActionResult> SeedDefaults([FromQuery] bool force = true)
    {
        var env = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
        HeroSlideSeeder.EnsureSeedAssets(env.WebRootPath, env.ContentRootPath);

        var slideRes = await HeroSlideSeeder.EnsureDatabaseSeededAsync(_db, force);
        var emailRes = await EmailTemplateSeeder.EnsureDatabaseSeededAsync(_db, force);
        var filRes = await FilamentSeeder.EnsureDatabaseSeededAsync(_db, force);

        return Ok(new
        {
            message = "All database defaults seeded successfully.",
            forceReload = force,
            heroSlides = slideRes,
            emailTemplates = emailRes,
            filaments = filRes
        });
    }

    // Backward-compatible record re-exports for existing references
    public record CreateOrderNoteRequest(string Content, string Visibility) : Models.CreateOrderNoteRequest(Content, Visibility);
    public record UpdateItemRequest(double UnitPrice, double? PlateCost = null) : Models.UpdateItemRequest(UnitPrice, PlateCost);
    public record DeliveryPriceRequest(decimal DeliveryPrice) : Models.DeliveryPriceRequest(DeliveryPrice);
    public record FeePriceRequest(decimal ServiceFeePrice) : Models.FeePriceRequest(ServiceFeePrice);
    public record OrderDiscountRequest(decimal OrderDiscountAmount) : Models.OrderDiscountRequest(OrderDiscountAmount);
    public record UpdateOrderStatusRequest(string Status) : Models.UpdateOrderStatusRequest(Status);
    public record AssignProductionRequest(bool? GCodeFinalized) : Models.AssignProductionRequest(GCodeFinalized);
    public record UpdateOrderCustomerRequest(
        string FullName,
        string AddressLine1,
        string? AddressLine2,
        string City,
        string PostalCode,
        string PhoneNumber) : Models.UpdateOrderCustomerRequest(FullName, AddressLine1, AddressLine2, City, PostalCode, PhoneNumber);
    public record TrackingRequest(string? TrackingCode, string? TrackingUrl) : Models.TrackingRequest(TrackingCode, TrackingUrl);
    public record SendOrderEmailRequest(string Type, decimal? Price, string? Message, string? TrackingCode, string? TrackingUrl, string? PaymentFlow, string? Subject, string? Body, string? Template)
        : Models.SendOrderEmailRequest(Type, Price, Message, TrackingCode, TrackingUrl, PaymentFlow, Subject, Body, Template);
    public record AdminUserDto(Guid Id, string Name, string Email, string Role) : Models.AdminUserDto(Id, Name, Email, Role);
    public record UpdateUserRequest(string Name, string Email, string Role) : Models.UpdateUserRequest(Name, Email, Role);
    public record ProcessFullQuoteRequest(
        Dictionary<Guid, double> ItemPrices,
        Dictionary<Guid, double> ItemPlateCosts,
        decimal DeliveryPrice,
        decimal ServiceFeePrice,
        decimal OrderDiscountAmount,
        string QuoteMessage,
        string PaymentFlow
    ) : Models.ProcessFullQuoteRequest(ItemPrices, ItemPlateCosts, DeliveryPrice, ServiceFeePrice, OrderDiscountAmount, QuoteMessage, PaymentFlow);
}
