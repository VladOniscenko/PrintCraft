using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using PrintCraftApi.Models;

namespace PrintCraftApi.Services;

public interface IDiscordWebhookService
{
    Task SendUnhandledExceptionAsync(HttpContext context, Exception exception, CancellationToken cancellationToken = default);
    Task SendQuoteRequestedAsync(Order order, User? user, string? guestEmail = null, CancellationToken cancellationToken = default);
    Task SendBookingCreatedAsync(Order order, User? user, CancellationToken cancellationToken = default);
    Task SendPaymentReceivedAsync(Order order, User? user, decimal paidAmount, CancellationToken cancellationToken = default);
    Task SendPaymentIssueAsync(Order order, User? user, decimal amount, string paymentStatus, string? reference, string? reason, CancellationToken cancellationToken = default);
}

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

        var embed = new DiscordEmbed
        {
            Title = "🧾 New Quote Request",
            Color = 3066993, // Blue-green
            Fields = new[]
            {
                new DiscordField { Name = "Order ID", Value = order.Id.ToString(), Inline = true },
                new DiscordField { Name = "Created", Value = order.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss UTC"), Inline = true },
                new DiscordField { Name = "Status", Value = order.Status, Inline = true },
                new DiscordField { Name = "Customer Name", Value = customerName, Inline = true },
                new DiscordField { Name = "Email", Value = customerEmail, Inline = true },
                new DiscordField { Name = "Item Count", Value = order.Items.Count.ToString(), Inline = true },
                new DiscordField { Name = "Items", Value = BuildItemsForEmbed(order.Items), Inline = false },
            },
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
