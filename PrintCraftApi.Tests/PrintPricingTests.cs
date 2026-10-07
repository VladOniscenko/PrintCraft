using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;

namespace PrintCraftApi.Tests;

public class PrintPricingTests
{
    [Theory]
    [InlineData(1.0, "11 x 20 x 1.8 mm (1.00x)", 1.0)]
    [InlineData(1.0, "11 x 20 x 1.8 mm", 1.0)]
    [InlineData(1.0, "150 x 120 x 50 mm (1.00x)", 1.0)]
    [InlineData(1.5, "11 x 20 x 1.8 mm (1.50x)", 1.5)]
    [InlineData(2.0, "11 x 20 x 1.8 mm (2.00x)", 2.0)]
    [InlineData(1.0, "Small", 0.5)]
    [InlineData(1.0, "Medium", 1.0)]
    [InlineData(1.0, "Large", 1.5)]
    [InlineData(1.0, "Scale: 1.75x", 1.75)]
    [InlineData(1.0, "50 x 50 x 20 mm (0.80x)", 0.80)]
    public void ResolveScaleFactor_DoesNotConfuseDimensionsWithScale(double itemScale, string sizeString, double expectedScale)
    {
        var item = new OrderItem
        {
            ScaleFactor = itemScale,
            Size = sizeString
        };

        var resolved = PrintPricingService.ResolveScaleFactor(item);
        Assert.Equal(expectedScale, resolved, precision: 2);
    }

    [Fact]
    public void ModelGeometryAnalyzer_EstimatesTinyModelAccurately()
    {
        // 11 x 20 x 1.8 mm model (lockS2.stl dimensions)
        var geometry = ModelGeometryAnalyzer.ParseDimensions("11 x 20 x 1.8 mm (1.00x)");
        Assert.NotNull(geometry);
        Assert.Equal(11.0, geometry.SizeX);
        Assert.Equal(20.0, geometry.SizeY);
        Assert.Equal(1.8, geometry.SizeZ);

        // Bounding box volume is 396 mm^3 = 0.396 cm^3
        // Solid PLA is 0.49g, printed PLA with infill and shells is ~0.3-0.45g
        var estimate = ModelGeometryAnalyzer.EstimatePrint(
            geometry,
            scaleFactor: 1.0,
            infillPercent: 15,
            quality: "0.12mm (Detail)",
            supportsNeeded: false,
            material: "PLA"
        );

        // Filament must be less than 1 gram!
        Assert.True(estimate.FilamentUsedGrams < 1.0, $"Expected < 1g, got {estimate.FilamentUsedGrams}g");
        Assert.True(estimate.FilamentUsedGrams > 0.05, $"Expected > 0.05g, got {estimate.FilamentUsedGrams}g");

        // Print time must be around 6 to 10 minutes (modern slicer baseline)
        Assert.InRange(estimate.TotalMinutes, 5, 12);
        Assert.Contains("m", estimate.EstimatedPrintTime);
        Assert.DoesNotContain("1164h", estimate.EstimatedPrintTime);
    }

    [Fact]
    public void ModelGeometryAnalyzer_ParsesBinaryStlAccurately()
    {
        // Use repository sample STL if available
        var samplePath = Path.GetFullPath("../frontend/src/assets/hero-models/cable-holder.stl");
        if (!File.Exists(samplePath))
        {
            samplePath = Path.GetFullPath("frontend/src/assets/hero-models/cable-holder.stl");
        }

        if (File.Exists(samplePath))
        {
            var geometry = ModelGeometryAnalyzer.AnalyzeStl(samplePath);
            Assert.NotNull(geometry);
            Assert.True(geometry.IsExactMesh);
            Assert.InRange(geometry.SizeX, 58.0, 62.0); // 60mm
            Assert.InRange(geometry.SizeY, 15.0, 18.0); // 16.75mm
            Assert.InRange(geometry.SizeZ, 14.0, 16.0); // 15mm
            Assert.InRange(geometry.VolumeMm3, 3800.0, 4200.0); // ~4017 mm^3 (4.02 cm^3)

            var estimate = ModelGeometryAnalyzer.EstimatePrint(
                geometry,
                scaleFactor: 1.0,
                infillPercent: 20,
                quality: "Standard (0.20mm)",
                supportsNeeded: false,
                material: "PLA"
            );

            // 4.02 cm3 PLA at 20% infill: ~3.5 - 4.5g
            Assert.InRange(estimate.FilamentUsedGrams, 3.0, 5.0);
            // Print time: ~15 to 22 minutes
            Assert.InRange(estimate.TotalMinutes, 12, 25);
        }
    }

    [Fact]
    public async Task PrintPricingService_CalculatesRealisticPriceAndPrintMetrics()
    {
        var services = new ServiceCollection();
        var dbName = Guid.NewGuid().ToString("N");
        services.AddDbContext<PrintCraftDb>(opt => opt.UseInMemoryDatabase(dbName));
        services.AddLogging();
        services.AddScoped<IPrintPricingService, PrintPricingService>();

        var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PrintCraftDb>();
        var pricingService = scope.ServiceProvider.GetRequiredService<IPrintPricingService>();

        db.Filaments.Add(new Filament
        {
            Material = "PLA",
            Color = "Custom",
            PricePerGram = 0.04m // €0.04/g
        });

        var orderItem = new OrderItem
        {
            Size = "11 x 20 x 1.8 mm (1.00x)",
            ScaleFactor = 1.0,
            Material = "PLA",
            Color = "Custom",
            InfillPercent = 15,
            PrintQuality = "0.12mm (Detail)",
            Count = 1
        };
        db.OrderItems.Add(orderItem);
        await db.SaveChangesAsync();

        // Calculate pricing
        await pricingService.CalculatePricingAsync(
            orderItem.Id,
            filePath: "", // Fallback to dimensions
            scaleFactor: 1.0,
            infillPercent: 15,
            quality: "0.12mm (Detail)",
            supports: false
        );

        // Reload from db
        await db.Entry(orderItem).ReloadAsync();
        var updated = orderItem;
        Assert.NotNull(updated);
        Assert.NotNull(updated.FilamentUsedGrams);
        Assert.NotNull(updated.EstimatedPrintTime);

        // Must be less than 1g
        Assert.True(updated.FilamentUsedGrams < 1.0, $"Expected < 1g, got {updated.FilamentUsedGrams}g");
        // Must NOT be 18634g or 1164h!
        Assert.False(updated.FilamentUsedGrams > 100, "Filament weight was wildly inflated!");
        Assert.DoesNotContain("1164h", updated.EstimatedPrintTime);
        Assert.DoesNotContain("100h", updated.EstimatedPrintTime);

        // Price is based on material + time; plate cost (€2.00) is added separately at the order level
        Assert.True(updated.Price > 0, "Price should be greater than zero");
    }

    [Fact]
    public void EstimatePrint_ScalingMultipliesWeightProportionally()
    {
        var geom = new ModelGeometry(VolumeMm3: 10000, SurfaceAreaMm2: 3000, SizeX: 20, SizeY: 20, SizeZ: 25, IsExactMesh: true);

        var est1 = ModelGeometryAnalyzer.EstimatePrint(geom, scaleFactor: 1.0, infillPercent: 20, quality: "Standard (0.20mm)", supportsNeeded: false, material: "PLA");
        var est2 = ModelGeometryAnalyzer.EstimatePrint(geom, scaleFactor: 2.0, infillPercent: 20, quality: "Standard (0.20mm)", supportsNeeded: false, material: "PLA");

        // Scale 2x means roughly 8x volume (adjusted for shell/infill ratio)
        Assert.True(est2.FilamentUsedGrams > est1.FilamentUsedGrams * 5.0);
        Assert.True(est2.FilamentUsedGrams < est1.FilamentUsedGrams * 9.0);
        // Print time should also increase substantially (more than double due to 2x layers and ~8x extrusion)
        Assert.True(est2.TotalMinutes > est1.TotalMinutes * 2);
    }

    [Fact]
    public void EstimatePrint_LayerHeightAffectsTimeAppropriately()
    {
        var geom = new ModelGeometry(VolumeMm3: 20000, SurfaceAreaMm2: 5000, SizeX: 30, SizeY: 30, SizeZ: 30, IsExactMesh: true);

        var detail = ModelGeometryAnalyzer.EstimatePrint(geom, scaleFactor: 1.0, infillPercent: 20, quality: "0.12mm (Detail)", supportsNeeded: false, material: "PLA");
        var draft = ModelGeometryAnalyzer.EstimatePrint(geom, scaleFactor: 1.0, infillPercent: 20, quality: "0.28mm (Draft)", supportsNeeded: false, material: "PLA");

        // Detail has more than double the layers of Draft, so it must take significantly longer
        Assert.True(detail.TotalMinutes > draft.TotalMinutes);
    }
}
