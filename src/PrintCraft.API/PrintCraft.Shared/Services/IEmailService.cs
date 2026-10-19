namespace PrintCraft.Shared.Services;

public sealed class EmailOptions
{
    public string SenderName { get; set; } = "Print My 3D";
    public string SenderEmail { get; set; } = "noreply@printmy3d.work";
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = true;
    public string BaseUrl { get; set; } = "https://printmy3d.work";
    public string LogoUrl { get; set; } = "https://printmy3d.work/favicon.svg";
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

