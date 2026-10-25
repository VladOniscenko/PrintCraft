using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using PrintCraft.Shared.Models;

namespace PrintCraft.Features.Notifications.Services;

public sealed class DiscordWebhookService : IDiscordWebhookService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DiscordWebhookService> _logger;
    private readonly string _environmentLabel;

    public DiscordWebhookService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<DiscordWebhookService> logger,
        IHostEnvironment hostEnvironment)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _environmentLabel = GetEnvironmentLabel(hostEnvironment.EnvironmentName);
    }

    public Task SendUnhandledExceptionAsync(HttpContext context, Exception exception, CancellationToken cancellationToken = default)
    {
        var webhookUrl = _configuration["Discord:ErrorWebhookUrl"];
        if (string.IsNullOrWhiteSpace(webhookUrl)) return Task.CompletedTask;

        var userId = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "anonymous";

        var embed = new DiscordEmbed
        {
            Title = "⚠️ Unhandled Exception",
            Color = 15158332, // Red
            Fields = new[]
            {
                new DiscordField { Name = "Method", Value = context.Request.Method, Inline = true },
                new DiscordField { Name = "Path", Value = context.Request.Path.ToString(), Inline = true },
                new DiscordField { Name = "User ID", Value = userId, Inline = true },
                new DiscordField { Name = "Exception Type", Value = exception.GetType().Name, Inline = true },
                new DiscordField { Name = "Message", Value = exception.Message, Inline = false },
                new DiscordField { Name = "Stack Trace", Value = $"```{exception.StackTrace?.Substring(0, Math.Min(500, exception.StackTrace?.Length ?? 0))}...```", Inline = false },
                new DiscordField { Name = "Trace ID", Value = context.TraceIdentifier, Inline = false },
            },
            Timestamp = DateTime.UtcNow.ToString("o")
        };

        return PostToWebhookAsync(webhookUrl, embed, "global exception", cancellationToken);
    }

    public async Task SendQuoteRequestedAsync(Order order, User? user, string? guestEmail = null, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("=== SendQuoteRequestedAsync START for order {OrderId} ===", order.Id);

        var webhookUrl = _configuration["Discord:QuoteWebhookUrl"];
        _logger.LogInformation("Quote webhook URL from config: {Url}", webhookUrl ?? "NULL");

        if (string.IsNullOrWhiteSpace(webhookUrl))
        {
            var fallbackWebhookUrl = _configuration["Discord:ErrorWebhookUrl"];
            _logger.LogWarning("Discord quote webhook is not configured. Fallback URL: {FallbackUrl}", fallbackWebhookUrl ?? "NULL");
            if (string.IsNullOrWhiteSpace(fallbackWebhookUrl))
            {
                _logger.LogWarning("No fallback webhook available. Aborting notification.");
                return;
            }

            _logger.LogWarning("Discord quote webhook is not configured. Falling back to error webhook channel.");
            webhookUrl = fallbackWebhookUrl;
        }

        var customerName = !string.IsNullOrWhiteSpace(user?.Name)
            ? user!.Name
            : (!string.IsNullOrWhiteSpace(order.FullName) ? order.FullName : "Guest customer");
        var customerEmail = !string.IsNullOrWhiteSpace(user?.Email)
            ? user!.Email
            : (string.IsNullOrWhiteSpace(guestEmail) ? "not provided" : guestEmail);

        bool isCustomRequest = string.Equals(order.RequestType, "CustomRequest", StringComparison.OrdinalIgnoreCase);

        var title = isCustomRequest
            ? $"💡 New Custom Design Request from {customerEmail}"
            : (order.IsExpress ? "⚡ 🧾 New Express Quote Request" : "🧾 New Quote Request");

        int color = isCustomRequest ? 16763904 // Gold / Amber
            : (order.IsExpress ? 16744448 // Bright Orange
            : 3066993); // Blue-green

        var fields = new List<DiscordField>
        {
            new DiscordField { Name = "Order ID", Value = order.Id.ToString(), Inline = true },
            new DiscordField { Name = "Created", Value = order.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss UTC"), Inline = true },
            new DiscordField { Name = "Status", Value = order.Status, Inline = true },
            new DiscordField { Name = "Customer Name", Value = customerName, Inline = true },
            new DiscordField { Name = "Email", Value = customerEmail, Inline = true },
            new DiscordField { Name = "Item Count", Value = order.Items.Count.ToString(), Inline = true },
            new DiscordField { Name = "Request Type", Value = order.RequestType ?? "StandardUpload", Inline = true },
            new DiscordField { Name = "Express Priority", Value = order.IsExpress ? "⚡ YES (+30% Surcharge)" : "Standard", Inline = true },
        };

        if (order.IsExpress && order.ExpressFeeAmount > 0)
        {
            fields.Add(new DiscordField { Name = "Express Fee", Value = $"€{order.ExpressFeeAmount:F2}", Inline = true });
        }

        if (!string.IsNullOrWhiteSpace(order.CustomerNotes))
        {
            var noteSnippet = order.CustomerNotes.Length > 1000
                ? order.CustomerNotes.Substring(0, 1000) + "..."
                : order.CustomerNotes;
            fields.Add(new DiscordField { Name = "Project Description / Notes", Value = noteSnippet, Inline = false });
        }

        fields.Add(new DiscordField { Name = "Items", Value = BuildItemsForEmbed(order.Items), Inline = false });

        var embed = new DiscordEmbed
        {
            Title = title,
            Color = color,
            Fields = fields.ToArray(),
            Timestamp = DateTime.UtcNow.ToString("o")
        };

        await PostToWebhookAsync(webhookUrl, embed, "quote notification", cancellationToken);
    }

    public Task SendBookingCreatedAsync(Order order, User? user, CancellationToken cancellationToken = default)
    {
        var webhookUrl = _configuration["Discord:BookingWebhookUrl"];
        if (string.IsNullOrWhiteSpace(webhookUrl)) return Task.CompletedTask;

        var userName = user?.Name ?? order.FullName;
        var userEmail = user?.Email ?? "unknown";

        var embed = new DiscordEmbed
        {
            Title = "📦 New Booking Created",
            Color = 15844367, // Orange
            Fields = new[]
            {
                new DiscordField { Name = "Order ID", Value = order.Id.ToString(), Inline = true },
                new DiscordField { Name = "Created", Value = order.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss UTC"), Inline = true },
                new DiscordField { Name = "Status", Value = order.Status, Inline = true },
                new DiscordField { Name = "Customer Name", Value = userName, Inline = true },
                new DiscordField { Name = "Email", Value = userEmail, Inline = true },
                new DiscordField { Name = "Phone", Value = order.PhoneNumber ?? "N/A", Inline = true },
                new DiscordField { Name = "Address", Value = $"{order.AddressLine1}, {order.City}, {order.PostalCode}", Inline = false },
                new DiscordField { Name = "Item Count", Value = order.Items.Count.ToString(), Inline = true },
                new DiscordField { Name = "Subtotal", Value = $"€{order.SubtotalAmount:F2}", Inline = true },
                new DiscordField { Name = "Delivery Price", Value = $"€{order.DeliveryPrice:F2}", Inline = true },
                new DiscordField { Name = "Items", Value = BuildItemsForEmbed(order.Items), Inline = false },
            },
            Timestamp = DateTime.UtcNow.ToString("o")
        };

        return PostToWebhookAsync(webhookUrl, embed, "booking notification", cancellationToken);
    }

    public Task SendPaymentReceivedAsync(Order order, User? user, decimal paidAmount, CancellationToken cancellationToken = default)
    {
        var webhookUrl = _configuration["Discord:PaymentReceivedWebhookUrl"];
        if (string.IsNullOrWhiteSpace(webhookUrl)) return Task.CompletedTask;

        var userName = user?.Name ?? order.FullName;
        var userEmail = user?.Email ?? "unknown";

        var embed = new DiscordEmbed
        {
            Title = "✅ Payment Received",
            Color = 3066993, // Green-ish
            Fields = new[]
            {
                new DiscordField { Name = "Order ID", Value = order.Id.ToString(), Inline = true },
                new DiscordField { Name = "Paid At", Value = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC"), Inline = true },
                new DiscordField { Name = "Status", Value = order.Status, Inline = true },
                new DiscordField { Name = "Customer Name", Value = userName, Inline = true },
                new DiscordField { Name = "Email", Value = userEmail, Inline = true },
                new DiscordField { Name = "Amount Paid", Value = $"€{paidAmount:F2}", Inline = true },
                new DiscordField { Name = "Delivery Price", Value = $"€{order.DeliveryPrice:F2}", Inline = true },
                new DiscordField { Name = "Item Count", Value = order.Items.Count.ToString(), Inline = true },
                new DiscordField { Name = "Items", Value = BuildItemsForEmbed(order.Items), Inline = false },
            },
            Timestamp = DateTime.UtcNow.ToString("o")
        };

        return PostToWebhookAsync(webhookUrl, embed, "payment received notification", cancellationToken);
    }

    public Task SendPaymentIssueAsync(
        Order order,
        User? user,
        decimal amount,
        string paymentStatus,
        string? reference,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var webhookUrl = _configuration["Discord:PaymentIssueWebhookUrl"];
        if (string.IsNullOrWhiteSpace(webhookUrl))
            webhookUrl = _configuration["Discord:ErrorWebhookUrl"];
        if (string.IsNullOrWhiteSpace(webhookUrl)) return Task.CompletedTask;

        var userName = user?.Name ?? order.FullName;
        var userEmail = user?.Email ?? "unknown";
        var normalizedStatus = string.IsNullOrWhiteSpace(paymentStatus) ? "unknown" : paymentStatus;

        var embed = new DiscordEmbed
        {
            Title = "❌ Payment Issue Detected",
            Color = 15158332,
            Fields = new[]
            {
                new DiscordField { Name = "Order ID", Value = order.Id.ToString(), Inline = true },
                new DiscordField { Name = "Detected At", Value = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC"), Inline = true },
                new DiscordField { Name = "Order Status", Value = order.Status, Inline = true },
                new DiscordField { Name = "Payment Status", Value = normalizedStatus, Inline = true },
                new DiscordField { Name = "Reference", Value = string.IsNullOrWhiteSpace(reference) ? "N/A" : reference, Inline = true },
                new DiscordField { Name = "Amount", Value = $"€{amount:F2}", Inline = true },
                new DiscordField { Name = "Customer", Value = userName, Inline = true },
                new DiscordField { Name = "Email", Value = userEmail, Inline = true },
                new DiscordField { Name = "Reason", Value = string.IsNullOrWhiteSpace(reason) ? "No detailed reason provided" : reason, Inline = false },
            },
            Timestamp = DateTime.UtcNow.ToString("o")
        };

        return PostToWebhookAsync(webhookUrl, embed, "payment issue notification", cancellationToken);
    }

    public Task SendSupportTicketCreatedAsync(SupportTicket ticket, CancellationToken cancellationToken = default)
    {
        var webhookUrl = _configuration["Discord:SupportWebhookUrl"]
            ?? _configuration["Discord:QuoteWebhookUrl"]
            ?? _configuration["Discord:ErrorWebhookUrl"];

        if (string.IsNullOrWhiteSpace(webhookUrl)) return Task.CompletedTask;

        var description = string.IsNullOrWhiteSpace(ticket.Description)
            ? "No description provided."
            : (ticket.Description.Length > 1024 ? ticket.Description[..1020] + "..." : ticket.Description);

        var attachments = ticket.AttachmentUrls.Count > 0
            ? string.Join("\n", ticket.AttachmentUrls)
            : "None";

        var embed = new DiscordEmbed
        {
            Title = $"🚨 New Ticket: [{ticket.Category}] - {ticket.Subject}",
            Color = 15158332,
            Fields = new[]
            {
                new DiscordField { Name = "Ticket ID", Value = ticket.Id.ToString(), Inline = true },
                new DiscordField { Name = "Category", Value = ticket.Category.ToString(), Inline = true },
                new DiscordField { Name = "Status", Value = ticket.Status.ToString(), Inline = true },
                new DiscordField { Name = "User Email", Value = ticket.UserEmail, Inline = true },
                new DiscordField { Name = "User ID", Value = ticket.UserId?.ToString() ?? "Guest", Inline = true },
                new DiscordField { Name = "Order ID", Value = ticket.OrderId?.ToString() ?? "N/A", Inline = true },
                new DiscordField { Name = "Description", Value = description, Inline = false },
                new DiscordField { Name = "Attachments", Value = attachments.Length > 1024 ? attachments[..1020] + "..." : attachments, Inline = false },
            },
            Timestamp = ticket.CreatedAt.ToString("o")
        };

        return PostToWebhookAsync(webhookUrl, embed, "support ticket notification", cancellationToken);
    }

    private async Task PostToWebhookAsync(string webhookUrl, DiscordEmbed embed, string logContext, CancellationToken cancellationToken)
    {
        try
        {
            var payload = new
            {
                content = $"**[{_environmentLabel}]**",
                embeds = new[] { embed }
            };
            using var request = new HttpRequestMessage(HttpMethod.Post, webhookUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload, new JsonSerializerOptions { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull }), Encoding.UTF8, "application/json")
            };

            var client = _httpClientFactory.CreateClient();
            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Discord {Context} failed. Status: {StatusCode}. Body: {Body}", logContext, (int)response.StatusCode, body);
                return;
            }

            _logger.LogInformation("Discord {Context} sent successfully with status code {StatusCode}", logContext, (int)response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed sending Discord {Context}.", logContext);
        }
    }

    private static string BuildItemsForEmbed(IEnumerable<OrderItem> items)
    {
        if (!items.Any()) return "No items";

        var itemList = string.Join("\n", items.Select((item, index) =>
        {
            var model = !string.IsNullOrWhiteSpace(item.fileName)
                ? item.fileName
                : (!string.IsNullOrWhiteSpace(item.FileUrl) ? "📁 Uploaded file" : "📝 Description");
            var notes = string.IsNullOrWhiteSpace(item.Notes) ? "(no notes)" : item.Notes.Trim();
            return $"`{index + 1}.` {model} | {item.Material} | {item.Color} | qty: {Math.Max(item.Count, 1)}\n     └─ {notes}";
        }));

        return itemList.Length > 1024 ? itemList.Substring(0, 1020) + "..." : itemList;
    }

    private static string GetEnvironmentLabel(string? environmentName)
    {
        if (string.Equals(environmentName, Environments.Development, StringComparison.OrdinalIgnoreCase))
            return "DEV";

        if (string.Equals(environmentName, Environments.Production, StringComparison.OrdinalIgnoreCase))
            return "PROD";

        return string.IsNullOrWhiteSpace(environmentName)
            ? "UNKNOWN"
            : environmentName.Trim().ToUpperInvariant();
    }
}

public class DiscordEmbed
{
    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("color")]
    public int? Color { get; set; }

    [JsonPropertyName("fields")]
    public DiscordField[]? Fields { get; set; }

    [JsonPropertyName("timestamp")]
    public string? Timestamp { get; set; }
}

public class DiscordField
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("value")]
    public string? Value { get; set; }

    [JsonPropertyName("inline")]
    public bool Inline { get; set; } = false;
}
