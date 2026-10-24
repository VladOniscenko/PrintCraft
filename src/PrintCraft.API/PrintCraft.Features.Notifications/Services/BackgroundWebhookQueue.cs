using System.Threading.Channels;
using PrintCraft.Shared.Models;

namespace PrintCraft.Features.Notifications.Services;

public abstract record WebhookWorkItem
{
    public sealed record QuoteRequested(Order Order, User? User, string? GuestEmail) : WebhookWorkItem;
    public sealed record BookingCreated(Order Order, User? User) : WebhookWorkItem;
    public sealed record PaymentReceived(Order Order, User? User, decimal PaidAmount) : WebhookWorkItem;
    public sealed record PaymentIssue(Order Order, User? User, decimal Amount, string PaymentStatus, string? Reference, string? Reason) : WebhookWorkItem;
    public sealed record SupportTicketCreated(SupportTicket Ticket) : WebhookWorkItem;
}

public interface IBackgroundWebhookQueue
{
    ValueTask EnqueueAsync(WebhookWorkItem item, CancellationToken cancellationToken = default);
    ValueTask<WebhookWorkItem> DequeueAsync(CancellationToken cancellationToken);
}

public sealed class BackgroundWebhookQueue : IBackgroundWebhookQueue
{
    private readonly Channel<WebhookWorkItem> _channel;

    public BackgroundWebhookQueue()
    {
        var options = new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true
        };
        _channel = Channel.CreateBounded<WebhookWorkItem>(options);
    }

    public ValueTask EnqueueAsync(WebhookWorkItem item, CancellationToken cancellationToken = default)
    {
        return _channel.Writer.WriteAsync(item, cancellationToken);
    }

    public ValueTask<WebhookWorkItem> DequeueAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAsync(cancellationToken);
    }
}

public sealed class BackgroundWebhookWorker : BackgroundService
{
    private readonly IBackgroundWebhookQueue _queue;
    private readonly DiscordWebhookService _discordWebhookService;
    private readonly ILogger<BackgroundWebhookWorker> _logger;

    public BackgroundWebhookWorker(
        IBackgroundWebhookQueue queue,
        DiscordWebhookService discordWebhookService,
        ILogger<BackgroundWebhookWorker> logger)
    {
        _queue = queue;
        _discordWebhookService = discordWebhookService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background Webhook Worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var item = await _queue.DequeueAsync(stoppingToken);
                await ProcessWebhookItemAsync(item, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in Background Webhook Worker loop.");
            }
        }

        _logger.LogInformation("Background Webhook Worker stopped.");
    }

    private async Task ProcessWebhookItemAsync(WebhookWorkItem item, CancellationToken cancellationToken)
    {
        try
        {
            switch (item)
            {
                case WebhookWorkItem.QuoteRequested q:
                    await _discordWebhookService.SendQuoteRequestedAsync(q.Order, q.User, q.GuestEmail, cancellationToken);
                    break;
                case WebhookWorkItem.BookingCreated b:
                    await _discordWebhookService.SendBookingCreatedAsync(b.Order, b.User, cancellationToken);
                    break;
                case WebhookWorkItem.PaymentReceived p:
                    await _discordWebhookService.SendPaymentReceivedAsync(p.Order, p.User, p.PaidAmount, cancellationToken);
                    break;
                case WebhookWorkItem.PaymentIssue issue:
                    await _discordWebhookService.SendPaymentIssueAsync(issue.Order, issue.User, issue.Amount, issue.PaymentStatus, issue.Reference, issue.Reason, cancellationToken);
                    break;
                case WebhookWorkItem.SupportTicketCreated st:
                    await _discordWebhookService.SendSupportTicketCreatedAsync(st.Ticket, cancellationToken);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process background webhook item {ItemType}", item.GetType().Name);
        }
    }
}

public sealed class QueuedDiscordWebhookService : IDiscordWebhookService
{
    private readonly IBackgroundWebhookQueue _queue;
    private readonly DiscordWebhookService _directService;

    public QueuedDiscordWebhookService(IBackgroundWebhookQueue queue, DiscordWebhookService directService)
    {
        _queue = queue;
        _directService = directService;
    }

    public Task SendUnhandledExceptionAsync(HttpContext context, Exception exception, CancellationToken cancellationToken = default)
    {
        // Global exception notifications are critical and sent directly via direct service
        return _directService.SendUnhandledExceptionAsync(context, exception, cancellationToken);
    }

    public async Task SendQuoteRequestedAsync(Order order, User? user, string? guestEmail = null, CancellationToken cancellationToken = default)
    {
        await _queue.EnqueueAsync(new WebhookWorkItem.QuoteRequested(order, user, guestEmail), cancellationToken);
    }

    public async Task SendBookingCreatedAsync(Order order, User? user, CancellationToken cancellationToken = default)
    {
        await _queue.EnqueueAsync(new WebhookWorkItem.BookingCreated(order, user), cancellationToken);
    }

    public async Task SendPaymentReceivedAsync(Order order, User? user, decimal paidAmount, CancellationToken cancellationToken = default)
    {
        await _queue.EnqueueAsync(new WebhookWorkItem.PaymentReceived(order, user, paidAmount), cancellationToken);
    }

    public async Task SendPaymentIssueAsync(Order order, User? user, decimal amount, string paymentStatus, string? reference, string? reason, CancellationToken cancellationToken = default)
    {
        await _queue.EnqueueAsync(new WebhookWorkItem.PaymentIssue(order, user, amount, paymentStatus, reference, reason), cancellationToken);
    }

    public async Task SendSupportTicketCreatedAsync(SupportTicket ticket, CancellationToken cancellationToken = default)
    {
        await _queue.EnqueueAsync(new WebhookWorkItem.SupportTicketCreated(ticket), cancellationToken);
    }
}

