using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;
using PrintCraftApi.Models;

namespace PrintCraftApi.Services;

public sealed record VisitorTrackEvent(
    Guid? UserId,
    string VisitorKey,
    string EventType,
    string PagePath,
    string CountryCode,
    string? City,
    string UserAgent,
    DateTime VisitedAt);

public interface IVisitorTrackingQueue
{
    ValueTask EnqueueAsync(VisitorTrackEvent item, CancellationToken cancellationToken = default);
    ValueTask<VisitorTrackEvent> DequeueAsync(CancellationToken cancellationToken);
    IAsyncEnumerable<VisitorTrackEvent> ReadAllAsync(CancellationToken cancellationToken);
}

public sealed class VisitorTrackingQueue : IVisitorTrackingQueue
{
    private readonly Channel<VisitorTrackEvent> _channel;

    public VisitorTrackingQueue()
    {
        var options = new BoundedChannelOptions(10000)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true
        };
        _channel = Channel.CreateBounded<VisitorTrackEvent>(options);
    }

    public ValueTask EnqueueAsync(VisitorTrackEvent item, CancellationToken cancellationToken = default)
    {
        return _channel.Writer.WriteAsync(item, cancellationToken);
    }

    public ValueTask<VisitorTrackEvent> DequeueAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAsync(cancellationToken);
    }

    public IAsyncEnumerable<VisitorTrackEvent> ReadAllAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}

public sealed class VisitorTrackingBackgroundWorker : BackgroundService
{
    private readonly IVisitorTrackingQueue _queue;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<VisitorTrackingBackgroundWorker> _logger;
    private const int BatchSize = 100;
    private static readonly TimeSpan BatchFlushInterval = TimeSpan.FromSeconds(2);

    public VisitorTrackingBackgroundWorker(
        IVisitorTrackingQueue queue,
        IServiceProvider serviceProvider,
        ILogger<VisitorTrackingBackgroundWorker> logger)
    {
        _queue = queue;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Visitor Tracking Background Worker started.");

        var buffer = new List<VisitorTrackEvent>();
        var lastFlush = DateTime.UtcNow;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Wait for the next item or check if we should flush
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                cts.CancelAfter(BatchFlushInterval);

                try
                {
                    var item = await _queue.DequeueAsync(cts.Token);
                    buffer.Add(item);
                }
                catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested)
                {
                    // Timeout hit - time to flush if we have buffered items
                }

                if (buffer.Count >= BatchSize || (buffer.Count > 0 && DateTime.UtcNow - lastFlush >= BatchFlushInterval))
                {
                    await FlushBatchAsync(buffer, stoppingToken);
                    buffer.Clear();
                    lastFlush = DateTime.UtcNow;
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in Visitor Tracking Background Worker.");
                buffer.Clear();
                lastFlush = DateTime.UtcNow;
            }
        }

        // Flush remaining events before shutdown
        if (buffer.Count > 0)
        {
            try
            {
                using var shutdownCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await FlushBatchAsync(buffer, shutdownCts.Token);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not flush final visitor events during shutdown.");
            }
        }

        _logger.LogInformation("Visitor Tracking Background Worker stopped.");
    }

    private async Task FlushBatchAsync(List<VisitorTrackEvent> batch, CancellationToken cancellationToken)
    {
        if (batch.Count == 0) return;

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PrintCraftDb>();

        try
        {
            var now = DateTime.UtcNow;
            var today = now.Date;
            var tomorrow = today.AddDays(1);

            // Group in-memory events by VisitorKey, PagePath, EventType
            var grouped = batch
                .GroupBy(b => new { b.VisitorKey, b.PagePath, b.EventType })
                .ToList();

            var visitorKeys = grouped.Select(g => g.Key.VisitorKey).Distinct().ToList();

            // Load existing records for these visitors today using indexed range query
            var existingVisits = await db.VisitEvents
                .Where(v => v.VisitedAt >= today && v.VisitedAt < tomorrow && visitorKeys.Contains(v.VisitorKey))
                .ToListAsync(cancellationToken);

            var existingLookup = existingVisits
                .GroupBy(v => new { v.VisitorKey, v.PagePath, v.EventType })
                .ToDictionary(g => g.Key, g => g.First());

            foreach (var group in grouped)
            {
                var mostRecent = group.OrderByDescending(x => x.VisitedAt).First();
                var additionalViews = group.Count();

                if (existingLookup.TryGetValue(group.Key, out var existing))
                {
                    existing.Views += additionalViews;
                    existing.VisitedAt = mostRecent.VisitedAt;
                    if (mostRecent.UserId.HasValue)
                    {
                        existing.UserId = mostRecent.UserId;
                    }
                }
                else
                {
                    db.VisitEvents.Add(new VisitEvent
                    {
                        UserId = mostRecent.UserId,
                        VisitorKey = mostRecent.VisitorKey,
                        EventType = mostRecent.EventType,
                        PagePath = mostRecent.PagePath,
                        CountryCode = string.IsNullOrWhiteSpace(mostRecent.CountryCode) ? "UN" : mostRecent.CountryCode,
                        City = string.IsNullOrWhiteSpace(mostRecent.City) ? null : mostRecent.City,
                        UserAgent = mostRecent.UserAgent,
                        VisitedAt = mostRecent.VisitedAt,
                        Views = additionalViews
                    });
                }
            }

            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to flush visitor tracking batch of {Count} events.", batch.Count);
        }
    }
}

