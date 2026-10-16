using System.Threading.Channels;

namespace PrintCraftApi.Services;

public abstract record EmailWorkItem
{
    public sealed record ResetPassword(string ToEmail, string ToName, string ResetLink) : EmailWorkItem;
    public sealed record QuoteRequested(string ToEmail, string ToName, Guid OrderId) : EmailWorkItem;
    public sealed record QuoteConfirmation(string ToEmail, string ToName, Guid OrderId, decimal Price, string? QuoteMessage) : EmailWorkItem;
    public sealed record QuoteConfirmationBankTransfer(string ToEmail, string ToName, Guid OrderId, decimal Price, string? QuoteMessage, string PaymentReference) : EmailWorkItem;
    public sealed record OrderSentTracking(string ToEmail, string ToName, Guid OrderId, string TrackingCode, string? TrackingUrl) : EmailWorkItem;
    public sealed record OrderPaid(string ToEmail, string ToName, Guid OrderId, decimal Amount) : EmailWorkItem;
    public sealed record CustomEmail(string ToEmail, string ToName, string Subject, string Body) : EmailWorkItem;
}

public interface IBackgroundEmailQueue
{
    ValueTask EnqueueAsync(EmailWorkItem item, CancellationToken cancellationToken = default);
    ValueTask<EmailWorkItem> DequeueAsync(CancellationToken cancellationToken);
}

public sealed class BackgroundEmailQueue : IBackgroundEmailQueue
{
    private readonly Channel<EmailWorkItem> _channel;

    public BackgroundEmailQueue()
    {
        var options = new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true
        };
        _channel = Channel.CreateBounded<EmailWorkItem>(options);
    }

    public ValueTask EnqueueAsync(EmailWorkItem item, CancellationToken cancellationToken = default)
    {
        return _channel.Writer.WriteAsync(item, cancellationToken);
    }

    public ValueTask<EmailWorkItem> DequeueAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAsync(cancellationToken);
    }
}

public sealed class BackgroundEmailWorker : BackgroundService
{
    private readonly IBackgroundEmailQueue _queue;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BackgroundEmailWorker> _logger;

    public BackgroundEmailWorker(
        IBackgroundEmailQueue queue,
        IServiceProvider serviceProvider,
        ILogger<BackgroundEmailWorker> logger)
    {
        _queue = queue;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background Email Worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var item = await _queue.DequeueAsync(stoppingToken);
                await ProcessEmailItemAsync(item, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in Background Email Worker loop.");
            }
        }

        _logger.LogInformation("Background Email Worker stopped.");
    }

    private async Task ProcessEmailItemAsync(EmailWorkItem item, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var emailSender = scope.ServiceProvider.GetRequiredService<GmailSmtpEmailService>();

        try
        {
            switch (item)
            {
                case EmailWorkItem.ResetPassword reset:
                    await emailSender.SendResetPasswordEmailAsync(reset.ToEmail, reset.ToName, reset.ResetLink);
                    break;
                case EmailWorkItem.QuoteRequested quote:
                    await emailSender.SendQuoteRequestedEmailAsync(quote.ToEmail, quote.ToName, quote.OrderId);
                    break;
                case EmailWorkItem.QuoteConfirmation conf:
                    await emailSender.SendQuoteConfirmationEmailAsync(conf.ToEmail, conf.ToName, conf.OrderId, conf.Price, conf.QuoteMessage);
                    break;
                case EmailWorkItem.QuoteConfirmationBankTransfer bt:
                    await emailSender.SendQuoteConfirmationBankTransferEmailAsync(bt.ToEmail, bt.ToName, bt.OrderId, bt.Price, bt.QuoteMessage, bt.PaymentReference);
                    break;
                case EmailWorkItem.OrderSentTracking trk:
                    await emailSender.SendOrderSentTrackingEmailAsync(trk.ToEmail, trk.ToName, trk.OrderId, trk.TrackingCode, trk.TrackingUrl);
                    break;
                case EmailWorkItem.OrderPaid paid:
                    await emailSender.SendOrderPaidEmailAsync(paid.ToEmail, paid.ToName, paid.OrderId, paid.Amount);
                    break;
                case EmailWorkItem.CustomEmail custom:
                    await emailSender.SendCustomEmailAsync(custom.ToEmail, custom.ToName, custom.Subject, custom.Body);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send background email for {ItemType}", item.GetType().Name);
        }
    }
}

public sealed class QueuedEmailService : IEmailService
{
    private readonly IBackgroundEmailQueue _queue;

    public QueuedEmailService(IBackgroundEmailQueue queue)
    {
        _queue = queue;
    }

    public async Task SendResetPasswordEmailAsync(string toEmail, string toName, string resetLink)
    {
        await _queue.EnqueueAsync(new EmailWorkItem.ResetPassword(toEmail, toName, resetLink));
    }

    public async Task SendQuoteRequestedEmailAsync(string toEmail, string toName, Guid orderId)
    {
        await _queue.EnqueueAsync(new EmailWorkItem.QuoteRequested(toEmail, toName, orderId));
    }

    public async Task SendQuoteConfirmationEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage)
    {
        await _queue.EnqueueAsync(new EmailWorkItem.QuoteConfirmation(toEmail, toName, orderId, price, quoteMessage));
    }

    public async Task SendQuoteConfirmationBankTransferEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage, string paymentReference)
    {
        await _queue.EnqueueAsync(new EmailWorkItem.QuoteConfirmationBankTransfer(toEmail, toName, orderId, price, quoteMessage, paymentReference));
    }

    public async Task SendOrderSentTrackingEmailAsync(string toEmail, string toName, Guid orderId, string trackingCode, string? trackingUrl)
    {
        await _queue.EnqueueAsync(new EmailWorkItem.OrderSentTracking(toEmail, toName, orderId, trackingCode, trackingUrl));
    }

    public async Task SendOrderPaidEmailAsync(string toEmail, string toName, Guid orderId, decimal amount)
    {
        await _queue.EnqueueAsync(new EmailWorkItem.OrderPaid(toEmail, toName, orderId, amount));
    }

    public async Task SendCustomEmailAsync(string toEmail, string toName, string subject, string body)
    {
        await _queue.EnqueueAsync(new EmailWorkItem.CustomEmail(toEmail, toName, subject, body));
    }
}

