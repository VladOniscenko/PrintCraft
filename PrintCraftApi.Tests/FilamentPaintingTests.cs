using System.IO;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using PrintCraft.Features.Filaments.Controllers;
using PrintCraft.Features.Filaments.Services.FilamentPainting;
using PrintCraft.Shared.Data;
using Xunit;

namespace PrintCraftApi.Tests;

public class FilamentPaintingTests
{
    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = "/tmp";
        public IFileProvider WebRootFileProvider { get; set; } = null!;
        public string ApplicationName { get; set; } = "PrintCraftApi";
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
        public string ContentRootPath { get; set; } = "/tmp";
        public string EnvironmentName { get; set; } = "Development";
    }

    [Fact]
    public void SimpleImageReader_DecodesPngCorrectly()
    {
        if (!File.Exists("/tmp/test_2x2.png")) return;

        var bytes = File.ReadAllBytes("/tmp/test_2x2.png");
        var decoded = SimpleImageReader.Decode(bytes);

        Assert.Equal(2, decoded.Width);
        Assert.Equal(2, decoded.Height);
        Assert.Equal(12, decoded.RgbBytes.Length);
        // Pixel 0 is Red: 255, 0, 0
        Assert.Equal(255, decoded.RgbBytes[0]);
        Assert.Equal(0, decoded.RgbBytes[1]);
        Assert.Equal(0, decoded.RgbBytes[2]);
    }

    [Fact]
    public async Task FilamentPaintingController_GeneratesGlbWithColors()
    {
        if (!File.Exists("/tmp/test_2x2.png")) return;

        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var db = new PrintCraftDb(options);

        var env = new TestWebHostEnvironment { WebRootPath = "/tmp" };
        var controller = new FilamentPaintingController(db, env, NullLogger<FilamentPaintingController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        var bytes = File.ReadAllBytes("/tmp/test_2x2.png");
        var formFile = new FormFile(new MemoryStream(bytes), 0, bytes.Length, "image", "test.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png"
        };

        var configJson = @"
        {
            ""quality"": ""Medium"",
            ""targetWidthMm"": 150,
            ""targetHeightMm"": 148,
            ""palette"": [
                { ""filamentId"": ""5aa44c24-019b-47ea-aaa8-0fde1b9d6622"", ""name"": ""PLA Black"", ""colorHex"": ""#18181b"", ""material"": ""PLA"", ""transmissionDistanceMm"": 0.5 },
                { ""filamentId"": ""962ae3c2-f59f-45fb-b488-d5677f7489c2"", ""name"": ""PLA Navy Blue"", ""colorHex"": ""#2563eb"", ""material"": ""PLA"", ""transmissionDistanceMm"": 1.8 },
                { ""filamentId"": ""4933226a-8fd0-4918-9bf3-8ef2116854b6"", ""name"": ""PLA Orange"", ""colorHex"": ""#f97316"", ""material"": ""PLA"", ""transmissionDistanceMm"": 3.2 }
            ],
            ""slotId"": ""slot_test123""
        }";

        var result = await controller.GeneratePainting(formFile, configJson);
        var ok = Assert.IsType<OkObjectResult>(result);
        var resDto = Assert.IsType<FilamentPaintingController.GeneratePaintingResponseDto>(ok.Value);

        Assert.NotEmpty(resDto.ModelGlbUrl);
        Assert.NotEmpty(resDto.ModelStlUrl);
        Assert.Equal(3, resDto.LayerSwaps.Count);
    }

    [Fact]
    public void ProcessImageBuffer_ProducesDistinctPaletteColors_AcrossDynamicRange()
    {
        var config = new LayerStackConfig
        {
            BaseLayerHeightMm = 0.16,
            LayerHeightMm = 0.08,
            MaxDepthMm = 2.2,
            MinBaseThicknessMm = 0.48,
            Palette = new List<FilamentPaletteItem>
            {
                new() { Name = "PLA Black", ColorHex = "#18181b", StartHeightMm = 0.0, EndHeightMm = 1.05, TransmissionDistanceMm = 0.5 },
                new() { Name = "PLA Navy Blue", ColorHex = "#2563eb", StartHeightMm = 1.05, EndHeightMm = 1.62, TransmissionDistanceMm = 1.8 },
                new() { Name = "PLA Orange", ColorHex = "#f97316", StartHeightMm = 1.62, EndHeightMm = 2.20, TransmissionDistanceMm = 3.2 }
            }
        };

        var calc = new HueForgeLayerStackCalculator();

        // 3 pixels: pure black (shadow), midtone gray, pure white (highlight)
        byte[] rgbBytes = [
            0, 0, 0,       // pixel 0: dark shadow
            128, 128, 128, // pixel 1: midtone
            255, 255, 255  // pixel 2: highlight
        ];

        var result = calc.ProcessImageBuffer(rgbBytes, 3, 1, config);

        Assert.Equal(3, result.Width);
        Assert.Equal(1, result.Height);
        Assert.Equal(9, result.BlendedRgbMap.Length);

        // Pixel 0 (dark shadow): Should be in the Black filament band (#18181b)
        byte r0 = result.BlendedRgbMap[0];
        byte g0 = result.BlendedRgbMap[1];
        byte b0 = result.BlendedRgbMap[2];
        Assert.InRange(r0, (byte)20, (byte)30);
        Assert.InRange(g0, (byte)20, (byte)30);
        Assert.InRange(b0, (byte)20, (byte)35);

        // Pixel 1 (midtone): Should be in the Navy Blue filament band (#2563eb)
        byte r1 = result.BlendedRgbMap[3];
        byte g1 = result.BlendedRgbMap[4];
        byte b1 = result.BlendedRgbMap[5];
        Assert.True(b1 > r1 && b1 > g1, $"Expected blue dominant for midtone, got R:{r1} G:{g1} B:{b1}");

        // Pixel 2 (highlight): Should be in the Orange filament band (#f97316)
        byte r2 = result.BlendedRgbMap[6];
        byte g2 = result.BlendedRgbMap[7];
        byte b2 = result.BlendedRgbMap[8];
        Assert.True(r2 > 200 && r2 > b2, $"Expected orange dominant for highlight, got R:{r2} G:{g2} B:{b2}");
    }
}
