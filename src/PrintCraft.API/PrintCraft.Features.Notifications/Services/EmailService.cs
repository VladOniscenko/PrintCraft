using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using PrintCraft.Shared.Data;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.RegularExpressions;

namespace PrintCraft.Features.Notifications.Services;

public sealed class GmailSmtpEmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly string _currencyCode;
    private readonly string _bankTransferAccountName;
    private readonly string _bankTransferIban;
    private readonly string? _bankTransferBic;
    private readonly PrintCraftDb _db;

    public GmailSmtpEmailService(
        IOptions<EmailOptions> options,
        IConfiguration configuration,
        PrintCraftDb db)
    {
        _options = options.Value;
        _currencyCode = NormalizeCurrencyCode(configuration["CurrencyCode"]);
        _bankTransferAccountName = configuration["BankTransfer:AccountName"] ?? string.Empty;
        _bankTransferIban = configuration["BankTransfer:Iban"] ?? string.Empty;
        _bankTransferBic = configuration["BankTransfer:Bic"];
        _db = db;
    }

    internal async Task<string> ResolveLanguageForOrderAsync(Guid orderId)
    {
        try
        {
            var order = await _db.Orders
                .AsNoTracking()
                .Select(o => new { o.Id, o.Language, o.UserId })
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order != null)
            {
                if (order.UserId.HasValue)
                {
                    var userLang = await _db.Users
                        .AsNoTracking()
                        .Where(u => u.Id == order.UserId.Value)
                        .Select(u => u.PreferredLanguage)
                        .FirstOrDefaultAsync();

                    if (!string.IsNullOrWhiteSpace(userLang))
                        return NormalizeLanguage(userLang);
                }

                if (!string.IsNullOrWhiteSpace(order.Language))
                    return NormalizeLanguage(order.Language);
            }
        }
        catch
        {
            // Gracefully ignore and fallback
        }

        return "en";
    }

    internal async Task<string> ResolveLanguageForUserEmailAsync(string email)
    {
        try
        {
            var cleanEmail = (email ?? "").Trim().ToLowerInvariant();
            var userLang = await _db.Users
                .AsNoTracking()
                .Where(u => u.Email == cleanEmail)
                .Select(u => u.PreferredLanguage)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrWhiteSpace(userLang))
                return NormalizeLanguage(userLang);
        }
        catch
        {
            // Gracefully ignore and fallback
        }

        return "en";
    }

    private static readonly HashSet<string> SupportedLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        "nl", "en", "tr", "ru", "ar"
    };

    internal static string NormalizeLanguage(string? lang)
    {
        if (string.IsNullOrWhiteSpace(lang)) return "en";
        var clean = lang.Trim().ToLowerInvariant();
        return SupportedLanguages.Contains(clean) ? clean : "en";
    }

    internal async Task<(string Subject, string Body)> GetTemplateAsync(string templateName, Dictionary<string, string> variables, string language = "en")
    {
        var targetLang = NormalizeLanguage(language);

        // 1. Try target language match in database (admin custom override)
        var template = await _db.EmailTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TemplateName == templateName && t.Language == targetLang);

        string subject;
        string body;

        if (template != null)
        {
            subject = template.Subject;
            body = template.Body;
        }
        else
        {
            // 2. Generate dynamically from the centralized multilingual template engine
            var generated = EmailTemplateSeeder.GenerateTemplate(templateName, targetLang);
            if (!string.IsNullOrWhiteSpace(generated.Body))
            {
                subject = generated.Subject;
                body = generated.Body;
            }
            else
            {
                // 3. Fallback to English in database if generator doesn't know this custom template
                template = await _db.EmailTemplates
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.TemplateName == templateName && t.Language == "en");

                if (template == null)
                {
                    template = await _db.EmailTemplates
                        .AsNoTracking()
                        .FirstOrDefaultAsync(t => t.TemplateName == templateName);
                }

                subject = template?.Subject ?? $"Notification: {templateName}";
                body = template?.Body ?? "No template found.";
            }
        }

        foreach (var (key, value) in variables)
        {
            var placeholder = $"{{{{{key}}}}}";
            subject = subject.Replace(placeholder, value);
            body = body.Replace(placeholder, value);
        }

        return (subject, body);
    }

    public async Task SendResetPasswordEmailAsync(string toEmail, string toName, string resetLink)
    {
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "ResetLink", resetLink },
            { "LogoUrl", _options.LogoUrl }
        };

        var lang = await ResolveLanguageForUserEmailAsync(toEmail);
        var (subject, body) = await GetTemplateAsync("ResetPassword", variables, lang);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public async Task SendQuoteRequestedEmailAsync(string toEmail, string toName, Guid orderId)
    {
        var shortOrderId = GetShortOrderId(orderId);
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "OrderId", shortOrderId },
            { "ShortOrderId", shortOrderId },
            { "OrderUrl", BuildOrderUrl(orderId) },
            { "RenderedImageUrl", await GetRenderedImageUrlAsync(orderId) },
            { "LogoUrl", _options.LogoUrl }
        };

        var lang = await ResolveLanguageForOrderAsync(orderId);
        var (subject, body) = await GetTemplateAsync("QuoteRequested", variables, lang);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public async Task SendQuoteConfirmationEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage)
    {
        var shortOrderId = GetShortOrderId(orderId);
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "OrderId", shortOrderId },
            { "ShortOrderId", shortOrderId },
            { "Price", price.ToString("F2") },
            { "QuoteMessage", quoteMessage ?? "" },
            { "OrderUrl", BuildOrderUrl(orderId) },
            { "RenderedImageUrl", await GetRenderedImageUrlAsync(orderId) },
            { "LogoUrl", _options.LogoUrl }
        };

        var lang = await ResolveLanguageForOrderAsync(orderId);
        var (subject, body) = await GetTemplateAsync("QuoteConfirmation", variables, lang);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public async Task SendQuoteConfirmationBankTransferEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage, string paymentReference)
    {
        var shortOrderId = GetShortOrderId(orderId);
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "OrderId", shortOrderId },
            { "ShortOrderId", shortOrderId },
            { "Price", price.ToString("F2") },
            { "QuoteMessage", quoteMessage ?? "" },
            { "PaymentReference", paymentReference },
            { "OrderUrl", BuildOrderUrl(orderId) },
            { "RenderedImageUrl", await GetRenderedImageUrlAsync(orderId) },
            { "LogoUrl", _options.LogoUrl }
        };

        var lang = await ResolveLanguageForOrderAsync(orderId);
        var (subject, body) = await GetTemplateAsync("QuoteConfirmationBankTransfer", variables, lang);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public async Task SendOrderSentTrackingEmailAsync(string toEmail, string toName, Guid orderId, string trackingCode, string? trackingUrl)
    {
        var shortOrderId = GetShortOrderId(orderId);
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "OrderId", shortOrderId },
            { "ShortOrderId", shortOrderId },
            { "TrackingCode", trackingCode },
            { "TrackingUrl", trackingUrl ?? "" },
            { "OrderUrl", BuildOrderUrl(orderId) },
            { "RenderedImageUrl", await GetRenderedImageUrlAsync(orderId) },
            { "LogoUrl", _options.LogoUrl }
        };

        var lang = await ResolveLanguageForOrderAsync(orderId);
        var (subject, body) = await GetTemplateAsync("OrderSentTracking", variables, lang);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public async Task SendOrderPaidEmailAsync(string toEmail, string toName, Guid orderId, decimal amount)
    {
        var shortOrderId = GetShortOrderId(orderId);
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "OrderId", shortOrderId },
            { "ShortOrderId", shortOrderId },
            { "Amount", amount.ToString("F2") },
            { "OrderUrl", BuildOrderUrl(orderId) },
            { "RenderedImageUrl", await GetRenderedImageUrlAsync(orderId) },
            { "LogoUrl", _options.LogoUrl }
        };

        var lang = await ResolveLanguageForOrderAsync(orderId);
        var (subject, body) = await GetTemplateAsync("OrderPaid", variables, lang);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public Task SendCustomEmailAsync(string toEmail, string toName, string subject, string body)
    {
        var safeSubject = string.IsNullOrWhiteSpace(subject)
            ? "Print My 3D"
            : subject.Trim();

        var safeBody = string.IsNullOrWhiteSpace(body)
            ? ""
            : body.Trim();

        return SendTextEmailAsync(toEmail, safeSubject, safeBody);
    }

    public async Task SendSupportTicketCreatedEmailsAsync(SupportTicket ticket)
    {
        var ticketRef = ticket.Id.ToString("N")[..8].ToUpperInvariant();
        var safeSubject = ticket.Subject?.Trim() ?? "Support Request";

        // 1. User acknowledgment email
        var userSubject = $"Support Request Received: {safeSubject} [#{ticketRef}]";
        var orderInfo = ticket.OrderId.HasValue ? $"\nAssociated Order ID: {ticket.OrderId.Value}" : "";
        var attachmentsInfo = ticket.AttachmentUrls.Count > 0 ? $"\nAttachments: {string.Join(", ", ticket.AttachmentUrls)}" : "";

        var userBody = $@"Hello,

Thank you for contacting Print My 3D. We have received your request and our support team will review it shortly.

Ticket Reference: #{ticketRef}
Category: {ticket.Category}
Subject: {safeSubject}{orderInfo}

Description:
{ticket.Description}{attachmentsInfo}

If you have any additional information to add, please reply to this email.

Best regards,
Print My 3D Team
{_options.BaseUrl}";

        try
        {
            await SendTextEmailAsync(ticket.UserEmail, userSubject, userBody);
        }
        catch (Exception)
        {
            // Logged by background worker or caller
            if (string.IsNullOrWhiteSpace(_options.SmtpHost))
            {
                // In dev with no SMTP configured, do not throw
            }
            else
            {
                throw;
            }
        }

        // 2. Admin alert email
        var adminEmail = _options.SenderEmail;
        if (!string.IsNullOrWhiteSpace(adminEmail))
        {
            var adminSubject = $"🚨 New Support Ticket: [{ticket.Category}] - {safeSubject}";
            var adminBody = $@"New Support Ticket Submitted:

Ticket ID: {ticket.Id}
Reference: #{ticketRef}
Category: {ticket.Category}
User Email: {ticket.UserEmail}
User ID: {(ticket.UserId.HasValue ? ticket.UserId.Value.ToString() : "Guest")}
Order ID: {(ticket.OrderId.HasValue ? ticket.OrderId.Value.ToString() : "N/A")}
Subject: {safeSubject}

Description:
{ticket.Description}{attachmentsInfo}

Created At: {ticket.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC
Admin Portal: {_options.BaseUrl.TrimEnd('/')}/admin/support-tickets";

            try
            {
                await SendTextEmailAsync(adminEmail, adminSubject, adminBody);
            }
            catch (Exception)
            {
                if (!string.IsNullOrWhiteSpace(_options.SmtpHost))
                {
                    throw;
                }
            }
        }
    }

    private static string GetShortOrderId(Guid orderId) =>
        orderId.ToString("N")[..8].ToUpperInvariant();

    private string BuildOrderUrl(Guid orderId) =>
        $"{_options.BaseUrl.TrimEnd('/')}/orders/{orderId}";

    private async Task<string> GetRenderedImageUrlAsync(Guid orderId)
    {
        try
        {
            var item = await _db.OrderItems
                .AsNoTracking()
                .Where(i => i.OrderId == orderId && !string.IsNullOrEmpty(i.ImageUrl))
                .FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(item?.ImageUrl))
            {
                var img = item.ImageUrl.Trim();
                if (img.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || img.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                {
                    return img;
                }
                return $"{_options.BaseUrl.TrimEnd('/')}/{img.TrimStart('/')}";
            }
        }
        catch
        {
            // Gracefully ignore database lookup failure
        }

        return $"{_options.BaseUrl.TrimEnd('/')}/uploads/hero/materials.svg";
    }

    private async Task SendTextEmailAsync(string toEmail, string subject, string body)
    {
        if (!string.IsNullOrWhiteSpace(_options.SmtpHost))
        {
            await SendViaSmtpAsync(toEmail, subject, body);
            return;
        }

        throw new InvalidOperationException("SMTP email is not configured. Missing Email:SmtpHost.");
    }

    private async Task SendViaSmtpAsync(string toEmail, string subject, string body)
    {
        var smtpUser = string.IsNullOrWhiteSpace(_options.Username)
            ? Environment.GetEnvironmentVariable("Email__Username")
            : _options.Username;
        var smtpPassword = string.IsNullOrWhiteSpace(_options.Password)
            ? Environment.GetEnvironmentVariable("Email__Password")
            : _options.Password;


        if (string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPassword))
        {
            throw new InvalidOperationException("SMTP email is not configured. Missing Email:Username or Email:Password.");
        }

        smtpUser = smtpUser.Trim();
        smtpPassword = new string(smtpPassword.Where(c => !char.IsWhiteSpace(c)).ToArray());

        var isHtml = body.Contains("<html", StringComparison.OrdinalIgnoreCase)
                  || body.Contains("<table", StringComparison.OrdinalIgnoreCase)
                  || body.Contains("<div", StringComparison.OrdinalIgnoreCase);

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.SenderName, _options.SenderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart(isHtml ? "html" : "plain")
        {
            Text = body
        };

        using var client = new MailKit.Net.Smtp.SmtpClient();
        client.ServerCertificateValidationCallback = (_, _, _, _) => true;
        client.AuthenticationMechanisms.Remove("XOAUTH2");

        var secureSocketOptions = _options.SmtpPort == 465
            ? SecureSocketOptions.SslOnConnect
            : _options.EnableSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

        await client.ConnectAsync(_options.SmtpHost, _options.SmtpPort, secureSocketOptions);
        await client.AuthenticateAsync(smtpUser, smtpPassword);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }

    private static string NormalizeCurrencyCode(string? currencyCode)
    {
        var normalized = (currencyCode ?? "EUR").Trim().ToUpperInvariant();
        return normalized.Length == 3 ? normalized : "EUR";
    }
}
