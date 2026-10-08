using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using Xunit;

namespace PrintCraftApi.Tests;

public class UploadControllerTests
{
    private static PrintCraftDb CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new PrintCraftDb(options);
    }

    private static UploadController CreateController(PrintCraftDb db, string visitorId = "test-visitor")
    {
        var controller = new UploadController(db);
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Visitor-Id"] = visitorId;
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
        return controller;
    }

    private static IFormFile CreateFormFile(string fileName, string contentType, byte[] content)
    {
        var stream = new MemoryStream(content);
        return new FormFile(stream, 0, content.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }

    [Theory]
    [InlineData("photo.png", "image/png")]
    [InlineData("graphic.jpg", "image/jpeg")]
    [InlineData("artwork.jpeg", "image/jpeg")]
    [InlineData("vector.svg", "image/svg+xml")]
    [InlineData("image.webp", "image/webp")]
    public async Task Upload_RejectImages_ReturnsBadRequest(string fileName, string contentType)
    {
        var db = CreateDbContext(Guid.NewGuid().ToString());
        var controller = CreateController(db);

        // Even with valid PNG/JPG/WebP headers, the 3D upload endpoint must strictly reject images
        byte[] payload = fileName.EndsWith(".png")
            ? new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00 }
            : Encoding.UTF8.GetBytes("fake-image-content");

        var file = CreateFormFile(fileName, contentType, payload);

        var result = await controller.Upload(file);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
        var json = System.Text.Json.JsonSerializer.Serialize(badRequest.Value);
        Assert.Contains("Image files are not accepted", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Upload_WithImageContentType_EvenWith3dExtension_ReturnsBadRequest()
    {
        var db = CreateDbContext(Guid.NewGuid().ToString());
        var controller = CreateController(db);

        var file = CreateFormFile("spoofed.stl", "image/png", Encoding.ASCII.GetBytes("solid test\nendsolid test\n"));

        var result = await controller.Upload(file);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
        var json = System.Text.Json.JsonSerializer.Serialize(badRequest.Value);
        Assert.Contains("Image files are not accepted", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Upload_ValidStlFile_ReturnsOk()
    {
        var db = CreateDbContext(Guid.NewGuid().ToString());
        var controller = CreateController(db);

        var stlContent = Encoding.ASCII.GetBytes("solid test_box\nfacet normal 0 0 0\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 1 1 0\nendloop\nendfacet\nendsolid test_box\n");
        var file = CreateFormFile("model.stl", "model/stl", stlContent);

        var result = await controller.Upload(file);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
        var json = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
        Assert.Contains("/uploads/", json);
        Assert.Contains(".stl", json);
    }

    [Fact]
    public async Task Upload_UnsupportedTextFile_ReturnsBadRequest()
    {
        var db = CreateDbContext(Guid.NewGuid().ToString());
        var controller = CreateController(db);

        var file = CreateFormFile("document.txt", "text/plain", Encoding.UTF8.GetBytes("This is text"));

        var result = await controller.Upload(file);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }
}

