using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;

namespace PrintCraftApi.Services;

/// <summary>
/// Lightweight background worker (TTL) that periodically scans wwwroot/uploads/
/// and removes expired .glb and .stl preview/temp files older than 24–48 hours
/// that are not linked to a confirmed, paid order, hero slide, or active draft.
/// </summary>
public class UploadCleanupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<UploadCleanupBackgroundService> _logger;
    private readonly IConfiguration _configuration;

    public UploadCleanupBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<UploadCleanupBackgroundService> logger,
        IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var isEnabled = _configuration.GetValue<bool?>("UploadCleanup:Enabled") ?? true;
        if (!isEnabled)
        {
            _logger.LogInformation("UploadCleanupBackgroundService is disabled by configuration.");
            return;
        }

        var intervalHours = Math.Max(0.25, _configuration.GetValue<double?>("UploadCleanup:IntervalHours") ?? 4.0);
        var ttlHours = Math.Max(1.0, _configuration.GetValue<double?>("UploadCleanup:TtlHours") ?? 24.0);

        _logger.LogInformation(
            "UploadCleanupBackgroundService registered. Scan interval: {IntervalHours:F1}h, Preview TTL: {TtlHours:F1}h",
            intervalHours, ttlHours);

        // Allow app startup to complete before initial cleanup pass
        try
        {
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunCleanupPassAsync(ttlHours, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during scheduled upload cleanup pass.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromHours(intervalHours), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("UploadCleanupBackgroundService has stopped.");
    }

    public async Task<int> RunCleanupPassAsync(double ttlHours, CancellationToken cancellationToken)
    {
        var candidateDirs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (Directory.Exists(webRoot)) candidateDirs.Add(Path.GetFullPath(webRoot));

        var appBaseRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads");
        if (Directory.Exists(appBaseRoot)) candidateDirs.Add(Path.GetFullPath(appBaseRoot));

        if (candidateDirs.Count == 0)
        {
            _logger.LogDebug("No uploads directory found to scan.");
            return 0;
        }

        // Build protected filenames set from database:
        // 1. Confirmed / paid orders & active in-flight production orders
        // 2. Promotional hero slides
        // 3. Active unexpired quote drafts
        HashSet<string> protectedFileNames;
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<PrintCraftDb>();

            protectedFileNames = await GatherProtectedFileNamesAsync(db, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not load protected files from database. Aborting cleanup pass to prevent accidental deletion.");
            return 0;
        }

        var cutoffUtc = DateTime.UtcNow.AddHours(-ttlHours);
        int deletedCount = 0;
        long freedBytes = 0;

        foreach (var dir in candidateDirs)
        {
            try
            {
                var files = Directory.EnumerateFiles(dir, "*", SearchOption.AllDirectories)
                    .Select(p => new FileInfo(p))
                    .Where(fi => fi.Extension.Equals(".glb", StringComparison.OrdinalIgnoreCase) ||
                                 fi.Extension.Equals(".stl", StringComparison.OrdinalIgnoreCase))
                    .ToList();

                foreach (var fileInfo in files)
                {
                    if (cancellationToken.IsCancellationRequested) break;

                    // Only consider files older than the TTL cutoff
                    if (fileInfo.LastWriteTimeUtc >= cutoffUtc)
                    {
                        continue;
                    }

                    // Check if file is linked to any confirmed/paid order, hero slide, or draft
                    if (protectedFileNames.Contains(fileInfo.Name))
                    {
                        continue;
                    }

                    try
                    {
                        var fileSize = fileInfo.Length;
                        var fileName = fileInfo.Name;
                        var fullPath = fileInfo.FullName;
                        var fileDir = fileInfo.DirectoryName ?? dir;
                        var baseName = Path.GetFileNameWithoutExtension(fileName);

                        fileInfo.Delete();
                        deletedCount++;
                        freedBytes += fileSize;

                        _logger.LogInformation(
                            "Deleted expired unlinked 3D preview file: {FileName} (Age: {AgeHours:F1}h, Size: {SizeKb:F1}KB)",
                            fileName,
                            (DateTime.UtcNow - fileInfo.LastWriteTimeUtc).TotalHours,
                            fileSize / 1024.0);

                        // Clean up companion metadata file if exists
                        var metaPath = fullPath + ".upload-meta.json";
                        if (File.Exists(metaPath))
                        {
                            try { File.Delete(metaPath); } catch { }
                        }

                        // If baseName is a temp preview (e.g. temp_{visitor}_{slot}), check and clean companion config and image
                        if (baseName.StartsWith("temp_", StringComparison.OrdinalIgnoreCase))
                        {
                            var companionFiles = Directory.GetFiles(fileDir, $"{baseName}.*");
                            foreach (var companion in companionFiles)
                            {
                                var compExt = Path.GetExtension(companion).ToLowerInvariant();
                                var compName = Path.GetFileName(companion);
                                if (!protectedFileNames.Contains(compName))
                                {
                                    try
                                    {
                                        File.Delete(companion);
                                        var compMeta = companion + ".upload-meta.json";
                                        if (File.Exists(compMeta))
                                        {
                                            File.Delete(compMeta);
                                        }
                                    }
                                    catch
                                    {
                                        // Ignore non-critical companion file cleanup errors
                                    }
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogDebug(ex, "Failed to delete file {FileName}", fileInfo.Name);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error while scanning directory {Directory}", dir);
            }
        }

        if (deletedCount > 0)
        {
            _logger.LogInformation(
                "Upload cleanup pass completed. Deleted {Count} expired preview file(s), freed {Megabytes:F2} MB.",
                deletedCount, freedBytes / (1024.0 * 1024.0));
        }
        else
        {
            _logger.LogDebug("Upload cleanup pass completed. No expired unlinked preview files found.");
        }

        return deletedCount;
    }

    private static async Task<HashSet<string>> GatherProtectedFileNamesAsync(
        PrintCraftDb db,
        CancellationToken cancellationToken)
    {
        var protectedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // 1. Confirmed, Paid, or Active Production Orders
        // Protected if: IsPaid, QuoteConfirmedAt is set, active production status, or recent non-cancelled order
        var orders = await db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .Where(o => o.IsPaid ||
                        o.QuoteConfirmedAt != null ||
                        o.Status == OrderStatus.ReadyToPrint ||
                        o.Status == OrderStatus.Printing ||
                        o.Status == OrderStatus.PostProcessing ||
                        o.Status == OrderStatus.Shipped ||
                        (!o.Status.Equals(OrderStatus.Cancelled, StringComparison.OrdinalIgnoreCase) &&
                         !o.Status.Equals(OrderStatus.Returned, StringComparison.OrdinalIgnoreCase) &&
                         o.CreatedAt >= DateTime.UtcNow.AddDays(-7)))
            .ToListAsync(cancellationToken);

        foreach (var order in orders)
        {
            foreach (var item in order.Items)
            {
                ExtractAndAddFileName(protectedNames, item.FileUrl);
                ExtractAndAddFileName(protectedNames, item.ImageUrl);

                if (item.Attachments != null)
                {
                    foreach (var att in item.Attachments)
                    {
                        ExtractAndAddFileName(protectedNames, att.Url);
                    }
                }
            }
        }

        // 2. Hero slides (promotional 3D models and images)
        var heroMediaUrls = await db.HeroSlides
            .AsNoTracking()
            .Select(s => s.MediaUrl)
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .ToListAsync(cancellationToken);

        foreach (var url in heroMediaUrls)
        {
            ExtractAndAddFileName(protectedNames, url);
        }

        // 3. Active unexpired quote drafts
        var activeDraftUrls = await db.QuoteDrafts
            .AsNoTracking()
            .Where(d => d.ExpiresAt > DateTime.UtcNow)
            .Select(d => d.FileUrl)
            .Where(u => !string.IsNullOrWhiteSpace(u))
            .ToListAsync(cancellationToken);

        foreach (var url in activeDraftUrls)
        {
            ExtractAndAddFileName(protectedNames, url);
        }

        return protectedNames;
    }

    private static void ExtractAndAddFileName(HashSet<string> set, string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return;

        var normalized = rawUrl.Replace('\\', '/').Trim();
        var withoutQuery = normalized.Split('?', 2)[0];
        if (string.IsNullOrWhiteSpace(withoutQuery)) return;

        var fileName = Path.GetFileName(withoutQuery);
        if (!string.IsNullOrWhiteSpace(fileName))
        {
            set.Add(fileName);
        }
    }
}

