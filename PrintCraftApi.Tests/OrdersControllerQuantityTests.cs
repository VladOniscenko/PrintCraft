using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using PrintCraftApi.Configuration;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;
using Xunit;

namespace PrintCraftApi.Tests;

public class OrdersControllerQuantityTests
{
    [Fact]
    public void AppLimits_MaxItemQuantity_IsConfiguredTo25()
    {
        Assert.Equal(25, AppLimits.MaxItemQuantity);
    }

    [Theory]
    [InlineData(26)]
    [InlineData(50)]
    [InlineData(1000)]
    public async Task CreateQuote_WhenItemCountExceedsLimit_ReturnsBadRequest(int excessiveCount)
    {
        await using var db = CreateDbContext();
        var controller = CreateController(db);

        var request = CreateValidQuoteRequest(excessiveCount);

        var result = await controller.CreateQuote(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);

        var json = System.Text.Json.JsonSerializer.Serialize(badRequest.Value);
        Assert.Contains("Item quantity cannot exceed 25 per item.", json);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-10)]
    public async Task CreateQuote_WhenItemCountIsZeroOrNegative_ReturnsBadRequest(int invalidCount)
    {
        await using var db = CreateDbContext();
        var controller = CreateController(db);

        var request = CreateValidQuoteRequest(invalidCount);

        var result = await controller.CreateQuote(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);

        var json = System.Text.Json.JsonSerializer.Serialize(badRequest.Value);
        Assert.Contains("Each quote item must include a valid quantity.", json);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(12)]
    [InlineData(25)]
    public async Task CreateQuote_WhenItemCountWithinLimit_PassesQuantityValidation(int validCount)
    {
        await using var db = CreateDbContext();
        var controller = CreateController(db);

        var request = CreateValidQuoteRequest(validCount);

        var result = await controller.CreateQuote(request);

        Assert.IsType<CreatedAtActionResult>(result);

        var savedOrder = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync();
        Assert.NotNull(savedOrder);
        Assert.Single(savedOrder.Items);
        Assert.Equal(validCount, savedOrder.Items[0].Count);
    }

    private static PrintCraftDb CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new PrintCraftDb(options);
    }

    private static OrdersController CreateController(PrintCraftDb db)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSecret"] = "test-jwt-secret-key-that-is-at-least-32-chars-long!",
                ["FrontendBaseUrl"] = "https://printmy3d.work"
            })
            .Build();

        return new OrdersController(
            db,
            new TestWebHostEnvironment(),
            new FakeEmailService(),
            new FakeDiscordWebhookService(),
            config,
            NullLogger<OrdersController>.Instance,
            new PricingQueue()
        );
    }

    private static QuoteRequest CreateValidQuoteRequest(int count = 1)
    {
        return new QuoteRequest(
            Items: new List<QuoteItemRequest>
            {
                new QuoteItemRequest(
                    FileUrl: "/uploads/sample.stl",
                    ImageUrl: null,
                    FileName: "sample.stl",
                    Notes: "Please print in blue",
                    Size: "50 x 50 x 20 mm",
                    Material: "PLA",
                    Color: "Blue",
                    Count: count,
                    Files: new List<QuoteItemFileRequest>
                    {
                        new QuoteItemFileRequest("/uploads/sample.stl", "sample.stl", "model")
                    },
                    ScaleFactor: 1.0,
                    InfillPercent: 20,
                    PrintQuality: "Standard (0.20mm)",
                    SupportsNeeded: false
                )
            },
            GuestName: "Jan Jansen",
            GuestEmail: "jan@example.com",
            GuestPhone: "+31612345678",
            ShippingFullName: "Jan Jansen",
            ShippingPhoneNumber: "+31612345678",
            ShippingAddressLine1: "Keizersgracht 100",
            ShippingCity: "Amsterdam",
            ShippingPostalCode: "1015AA",
            AgreementAccepted: true,
            AgreementVersion: "2026-09-23"
        );
    }

    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = null!;
        public string ApplicationName { get; set; } = "PrintCraftApi";
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
        public string ContentRootPath { get; set; } = string.Empty;
        public string EnvironmentName { get; set; } = "Development";
    }

    private sealed class FakeEmailService : IEmailService
    {
        public Task SendResetPasswordEmailAsync(string toEmail, string toName, string resetLink) => Task.CompletedTask;
        public Task SendQuoteRequestedEmailAsync(string toEmail, string toName, Guid orderId) => Task.CompletedTask;
        public Task SendQuoteConfirmationEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage) => Task.CompletedTask;
        public Task SendQuoteConfirmationBankTransferEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage, string paymentReference) => Task.CompletedTask;
        public Task SendOrderSentTrackingEmailAsync(string toEmail, string toName, Guid orderId, string trackingCode, string? trackingUrl) => Task.CompletedTask;
        public Task SendOrderPaidEmailAsync(string toEmail, string toName, Guid orderId, decimal amount) => Task.CompletedTask;
        public Task SendCustomEmailAsync(string toEmail, string toName, string subject, string body) => Task.CompletedTask;
    }

    private sealed class FakeDiscordWebhookService : IDiscordWebhookService
    {
        public Task SendUnhandledExceptionAsync(HttpContext context, Exception exception, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SendQuoteRequestedAsync(Order order, User? user, string? guestEmail = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SendBookingCreatedAsync(Order order, User? user, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SendPaymentReceivedAsync(Order order, User? user, decimal paidAmount, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SendPaymentIssueAsync(Order order, User? user, decimal amount, string paymentStatus, string? reference, string? reason, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
