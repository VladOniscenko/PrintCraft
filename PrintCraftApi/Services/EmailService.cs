using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using PrintCraftApi.Data;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.RegularExpressions;

namespace PrintCraftApi.Services;

public sealed class EmailOptions
{
    public string SenderName { get; set; } = "PrintCraft";
    public string SenderEmail { get; set; } = "noreply@printcraft.local";
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = true;
}

public interface IEmailService
{
    Task SendResetPasswordEmailAsync(string toEmail, string toName, string resetLink);
    Task SendQuoteRequestedEmailAsync(string toEmail, string toName, Guid orderId);
    Task SendQuoteConfirmationEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage);
    Task SendQuoteConfirmationBankTransferEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage, string paymentReference);
    Task SendOrderSentTrackingEmailAsync(string toEmail, string toName, Guid orderId, string trackingCode, string? trackingUrl);
    Task SendOrderPaidEmailAsync(string toEmail, string toName, Guid orderId, decimal amount);
    Task SendCustomEmailAsync(string toEmail, string toName, string subject, string body);
}

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

    private async Task<(string Subject, string Body)> GetTemplateAsync(string templateName, Dictionary<string, string> variables)
    {
        var template = await _db.EmailTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TemplateName == templateName);

        var subject = template?.Subject ?? $"Notification: {templateName}";
        var body = template?.Body ?? "No template found.";

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
            { "ResetLink", resetLink }
        };

        var (subject, body) = await GetTemplateAsync("ResetPassword", variables);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public async Task SendQuoteRequestedEmailAsync(string toEmail, string toName, Guid orderId)
    {
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "OrderId", orderId.ToString() }
        };

        var (subject, body) = await GetTemplateAsync("QuoteRequested", variables);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public async Task SendQuoteConfirmationEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage)
    {
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "OrderId", orderId.ToString() },
            { "Price", price.ToString("F2") },
            { "QuoteMessage", quoteMessage ?? "" }
        };

        var (subject, body) = await GetTemplateAsync("QuoteConfirmation", variables);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public async Task SendQuoteConfirmationBankTransferEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage, string paymentReference)
    {
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "OrderId", orderId.ToString() },
            { "Price", price.ToString("F2") },
            { "QuoteMessage", quoteMessage ?? "" },
            { "PaymentReference", paymentReference }
        };

        var (subject, body) = await GetTemplateAsync("QuoteConfirmationBankTransfer", variables);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public async Task SendOrderSentTrackingEmailAsync(string toEmail, string toName, Guid orderId, string trackingCode, string? trackingUrl)
    {
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "OrderId", orderId.ToString() },
            { "TrackingCode", trackingCode },
            { "TrackingUrl", trackingUrl ?? "" }
        };

        var (subject, body) = await GetTemplateAsync("OrderSentTracking", variables);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public async Task SendOrderPaidEmailAsync(string toEmail, string toName, Guid orderId, decimal amount)
    {
        var variables = new Dictionary<string, string>
        {
            { "CustomerName", WebUtility.HtmlEncode(toName) },
            { "OrderId", orderId.ToString() },
            { "Amount", amount.ToString("F2") }
        };

        var (subject, body) = await GetTemplateAsync("OrderPaid", variables);
        await SendTextEmailAsync(toEmail, subject, body);
    }

    public Task SendCustomEmailAsync(string toEmail, string toName, string subject, string body)
    {
        var safeSubject = string.IsNullOrWhiteSpace(subject)
            ? "PrintCraft"
            : subject.Trim();

        var safeBody = string.IsNullOrWhiteSpace(body)
            ? ""
            : body.Trim();

        return SendTextEmailAsync(toEmail, safeSubject, safeBody);
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

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.SenderName, _options.SenderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("plain")
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
