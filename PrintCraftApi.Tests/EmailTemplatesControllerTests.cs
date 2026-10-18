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

        Assert.Equal(12, templates.Count);
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

    [Fact]
    public async Task Update_UpdatesExistingTemplateSuccessfully()
    {
        using var db = CreateDbContext();
        var controller = CreateController(db);

        var templateId = Guid.Parse("00000000-0000-0000-0000-000000000006"); // OrderPaid
        var req = new EmailTemplatesController.UpdateEmailTemplateRequest
        {
            TemplateName = "OrderPaid",
            Subject = "Updated Subject for OrderPaid",
            Body = "<p>Updated body content without prices</p>"
        };

        var result = await controller.Update(templateId, req);
        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<EmailTemplatesController.EmailTemplateDto>(ok.Value);

        Assert.Equal("Updated Subject for OrderPaid", dto.Subject);
        Assert.Equal("<p>Updated body content without prices</p>", dto.Body);
        Assert.True(dto.IsSystemTemplate);

        var updatedInDb = await db.EmailTemplates.FindAsync(templateId);
        Assert.NotNull(updatedInDb);
        Assert.Equal("Updated Subject for OrderPaid", updatedInDb.Subject);
    }

    [Fact]
    public void SeededDefaultTemplates_DoNotContainPricesOrSlicingPreviewHeader()
    {
        var defaults = EmailTemplateSeeder.GetDefaultTemplates();
        Assert.NotEmpty(defaults);

        foreach (var template in defaults)
        {
            Assert.DoesNotContain("3D CAD / Slicing Preview", template.Body);
            Assert.DoesNotContain("&euro;", template.Body, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("€", template.Body);
            Assert.DoesNotContain("{{Price}}", template.Body);
            Assert.DoesNotContain("{{Amount}}", template.Body);
        }
    }

    [Fact]
    public async Task EnsureDatabaseSeeded_AutomaticallyUpgradesLegacyTemplatesWithPricesOrSlicingPreview()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        using var db = new PrintCraftDb(options);

        // Seed a legacy template
        var legacy = new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            TemplateName = "QuoteConfirmation",
            Subject = "Legacy Subject",
            Body = "<div>3D CAD / Slicing Preview</div><p>Total Price: &euro;{{Price}}</p>"
        };
        await db.EmailTemplates.AddAsync(legacy);
        await db.SaveChangesAsync();

        var result = await EmailTemplateSeeder.EnsureDatabaseSeededAsync(db, forceReload: false);

        Assert.True(result.Updated > 0);
        var updated = await db.EmailTemplates.FirstAsync(t => t.Id == legacy.Id);
        Assert.DoesNotContain("3D CAD / Slicing Preview", updated.Body);
        Assert.DoesNotContain("&euro;", updated.Body);
        Assert.DoesNotContain("{{Price}}", updated.Body);
    }

    [Fact]
    public void OrderPaid_Template_HasValidTableNestingAndCenteredLayout()
    {
        var defaults = EmailTemplateSeeder.GetDefaultTemplates();
        var orderPaidTemplates = defaults.Where(t => t.TemplateName == "OrderPaid").ToList();

        Assert.Equal(2, orderPaidTemplates.Count); // EN and NL

        foreach (var template in orderPaidTemplates)
        {
            // Must not contain rogue tr tag inside td
            Assert.DoesNotContain("padding-bottom: 8px;", template.Body);
            Assert.DoesNotContain("<!-- Hero Icon Section -->\n          <tr>", template.Body);
            Assert.DoesNotContain("<!-- Hero Icon Section -->\r\n          <tr>", template.Body);

            // Must have centered styling
            Assert.Contains("text-align: center;", template.Body);
            Assert.Contains("align=\"center\"", template.Body);
            Assert.Contains("font-size: 28px;", template.Body); // checkmark icon
            Assert.Contains("&#10003;", template.Body);
        }
    }

    [Fact]
    public async Task EnsureDatabaseSeeded_AutomaticallyUpgradesCorruptedOrderPaidTemplate()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        using var db = new PrintCraftDb(options);

        // Seed broken OrderPaid template with invalid nested tr inside td
        var brokenId = Guid.Parse("00000000-0000-0000-0000-000000000016");
        var brokenTemplate = new EmailTemplate
        {
            Id = brokenId,
            TemplateName = "OrderPaid",
            Language = "nl",
            Subject = "Betaling bevestigd voor bestelling #{{ShortOrderId}}",
            Body = """
            <table>
              <tr>
                <td style="padding: 32px 40px; text-align: center;">
                  <!-- Hero Icon Section -->
                  <tr>
                    <td align="center" style="padding-bottom: 8px;">
                      <span>&#10003;</span>
                    </td>
                  </tr>
                  <h1>Betaling Ontvangen</h1>
                </td>
              </tr>
            </table>
            """
        };
        await db.EmailTemplates.AddAsync(brokenTemplate);
        await db.SaveChangesAsync();

        var result = await EmailTemplateSeeder.EnsureDatabaseSeededAsync(db, forceReload: false);

        Assert.True(result.Updated > 0);
        var updated = await db.EmailTemplates.FirstAsync(t => t.Id == brokenId);
        Assert.DoesNotContain("padding-bottom: 8px;", updated.Body);
        Assert.Contains("Betaling Ontvangen — Print Ingewilligd!", updated.Body);
        Assert.Contains("text-align: center;", updated.Body);
    }

    [Fact]
    public async Task PreviewById_ForDutchOrderPaid_RendersExpectedSubjectAndCenteredBody()
    {
        using var db = CreateDbContext();
        var controller = CreateController(db);

        var dutchId = Guid.Parse("00000000-0000-0000-0000-000000000016");
        var result = await controller.PreviewById(dutchId, null);
        var ok = Assert.IsType<OkObjectResult>(result);
        var val = Assert.IsType<EmailTemplatesController.PreviewTemplateResponse>(ok.Value);

        Assert.Equal("Betaling bevestigd voor bestelling #E4A8F201", val.Subject);
        Assert.Contains("Alex Maker", val.HtmlBody);
        Assert.Contains("E4A8F201", val.HtmlBody);
        Assert.Contains("Betaling Ontvangen — Print Ingewilligd!", val.HtmlBody);
        Assert.DoesNotContain("padding-bottom: 8px;", val.HtmlBody);
        Assert.Contains("text-align: center;", val.HtmlBody);
    }
}

