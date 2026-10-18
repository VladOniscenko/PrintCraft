using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;
using Xunit;

namespace PrintCraftApi.Tests;

public class EmailTemplatesControllerTests
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

    private static EmailTemplatesController CreateController(PrintCraftDb db)
    {
        var options = Options.Create(new EmailOptions
        {
            SenderName = "PrintCraft Test",
            SenderEmail = "noreply@printmy3d.work",
            LogoUrl = "https://printmy3d.work/favicon.svg"
        });

        return new EmailTemplatesController(
            db,
            new TestEmailService(),
            options,
            NullLogger<EmailTemplatesController>.Instance);
    }

    private sealed class TestEmailService : IEmailService
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
    public async Task GetAll_ReturnsSeededTemplatesWithSystemFlags()
    {
        using var db = CreateDbContext();
        var controller = CreateController(db);

        var result = await controller.GetAll();
        var ok = Assert.IsType<OkObjectResult>(result);
        var templates = Assert.IsAssignableFrom<List<EmailTemplatesController.EmailTemplateDto>>(ok.Value);

        Assert.Equal(6, templates.Count);
        Assert.All(templates, t => Assert.True(t.IsSystemTemplate));
        Assert.Contains(templates, t => t.TemplateName == "QuoteRequested" && t.DetectedPlaceholders.Contains("ShortOrderId"));
    }

    [Fact]
    public async Task Create_AddsCustomTemplate()
    {
        using var db = CreateDbContext();
        var controller = CreateController(db);

        var req = new EmailTemplatesController.CreateEmailTemplateRequest
        {
            TemplateName = "NewsletterPromo",
            Subject = "Special Discount for {{CustomerName}}",
            Body = "<h1>Hello {{CustomerName}}</h1><p>Enjoy your 3D prints!</p>"
        };

        var result = await controller.Create(req);
        var created = Assert.IsType<CreatedAtActionResult>(result);
        var dto = Assert.IsType<EmailTemplatesController.EmailTemplateDto>(created.Value);

        Assert.Equal("NewsletterPromo", dto.TemplateName);
        Assert.False(dto.IsSystemTemplate);
        Assert.Contains("CustomerName", dto.DetectedPlaceholders);

        var stored = await db.EmailTemplates.FirstOrDefaultAsync(t => t.TemplateName == "NewsletterPromo");
        Assert.NotNull(stored);
    }

    [Fact]
    public async Task Create_RejectsDuplicateTemplateName()
    {
        using var db = CreateDbContext();
        var controller = CreateController(db);

        var req = new EmailTemplatesController.CreateEmailTemplateRequest
        {
            TemplateName = "QuoteRequested", // already exists
            Subject = "Duplicate",
            Body = "<p>Test</p>"
        };

        var result = await controller.Create(req);
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task Delete_RejectsDeletingCoreSystemTemplate()
    {
        using var db = CreateDbContext();
        var controller = CreateController(db);

        var systemTemplate = await db.EmailTemplates.FirstAsync(t => t.TemplateName == "QuoteRequested");
        var result = await controller.Delete(systemTemplate.Id);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);

        var stillExists = await db.EmailTemplates.AnyAsync(t => t.Id == systemTemplate.Id);
        Assert.True(stillExists);
    }

    [Fact]
    public async Task Delete_DeletesCustomTemplate()
    {
        using var db = CreateDbContext();
        var controller = CreateController(db);

        var custom = new EmailTemplate
        {
            Id = Guid.NewGuid(),
            TemplateName = "CustomFollowUp",
            Subject = "Follow up",
            Body = "<p>Follow up</p>"
        };
        db.EmailTemplates.Add(custom);
        await db.SaveChangesAsync();

        var result = await controller.Delete(custom.Id);
        Assert.IsType<NoContentResult>(result);

        var exists = await db.EmailTemplates.AnyAsync(t => t.Id == custom.Id);
        Assert.False(exists);
    }

    [Fact]
    public void PreviewRaw_MergesPlaceholdersWithMockVariables()
    {
        using var db = CreateDbContext();
        var controller = CreateController(db);

        var req = new EmailTemplatesController.PreviewRawTemplateRequest
        {
            Subject = "Quote #{{ShortOrderId}} for {{CustomerName}}",
            Body = "<p>Hi {{CustomerName}}, order #{{ShortOrderId}} is ready! Check <a href=\"{{OrderUrl}}\">here</a>.</p>"
        };

        var result = controller.PreviewRaw(req);
        var ok = Assert.IsType<OkObjectResult>(result);
        var val = Assert.IsType<EmailTemplatesController.PreviewTemplateResponse>(ok.Value);

        Assert.Contains("Alex Maker", val.Subject);
        Assert.Contains("Alex Maker", val.HtmlBody);
        Assert.Contains("E4A8F201", val.Subject);
        Assert.Contains("https://printmy3d.work/orders/", val.HtmlBody);
    }
}
