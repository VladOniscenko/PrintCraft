using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;
using System.Security.Claims;
using Xunit;

namespace PrintCraftApi.Tests;

public class MultilingualPreferenceTests
{
    private static PrintCraftDb CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        var db = new PrintCraftDb(options);
        EmailTemplateSeeder.EnsureDatabaseSeededAsync(db).GetAwaiter().GetResult();
        return db;
    }

    private static EmailTemplatesController CreateEmailController(PrintCraftDb db)
    {
        var options = Options.Create(new EmailOptions
        {
            SenderName = "PrintCraft Test",
            SenderEmail = "noreply@printmy3d.work",
            LogoUrl = "https://printmy3d.work/favicon.svg"
        });

        return new EmailTemplatesController(
            db,
            new FakeEmailService(),
            options,
            NullLogger<EmailTemplatesController>.Instance);
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

    [Fact]
    public async Task GetAll_WithLanguageFilter_ReturnsOnlyTemplatesForThatLanguage()
    {
        using var db = CreateDbContext();
        var controller = CreateEmailController(db);

        var enResult = await controller.GetAll("en");
        var enOk = Assert.IsType<OkObjectResult>(enResult);
        var enTemplates = Assert.IsAssignableFrom<List<EmailTemplatesController.EmailTemplateDto>>(enOk.Value);

        Assert.Equal(6, enTemplates.Count);
        Assert.All(enTemplates, t => Assert.Equal("en", t.Language));

        var nlResult = await controller.GetAll("nl");
        var nlOk = Assert.IsType<OkObjectResult>(nlResult);
        var nlTemplates = Assert.IsAssignableFrom<List<EmailTemplatesController.EmailTemplateDto>>(nlOk.Value);

        Assert.Equal(6, nlTemplates.Count);
        Assert.All(nlTemplates, t => Assert.Equal("nl", t.Language));
    }

    [Fact]
    public async Task UpdateLanguagePreference_UpdatesUserInDatabase()
    {
        using var db = CreateDbContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "customer@example.com",
            Name = "Dutch Customer",
            PreferredLanguage = "en",
            PasswordHash = "fakehash"
        };
        await db.Users.AddAsync(user);
        await db.SaveChangesAsync();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "JwtSecret", "12345678901234567890123456789012" }
            })
            .Build();

        var controller = new AuthController(
            db,
            config,
            new FakeEmailService(),
            NullLogger<AuthController>.Instance);

        var httpContext = new DefaultHttpContext();
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, user.Email)
        };
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };

        var req = new UpdateLanguagePreferenceRequest("nl");
        var result = await controller.UpdatePreferredLanguage(req);
        var ok = Assert.IsType<OkObjectResult>(result);

        var updatedUser = await db.Users.FindAsync(userId);
        Assert.NotNull(updatedUser);
        Assert.Equal("nl", updatedUser.PreferredLanguage);
    }

    [Fact]
    public async Task GmailSmtpEmailService_ResolvesPreferredLanguage_FromUserOrOrder()
    {
        using var db = CreateDbContext();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "user_nl@example.com",
            Name = "NL User",
            PreferredLanguage = "nl",
            PasswordHash = "hash"
        };
        await db.Users.AddAsync(user);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Language = "en", // Order was created in en, but user preference is nl
            FullName = "NL User",
            AddressLine1 = "Kalverstraat 1",
            City = "Amsterdam",
            PostalCode = "1012 NX",
            PhoneNumber = "+31612345678",
            Status = "quote_requested"
        };
        await db.Orders.AddAsync(order);
        await db.SaveChangesAsync();

        var config = new ConfigurationBuilder().Build();
        var service = new GmailSmtpEmailService(
            Options.Create(new EmailOptions { SenderEmail = "test@example.com", SenderName = "PrintCraft" }),
            config,
            db);

        var resolvedLang = await service.ResolveLanguageForOrderAsync(order.Id);
        Assert.Equal("nl", resolvedLang);

        var resolvedUserLang = await service.ResolveLanguageForUserEmailAsync("user_nl@example.com");
        Assert.Equal("nl", resolvedUserLang);

        var (subject, _) = await service.GetTemplateAsync("QuoteRequested", new Dictionary<string, string>
        {
            { "CustomerName", "NL User" },
            { "ShortOrderId", "12345678" }
        }, resolvedLang);

        Assert.Contains("offerte", subject, StringComparison.OrdinalIgnoreCase);

        // Guest order fallback to order language
        var guestOrder = new Order
        {
            Id = Guid.NewGuid(),
            Language = "nl",
            FullName = "Guest User",
            AddressLine1 = "Dam 1",
            City = "Amsterdam",
            PostalCode = "1012 JS",
            PhoneNumber = "+31612345678",
            Status = "quote_requested"
        };
        await db.Orders.AddAsync(guestOrder);
        await db.SaveChangesAsync();

        var guestLang = await service.ResolveLanguageForOrderAsync(guestOrder.Id);
        Assert.Equal("nl", guestLang);
    }

    [Fact]
    public void OrderDetailsMapper_MapsLanguageAndPreferredLanguage()
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            Language = "nl",
            FullName = "Alex Maker",
            AddressLine1 = "Kalverstraat 1",
            City = "Amsterdam",
            PostalCode = "1012 NX",
            PhoneNumber = "+31612345678",
            Status = "ready_to_print",
            IsPaid = true
        };

        var dto = OrderDetailsMapper.MapToDetailsDto(order, customerEmail: "alex@example.com", preferredLanguage: "nl");

        Assert.Equal("nl", dto.Language);
        Assert.NotNull(dto.Customer);
        Assert.Equal("nl", dto.Customer.PreferredLanguage);
    }
}
