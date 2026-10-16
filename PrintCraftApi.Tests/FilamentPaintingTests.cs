using System.IO;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using PrintCraftApi.Services.FilamentPainting;
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
}
