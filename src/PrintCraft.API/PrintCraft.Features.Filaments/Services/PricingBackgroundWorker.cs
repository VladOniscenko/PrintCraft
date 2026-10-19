using Microsoft.EntityFrameworkCore;
using PrintCraft.Shared.Data;

namespace PrintCraft.Features.Filaments.Services;

public class PricingBackgroundWorker : BackgroundService
{
    private readonly IPricingQueue _queue;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PricingBackgroundWorker> _logger;

    public PricingBackgroundWorker(IPricingQueue queue, IServiceProvider serviceProvider, ILogger<PricingBackgroundWorker> logger)
    {
        _queue = queue;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Pricing Background Worker is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var orderItemId = await _queue.DequeueAsync(stoppingToken);
                _logger.LogInformation("Processing pricing for OrderItem: {OrderItemId}", orderItemId);

                using var scope = _serviceProvider.CreateScope();
                var pricingService = scope.ServiceProvider.GetRequiredService<IPrintPricingService>();
                var dbContext = scope.ServiceProvider.GetRequiredService<PrintCraftDb>();

                var orderItem = await dbContext.OrderItems
                    .Include(i => i.Attachments)
                    .FirstOrDefaultAsync(i => i.Id == orderItemId, stoppingToken);

                if (orderItem != null)
                {
                    var fileUrl = orderItem.FileUrl;
                    if ((string.IsNullOrWhiteSpace(fileUrl) || !IsPrintable3DModelUrl(fileUrl)) && orderItem.Attachments?.Count > 0)
                    {
                        var modelAttachment = orderItem.Attachments.FirstOrDefault(a => IsPrintable3DModelUrl(a.Url));
                        if (modelAttachment != null)
                        {
                            fileUrl = modelAttachment.Url;
                        }
                    }

                    // Only automatically price items that have a valid 3D model or production archive
                    var is3DModelFile = IsPrintable3DModelUrl(fileUrl);

                    if (!is3DModelFile)
                    {
                        _logger.LogInformation("OrderItem {OrderItemId} does not have a printable 3D model file (e.g. image or custom quote). Skipping automated pricing for manual quote review.", orderItemId);
                        continue;
                    }
                    {
                        var fileName = ExtractFileNameFromUrl(fileUrl);
                        if (!string.IsNullOrWhiteSpace(fileName))
                        {
                            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                            var filePath = Path.Combine(uploadsFolder, fileName);
                            if (!File.Exists(filePath))
                            {
                                var altPath = Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", fileName);
                                if (File.Exists(altPath))
                                {
                                    filePath = altPath;
                                }
                            }

                            if (File.Exists(filePath) || !string.IsNullOrWhiteSpace(orderItem.Size))
                            {
                                double scaleFactor = PrintPricingService.ResolveScaleFactor(orderItem);

                                await pricingService.CalculatePricingAsync(
                                    orderItemId,
                                    File.Exists(filePath) ? filePath : string.Empty,
                                    scaleFactor,
                                    orderItem.InfillPercent,
                                    orderItem.PrintQuality,
                                    orderItem.SupportsNeeded
                                );
                            }
                            else
                            {
                                _logger.LogWarning("Model file not found on disk and no dimensions provided: {FilePath}", filePath);
                            }
                        }
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Prevent throwing if stoppingToken was signaled
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing pricing task.");
            }
        }

        _logger.LogInformation("Pricing Background Worker is stopping.");
    }

    private static bool IsPrintable3DModelUrl(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return false;
        var clean = rawUrl.Split('?', '#')[0];
        return clean.EndsWith(".stl", StringComparison.OrdinalIgnoreCase) ||
               clean.EndsWith(".obj", StringComparison.OrdinalIgnoreCase) ||
               clean.EndsWith(".3mf", StringComparison.OrdinalIgnoreCase) ||
               clean.EndsWith(".step", StringComparison.OrdinalIgnoreCase) ||
               clean.EndsWith(".stp", StringComparison.OrdinalIgnoreCase) ||
               clean.EndsWith(".zip", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ExtractFileNameFromUrl(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return null;

        var path = rawUrl.Trim();
        if (Uri.TryCreate(path, UriKind.Absolute, out var absoluteUri))
        {
            path = absoluteUri.AbsolutePath;
        }

        var normalizedPath = path.Replace('\\', '/');
        var withoutQuery = normalizedPath.Split('?', '#')[0];
        var fileName = Path.GetFileName(withoutQuery);
        if (string.IsNullOrWhiteSpace(fileName)) return null;
        if (fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0) return null;

        return fileName;
    }
}
