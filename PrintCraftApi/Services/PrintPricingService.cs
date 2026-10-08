using System.Diagnostics;
using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;
using PrintCraftApi.Models;

namespace PrintCraftApi.Services;

public interface IPrintPricingService
{
    Task CalculatePricingAsync(Guid orderItemId, string filePath, double scaleFactor, int? infillPercent = 20, string? quality = null, bool? supports = false);
}

public class PrintPricingService : IPrintPricingService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PrintPricingService> _logger;

    public PrintPricingService(IServiceScopeFactory scopeFactory, ILogger<PrintPricingService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public static double ResolveScaleFactor(OrderItem item)
    {
        if (item.ScaleFactor > 0 && Math.Abs(item.ScaleFactor - 1.0) > 0.0001)
        {
            return item.ScaleFactor;
        }

        if (!string.IsNullOrWhiteSpace(item.Size))
        {
            if (item.Size.Equals("Small", StringComparison.OrdinalIgnoreCase)) return 0.5;
            if (item.Size.Equals("Medium", StringComparison.OrdinalIgnoreCase)) return 1.0;
            if (item.Size.Equals("Large", StringComparison.OrdinalIgnoreCase)) return 1.5;

            var parenMatch = Regex.Match(item.Size, @"\(([0-9]+(?:\.[0-9]+)?)\s*x\)", RegexOptions.IgnoreCase);
            if (parenMatch.Success && double.TryParse(parenMatch.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parenScale) && parenScale > 0)
            {
                return parenScale;
            }

            var scaleMatch = Regex.Match(item.Size, @"scale:\s*([0-9]+(?:\.[0-9]+)?)\s*x?", RegexOptions.IgnoreCase);
            if (scaleMatch.Success && double.TryParse(scaleMatch.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var scaleVal) && scaleVal > 0)
            {
                return scaleVal;
            }
        }

        return item.ScaleFactor > 0 ? item.ScaleFactor : 1.0;
    }

    public static double ParsePrintTimeToHours(string? printTime)
    {
        if (string.IsNullOrWhiteSpace(printTime)) return 0;
        var daysMatch = Regex.Match(printTime, @"(\d+)\s*d");
        var hoursMatch = Regex.Match(printTime, @"(\d+)\s*h");
        var minsMatch = Regex.Match(printTime, @"(\d+)\s*m");
        var secsMatch = Regex.Match(printTime, @"(\d+)\s*s");

        int days = daysMatch.Success ? int.Parse(daysMatch.Groups[1].Value) : 0;
        int hours = hoursMatch.Success ? int.Parse(hoursMatch.Groups[1].Value) : 0;
        int mins = minsMatch.Success ? int.Parse(minsMatch.Groups[1].Value) : 0;
        int secs = secsMatch.Success ? int.Parse(secsMatch.Groups[1].Value) : 0;

        return (days * 24.0) + hours + (mins / 60.0) + (secs / 3600.0);
    }

    public async Task CalculatePricingAsync(
        Guid orderItemId,
        string filePath,
        double scaleFactor,
        int? infillPercent = 20,
        string? quality = null,
        bool? supports = false)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PrintCraftDb>();

        var orderItem = await db.OrderItems.FirstOrDefaultAsync(i => i.Id == orderItemId);
        if (orderItem == null)
        {
            _logger.LogWarning("OrderItem not found for pricing calculation: {OrderItemId}", orderItemId);
            return;
        }

        bool isFilamentPainting =
            (!string.IsNullOrWhiteSpace(orderItem.Notes) && orderItem.Notes.Contains("Filament Painting", StringComparison.OrdinalIgnoreCase)) ||
            (!string.IsNullOrWhiteSpace(orderItem.PrintQuality) && orderItem.PrintQuality.Contains("Filament Painting", StringComparison.OrdinalIgnoreCase)) ||
            (!string.IsNullOrWhiteSpace(orderItem.fileName) && orderItem.fileName.Contains("_painting", StringComparison.OrdinalIgnoreCase));

        var effectiveScale = scaleFactor > 0 ? scaleFactor : ResolveScaleFactor(orderItem);
        var effectiveInfill = isFilamentPainting ? 100 : (infillPercent is > 0 and <= 100 ? infillPercent.Value : (orderItem.InfillPercent > 0 ? orderItem.InfillPercent : 20));
        var effectiveQuality = !string.IsNullOrWhiteSpace(quality) ? quality : (!string.IsNullOrWhiteSpace(orderItem.PrintQuality) ? orderItem.PrintQuality : "Standard (0.20mm)");
        var effectiveSupports = isFilamentPainting ? false : (supports ?? orderItem.SupportsNeeded);
        int count = orderItem.Count > 0 ? orderItem.Count : 1;

        // Extract color swap count for Filament Painting items
        int colorSwaps = 0;
        if (isFilamentPainting)
        {
            var swapMatch = Regex.Match(orderItem.Notes ?? "", @"(?:(\d+)\s*swaps|Swaps:\s*(\d+))", RegexOptions.IgnoreCase);
            if (swapMatch.Success)
            {
                var val = !string.IsNullOrEmpty(swapMatch.Groups[1].Value) ? swapMatch.Groups[1].Value : swapMatch.Groups[2].Value;
                int.TryParse(val, out colorSwaps);
            }
            else
            {
                var colorMatch = Regex.Match(orderItem.Notes ?? "", @"(\d+)\s*colors", RegexOptions.IgnoreCase);
                if (colorMatch.Success && int.TryParse(colorMatch.Groups[1].Value, out var numColors))
                {
                    colorSwaps = Math.Max(0, numColors - 1);
                }
                else if (!string.IsNullOrWhiteSpace(orderItem.Color) && orderItem.Color.Contains('|'))
                {
                    colorSwaps = Math.Max(0, orderItem.Color.Split('|').Length - 1);
                }
            }

            if (colorSwaps == 0)
            {
                colorSwaps = 3; // Baseline 4-color painting = 3 filament swaps
            }
        }

        double filamentUsedGrams = 0;
        string? estimatedPrintTime = null;
        bool gcodeGenerated = false;

        // Try headless PrusaSlicer execution if file exists on disk
        if (!string.IsNullOrWhiteSpace(filePath) && File.Exists(filePath))
        {
            var gcodeFilePath = Path.ChangeExtension(filePath, ".gcode");
            string? tempConfigPath = null;

            try
            {
                tempConfigPath = Path.Combine(Path.GetTempPath(), $"prusa_cfg_{Guid.NewGuid():N}.ini");
                await File.WriteAllTextAsync(tempConfigPath, GeneratePrusaConfig(effectiveQuality, effectiveInfill));

                var scaleArg = effectiveScale.ToString(CultureInfo.InvariantCulture);
                var arguments = $"--load \"{tempConfigPath}\" --export-gcode --scale {scaleArg} --fill-density {effectiveInfill}%";

                if (effectiveQuality.Contains("0.12"))
                {
                    arguments += " --layer-height 0.12";
                }
                else if (effectiveQuality.Contains("0.28"))
                {
                    arguments += " --layer-height 0.28";
                }
                else
                {
                    arguments += " --layer-height 0.20";
                }

                if (effectiveSupports)
                {
                    arguments += " --support-material";
                }

                arguments += $" \"{filePath}\"";

                var prusaProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "prusa-slicer",
                        Arguments = arguments,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };

                prusaProcess.Start();
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                await prusaProcess.WaitForExitAsync(cts.Token);

                if (prusaProcess.ExitCode == 0 && File.Exists(gcodeFilePath))
                {
                    var gcodeContent = await File.ReadAllTextAsync(gcodeFilePath);
                    var weightMatch = Regex.Match(gcodeContent, @"; filament used \[g\] = ([\d.]+)");
                    var timeMatch = Regex.Match(gcodeContent, @"; estimated printing time \(normal mode\) = (.+)");

                    if (weightMatch.Success && double.TryParse(weightMatch.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedWeight))
                    {
                        parsedWeight = Math.Max(0.05, parsedWeight);
                        // Slicer returned weight for 1 item. Scale to batch.
                        filamentUsedGrams = parsedWeight * count;
                    }

                    if (timeMatch.Success)
                    {
                        string singleItemTime = timeMatch.Groups[1].Value.Trim();
                        double singleHours = ParsePrintTimeToHours(singleItemTime);
                        singleHours = Math.Max(1.0 / 60.0, singleHours); // Minimum 1 min print time per item
                        
                        // PrusaSlicer's estimate without custom start G-code is just the pure printing time.
                        // We assume ~6 mins of bed heating/leveling prep time per plate.
                        double prepHours = 6.0 / 60.0;
                        double printHoursPerItem = singleHours;
                        
                        double batchTotalHours = prepHours + (printHoursPerItem * count);
                        
                        int totalMins = (int)Math.Round(batchTotalHours * 60);
                        int hours = totalMins / 60;
                        int mins = totalMins % 60;
                        estimatedPrintTime = hours > 0 ? $"{hours}h {mins}m" : $"{mins}m";
                    }

                    if (filamentUsedGrams > 0 && !string.IsNullOrWhiteSpace(estimatedPrintTime))
                    {
                        gcodeGenerated = true;
                    }

                    try { File.Delete(gcodeFilePath); } catch { }
                }
                else
                {
                    var error = await prusaProcess.StandardError.ReadToEndAsync();
                    _logger.LogInformation("PrusaSlicer exited with code {ExitCode}. Falling back to internal geometry engine. Info: {Error}", prusaProcess.ExitCode, error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogInformation("PrusaSlicer CLI not invoked ({Message}). Falling back to internal geometry engine.", ex.Message);
            }
            finally
            {
                if (tempConfigPath != null && File.Exists(tempConfigPath))
                {
                    try { File.Delete(tempConfigPath); } catch { }
                }
            }
        }

        // High-precision volumetric & geometric engine fallback
        if (!gcodeGenerated || filamentUsedGrams <= 0 || string.IsNullOrWhiteSpace(estimatedPrintTime))
        {
            var geometry = ModelGeometryAnalyzer.Analyze(filePath, orderItem.Size);
            var estimate = ModelGeometryAnalyzer.EstimatePrint(
                geometry,
                effectiveScale,
                effectiveInfill,
                effectiveQuality,
                effectiveSupports,
                orderItem.Material,
                count
            );

            filamentUsedGrams = estimate.FilamentUsedGrams;
            estimatedPrintTime = estimate.EstimatedPrintTime;
        }

        // Look up filament price
        var filament = await db.Filaments.FirstOrDefaultAsync(f => f.Material == orderItem.Material && f.Color == orderItem.Color)
                       ?? await db.Filaments.FirstOrDefaultAsync(f => f.Material == orderItem.Material);
        decimal pricePerGram = filament?.PricePerGram ?? 0.05m;

        // Pricing computation based on time and weight (for the entire batch of 'count' items)
        double totalHours = ParsePrintTimeToHours(estimatedPrintTime);

        // Apply Filament Painting color swap time buffer: 12 minutes per color swap
        if (isFilamentPainting && colorSwaps > 0)
        {
            double swapBufferHours = (colorSwaps * 12.0 * count) / 60.0;
            totalHours += swapBufferHours;
            int totalMins = (int)Math.Max(30, Math.Round(totalHours * 60));
            int h = totalMins / 60;
            int m = totalMins % 60;
            estimatedPrintTime = h > 0 ? $"{h}h {m}m" : $"{m}m";
        }

        double timeCost = totalHours * 1.5; // €1.50 per hour
        double materialCost = filamentUsedGrams * (double)pricePerGram;
        double colorSwapFee = isFilamentPainting ? (colorSwaps * 2.00 * count) : 0; // Flat €2.00 fee per swap
        double plateSetupFee = isFilamentPainting ? 2.00 : 0; // Flat setup buffer

        // Start cost is added at the order level for standard CAD, or incorporated for custom filament painting
        var unitPrice = ((timeCost + materialCost + colorSwapFee) / count) + plateSetupFee;

        // However, we want to store the TOTAL batch filament and print time in the database 
        // so that the frontend UI displays the total resource cost for this order item.
        orderItem.EstimatedPrintTime = estimatedPrintTime;
        orderItem.FilamentUsedGrams = Math.Round(filamentUsedGrams, 2);
        orderItem.UnitPrice = Math.Round(unitPrice, 2);
        orderItem.Price = orderItem.UnitPrice;
        if (isFilamentPainting)
        {
            orderItem.InfillPercent = 100;
        }

        await db.SaveChangesAsync();
        _logger.LogInformation("Calculated price for OrderItem {ItemId}: grams={Grams}g, time={Time}, price=€{Price}, swaps={Swaps}",
            orderItem.Id, orderItem.FilamentUsedGrams, orderItem.EstimatedPrintTime, orderItem.Price, colorSwaps);
    }

    private static string GeneratePrusaConfig(string quality, int infillPercent)
    {
        double layerHeight = quality.Contains("0.12") ? 0.12 : (quality.Contains("0.28") ? 0.28 : 0.20);
        return $@"# Minimal PrusaSlicer configuration
printer_model = Generic
nozzle_diameter = 0.4
filament_diameter = 1.75
layer_height = {layerHeight.ToString(CultureInfo.InvariantCulture)}
first_layer_height = 0.20
perimeters = 2
fill_density = {infillPercent}%
fill_pattern = grid
bottom_solid_layers = 3
top_solid_layers = 4
temperature = 210
bed_temperature = 60
bed_shape = 0x0,250x0,250x250,0x250
gcode_flavor = marlin
filament_density = 1.24
filament_cost = 20
";
    }
}
