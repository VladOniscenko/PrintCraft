using System.Net.Mail;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/email-templates")]
[Authorize(Roles = "admin")]
public class EmailTemplatesController : ControllerBase
{
    private static readonly HashSet<string> SystemTemplateNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "ResetPassword",
        "QuoteRequested",
        "QuoteConfirmation",
        "QuoteConfirmationBankTransfer",
        "OrderSentTracking",
        "OrderPaid"
    };

    private static readonly Dictionary<string, string> DefaultMockVariables = new()
    {
        { "CustomerName", "Alex Maker" },
        { "OrderId", "E4A8F201" },
        { "ShortOrderId", "E4A8F201" },
        { "OrderUrl", "https://printmy3d.work/orders/00000000-0000-0000-0000-000000000001" },
        { "LogoUrl", "https://printmy3d.work/favicon.svg" },
        { "ResetLink", "https://printmy3d.work/reset-password?token=sample-reset-token-xyz" },
        { "Price", "29.95" },
        { "Amount", "29.95" },
        { "QuoteMessage", "0.20mm layer height in Eco PLA Black with 20% infill." },
        { "PaymentReference", "PC-2026-8812" },
        { "TrackingCode", "3STEST987654321NL" },
        { "TrackingUrl", "https://postnl.nl/tracktrace/?B=3STEST987654321NL" }
    };

    private readonly PrintCraftDb _db;
    private readonly IEmailService _emailService;
    private readonly EmailOptions _emailOptions;
    private readonly ILogger<EmailTemplatesController> _logger;

    public EmailTemplatesController(
        PrintCraftDb db,
        IEmailService emailService,
        IOptions<EmailOptions> emailOptions,
        ILogger<EmailTemplatesController> logger)
    {
        _db = db;
        _emailService = emailService;
        _emailOptions = emailOptions.Value;
        _logger = logger;
    }

    public sealed class CreateEmailTemplateRequest
    {
        public string TemplateName { get; set; } = string.Empty;
        public string Language { get; set; } = "en";
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }

    public sealed class UpdateEmailTemplateRequest
    {
        public string TemplateName { get; set; } = string.Empty;
        public string Language { get; set; } = "en";
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }

    public sealed class PreviewRawTemplateRequest
    {
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public Dictionary<string, string>? Variables { get; set; }
    }

    public sealed class PreviewTemplateResponse
    {
        public string TemplateName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string HtmlBody { get; set; } = string.Empty;
        public Dictionary<string, string> Variables { get; set; } = new();
    }

    public sealed class SendTestEmailRequest
    {
        public string RecipientEmail { get; set; } = string.Empty;
        public Dictionary<string, string>? Variables { get; set; }
    }

    public sealed class EmailTemplateDto
    {
        public Guid Id { get; set; }
        public string TemplateName { get; set; } = string.Empty;
        public string Language { get; set; } = "en";
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsSystemTemplate { get; set; }
        public List<string> DetectedPlaceholders { get; set; } = new();
    }

    /// <summary>
    /// Gets all email templates.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? language = null, CancellationToken cancellationToken = default)
    {
        var query = _db.EmailTemplates.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(language))
        {
            var cleanLang = language.Trim().ToLowerInvariant();
            query = query.Where(t => t.Language == cleanLang);
        }

        var templates = await query
            .OrderBy(t => t.TemplateName)
            .ThenBy(t => t.Language)
            .ToListAsync(cancellationToken);

        var dtos = templates.Select(t => new EmailTemplateDto
        {
            Id = t.Id,
            TemplateName = t.TemplateName,
            Language = t.Language,
            Subject = t.Subject,
            Body = t.Body,
            IsSystemTemplate = SystemTemplateNames.Contains(t.TemplateName),
            DetectedPlaceholders = ExtractPlaceholders(t.Subject + " " + t.Body)
        }).ToList();

        return Ok(dtos);
    }

    /// <summary>
    /// Gets a single email template by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var template = await _db.EmailTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (template is null)
            return NotFound(new { message = "Email template not found." });

        var dto = new EmailTemplateDto
        {
            Id = template.Id,
            TemplateName = template.TemplateName,
            Language = template.Language,
            Subject = template.Subject,
            Body = template.Body,
            IsSystemTemplate = SystemTemplateNames.Contains(template.TemplateName),
            DetectedPlaceholders = ExtractPlaceholders(template.Subject + " " + template.Body)
        };

        return Ok(dto);
    }

    /// <summary>
    /// Creates a new custom email template.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmailTemplateRequest request, CancellationToken cancellationToken = default)
    {
        var cleanName = (request.TemplateName ?? "").Trim();
        var cleanSubject = (request.Subject ?? "").Trim();
        var cleanBody = (request.Body ?? "").Trim();
        var lang = string.Equals(request.Language?.Trim(), "nl", StringComparison.OrdinalIgnoreCase) ? "nl" : "en";

        if (string.IsNullOrWhiteSpace(cleanName))
            return BadRequest(new { message = "Template name is required." });

        if (!Regex.IsMatch(cleanName, @"^[a-zA-Z0-9_-]+$"))
            return BadRequest(new { message = "Template name may only contain letters, numbers, underscores and hyphens." });

        if (string.IsNullOrWhiteSpace(cleanSubject))
            return BadRequest(new { message = "Subject is required." });

        if (string.IsNullOrWhiteSpace(cleanBody))
            return BadRequest(new { message = "Body HTML is required." });

        var lowerName = cleanName.ToLower();
        var exists = await _db.EmailTemplates.AnyAsync(
            t => t.TemplateName.ToLower() == lowerName && t.Language == lang,
            cancellationToken);

        if (exists)
            return BadRequest(new { message = $"A template with name '{cleanName}' and language '{lang}' already exists." });

        var template = new EmailTemplate
        {
            Id = Guid.NewGuid(),
            TemplateName = cleanName,
            Language = lang,
            Subject = cleanSubject,
            Body = cleanBody
        };

        _db.EmailTemplates.Add(template);
        await _db.SaveChangesAsync(cancellationToken);

        var dto = new EmailTemplateDto
        {
            Id = template.Id,
            TemplateName = template.TemplateName,
            Language = template.Language,
            Subject = template.Subject,
            Body = template.Body,
            IsSystemTemplate = SystemTemplateNames.Contains(template.TemplateName),
            DetectedPlaceholders = ExtractPlaceholders(template.Subject + " " + template.Body)
        };

        return CreatedAtAction(nameof(GetById), new { id = template.Id }, dto);
    }

    /// <summary>
    /// Updates an existing email template.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmailTemplateRequest request, CancellationToken cancellationToken = default)
    {
        var template = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (template is null)
            return NotFound(new { message = "Email template not found." });

        var cleanName = (request.TemplateName ?? "").Trim();
        var cleanSubject = (request.Subject ?? "").Trim();
        var cleanBody = (request.Body ?? "").Trim();
        var lang = string.Equals(request.Language?.Trim(), "nl", StringComparison.OrdinalIgnoreCase) ? "nl" : "en";

        if (string.IsNullOrWhiteSpace(cleanName))
            return BadRequest(new { message = "Template name is required." });

        if (!Regex.IsMatch(cleanName, @"^[a-zA-Z0-9_-]+$"))
            return BadRequest(new { message = "Template name may only contain letters, numbers, underscores and hyphens." });

        if (string.IsNullOrWhiteSpace(cleanSubject))
            return BadRequest(new { message = "Subject is required." });

        if (string.IsNullOrWhiteSpace(cleanBody))
            return BadRequest(new { message = "Body HTML is required." });

        var isSystemTemplate = SystemTemplateNames.Contains(template.TemplateName);
        if (isSystemTemplate && !string.Equals(template.TemplateName, cleanName, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Cannot rename a core system template identifier." });
        }

        var lowerName = cleanName.ToLower();
        var duplicateName = await _db.EmailTemplates.AnyAsync(
            t => t.Id != id && t.TemplateName.ToLower() == lowerName && t.Language == lang,
            cancellationToken);

        if (duplicateName)
            return BadRequest(new { message = $"A template with name '{cleanName}' and language '{lang}' already exists." });

        template.TemplateName = cleanName;
        template.Language = lang;
        template.Subject = cleanSubject;
        template.Body = cleanBody;

        await _db.SaveChangesAsync(cancellationToken);

        var dto = new EmailTemplateDto
        {
            Id = template.Id,
            TemplateName = template.TemplateName,
            Language = template.Language,
            Subject = template.Subject,
            Body = template.Body,
            IsSystemTemplate = isSystemTemplate,
            DetectedPlaceholders = ExtractPlaceholders(template.Subject + " " + template.Body)
        };

        return Ok(dto);
    }

    /// <summary>
    /// Deletes a custom email template.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var template = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (template is null)
            return NotFound(new { message = "Email template not found." });

        if (SystemTemplateNames.Contains(template.TemplateName))
        {
            return BadRequest(new { message = $"Core system template '{template.TemplateName}' cannot be deleted. You can edit its contents or reset to defaults." });
        }

        _db.EmailTemplates.Remove(template);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Previews a stored email template with mock data.
    /// </summary>
    [HttpPost("{id:guid}/preview")]
    public async Task<IActionResult> PreviewById(Guid id, [FromBody] Dictionary<string, string>? customVars, CancellationToken cancellationToken = default)
    {
        var template = await _db.EmailTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (template is null)
            return NotFound(new { message = "Email template not found." });

        var merged = MergeVariables(customVars);
        var renderedSubject = RenderPlaceholders(template.Subject, merged);
        var renderedBody = RenderPlaceholders(template.Body, merged);

        return Ok(new PreviewTemplateResponse
        {
            TemplateName = template.TemplateName,
            Subject = renderedSubject,
            HtmlBody = renderedBody,
            Variables = merged
        });
    }

    /// <summary>
    /// Previews raw subject and body HTML in real-time before saving.
    /// </summary>
    [HttpPost("preview-raw")]
    public IActionResult PreviewRaw([FromBody] PreviewRawTemplateRequest request)
    {
        var merged = MergeVariables(request.Variables);
        var renderedSubject = RenderPlaceholders(request.Subject ?? "", merged);
        var renderedBody = RenderPlaceholders(request.Body ?? "", merged);

        return Ok(new PreviewTemplateResponse
        {
            TemplateName = "LiveDraft",
            Subject = renderedSubject,
            HtmlBody = renderedBody,
            Variables = merged
        });
    }

    /// <summary>
    /// Sends a test email of the specified template to an admin recipient.
    /// </summary>
    [HttpPost("{id:guid}/send-test")]
    public async Task<IActionResult> SendTest(Guid id, [FromBody] SendTestEmailRequest request, CancellationToken cancellationToken = default)
    {
        var template = await _db.EmailTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (template is null)
            return NotFound(new { message = "Email template not found." });

        var cleanEmail = (request.RecipientEmail ?? "").Trim();
        if (string.IsNullOrWhiteSpace(cleanEmail) || !IsValidEmail(cleanEmail))
        {
            return BadRequest(new { message = "A valid recipient email address is required." });
        }

        var merged = MergeVariables(request.Variables);
        var renderedSubject = RenderPlaceholders(template.Subject, merged);
        var renderedBody = RenderPlaceholders(template.Body, merged);

        var testSubject = $"[TEST] {renderedSubject}";
        await _emailService.SendCustomEmailAsync(cleanEmail, "Admin Tester", testSubject, renderedBody);

        _logger.LogInformation("Enqueued test email for template {TemplateName} to {Recipient}", template.TemplateName, cleanEmail);

        return Ok(new
        {
            message = $"Test email for template '{template.TemplateName}' successfully queued to {cleanEmail}."
        });
    }

    /// <summary>
    /// Resets all email templates back to system seeder defaults.
    /// </summary>
    [HttpPost("reset-defaults")]
    public async Task<IActionResult> ResetDefaults()
    {
        var result = await EmailTemplateSeeder.EnsureDatabaseSeededAsync(_db, forceReload: true);
        return Ok(new
        {
            message = "Default email templates restored successfully.",
            details = result
        });
    }

    private Dictionary<string, string> MergeVariables(Dictionary<string, string>? customVars)
    {
        var merged = new Dictionary<string, string>(DefaultMockVariables, StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(_emailOptions.LogoUrl))
        {
            merged["LogoUrl"] = _emailOptions.LogoUrl;
        }

        if (customVars != null)
        {
            foreach (var (k, v) in customVars)
            {
                merged[k] = v;
            }
        }
        return merged;
    }

    private static string RenderPlaceholders(string text, Dictionary<string, string> variables)
    {
        if (string.IsNullOrEmpty(text)) return string.Empty;
        foreach (var (key, val) in variables)
        {
            text = text.Replace($"{{{{{key}}}}}", val);
        }
        return text;
    }

    private static List<string> ExtractPlaceholders(string content)
    {
        if (string.IsNullOrEmpty(content)) return new();
        var matches = Regex.Matches(content, @"\{\{([a-zA-Z0-9_-]+)\}\}");
        return matches
            .Select(m => m.Groups[1].Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(k => k)
            .ToList();
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}
