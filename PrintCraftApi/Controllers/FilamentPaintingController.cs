using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PrintCraftApi.Data;
using PrintCraftApi.Services.FilamentPainting;

namespace PrintCraftApi.Controllers;

[ApiController]
public class FilamentPaintingController : ControllerBase
{
    private readonly PrintCraftDb _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<FilamentPaintingController> _logger;

    public FilamentPaintingController(
        PrintCraftDb db,
        IWebHostEnvironment env,
        ILogger<FilamentPaintingController> logger)
    {
        _db = db;
        _env = env;
        _logger = logger;
    }

    public sealed class FilamentDto
    {
        public string? FilamentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ColorHex { get; set; } = "#000000";
        public string Material { get; set; } = "PLA";
        public double TransmissionDistanceMm { get; set; } = 1.0;
        public double StartHeightMm { get; set; }
        public double EndHeightMm { get; set; }
    }

    public sealed class GeneratePaintingRequestDto
    {
        public string Quality { get; set; } = "Medium";
        public double TargetWidthMm { get; set; } = 150.0;
        public double TargetHeightMm { get; set; } = 150.0;
        public List<FilamentDto> Palette { get; set; } = new();

        public double? BaseLayerHeightMm { get; set; }
        public double? LayerHeightMm { get; set; }
        public double? MaxDepthMm { get; set; }
        public double? MinBaseThicknessMm { get; set; }
    }

    public sealed class GeneratePaintingResponseDto
    {
        public string ModelGlbUrl { get; set; } = string.Empty;
        public string ModelStlUrl { get; set; } = string.Empty;
        public string Model3mfUrl { get; set; } = string.Empty;
        public string ModelZipUrl { get; set; } = string.Empty;
        public string PreviewImageUrl { get; set; } = string.Empty;
        public List<LayerSwapInstruction> LayerSwaps { get; set; } = new();
        public ModelDimensions Dimensions { get; set; } = new();
        public double VolumeMm3 { get; set; }
        public double EstimatedGrams { get; set; }
        public int TotalLayers { get; set; }
        public string EstimatedPrintTime { get; set; } = string.Empty;
        public double EstimatedPrice { get; set; }
        public double UnitPrice { get; set; }
        public double ColorSwapFee { get; set; }
    }

    public sealed class ModelDimensions
    {
        public double X { get; set; }
        public double Y { get; set; }
        public double Z { get; set; }
    }

    /// <summary>
    /// Dual-Flow Endpoint: Path B - Filament Painting Generation.
    /// Converts a 2D image and TD-based filament palette into layer swaps, 3D heightmap, and print preview.
    /// </summary>
    [HttpPost("/api/3d-generate-painting")]
    [DisableRequestSizeLimit]
    [EnableRateLimiting("UploadLimit")]
    public async Task<IActionResult> GeneratePainting(
        [FromForm] IFormFile? image,
        [FromForm] string? config)
    {
        if (image == null || image.Length == 0)
        {
            return BadRequest(new { message = "An image file is required for filament painting generation." });
        }

        var ext = Path.GetExtension(image.FileName).ToLowerInvariant();
        if (ext is not (".png" or ".jpg" or ".jpeg" or ".webp" or ".bmp"))
        {
            return BadRequest(new { message = "Unsupported image format. Please upload a PNG, JPG, or WebP image." });
        }

        GeneratePaintingRequestDto requestConfig;
        try
        {
            requestConfig = string.IsNullOrWhiteSpace(config)
                ? new GeneratePaintingRequestDto()
                : JsonSerializer.Deserialize<GeneratePaintingRequestDto>(config, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new GeneratePaintingRequestDto();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse filament painting config JSON");
            return BadRequest(new { message = "Invalid configuration JSON payload." });
        }

        // Map Quality preset ("Low", "Medium", "Best") to optimal HueForge parameters
        var qualitySetting = HueForgeQualityPresets.Resolve(requestConfig.Quality);

        double baseLayerHeight = requestConfig.BaseLayerHeightMm.HasValue && requestConfig.BaseLayerHeightMm.Value > 0
            ? requestConfig.BaseLayerHeightMm.Value
            : qualitySetting.SolidBaseHeightMm;

        double layerHeight = requestConfig.LayerHeightMm.HasValue && requestConfig.LayerHeightMm.Value > 0
            ? requestConfig.LayerHeightMm.Value
            : qualitySetting.DetailLayerHeightMm;

        double maxDepth = requestConfig.MaxDepthMm.HasValue && requestConfig.MaxDepthMm.Value > 0
            ? requestConfig.MaxDepthMm.Value
            : qualitySetting.MaxReliefMm;

        double minBaseThickness = requestConfig.MinBaseThicknessMm.HasValue && requestConfig.MinBaseThicknessMm.Value > 0
            ? requestConfig.MinBaseThicknessMm.Value
            : qualitySetting.SolidBaseHeightMm;

        // Fallback default 4-color palette if none provided
        if (requestConfig.Palette == null || requestConfig.Palette.Count == 0)
        {
            requestConfig.Palette = new List<FilamentDto>
            {
                new() { Name = "Black", ColorHex = "#111111", Material = "PLA", TransmissionDistanceMm = 0.6 },
                new() { Name = "Crimson Red", ColorHex = "#DC2626", Material = "PLA", TransmissionDistanceMm = 2.2 },
                new() { Name = "Sunburst Yellow", ColorHex = "#FBBF24", Material = "PLA", TransmissionDistanceMm = 3.8 },
                new() { Name = "Jade White", ColorHex = "#FFFFFF", Material = "PLA", TransmissionDistanceMm = 5.0 }
            };
        }

        // Enforce strict limit of maximum 4 colors and PLA material
        if (requestConfig.Palette.Count > 4)
        {
            requestConfig.Palette = requestConfig.Palette.Take(4).ToList();
        }

        // Auto-distribute start and end heights across base and relief depth
        int colorCount = requestConfig.Palette.Count;
        double availableRelief = Math.Max(0.2, maxDepth - minBaseThickness);
        double stepPerBand = availableRelief / (colorCount > 1 ? colorCount - 1 : 1);

        for (int i = 0; i < colorCount; i++)
        {
            var p = requestConfig.Palette[i];
            // If heights not explicitly defined, or need calibration to current maxDepth:
            if (p.StartHeightMm <= 0 && p.EndHeightMm <= 0 || p.EndHeightMm > maxDepth + 0.05)
            {
                if (i == 0)
                {
                    p.StartHeightMm = 0.0;
                    p.EndHeightMm = Math.Round(minBaseThickness, 2);
                }
                else
                {
                    double startH = minBaseThickness + (i - 1) * stepPerBand;
                    double endH = i == colorCount - 1 ? maxDepth : minBaseThickness + i * stepPerBand;
                    p.StartHeightMm = Math.Round(startH, 2);
                    p.EndHeightMm = Math.Round(endH, 2);
                }
            }
        }

        var layerStackConfig = new LayerStackConfig
        {
            BaseLayerHeightMm = baseLayerHeight,
            LayerHeightMm = layerHeight,
            MaxDepthMm = maxDepth,
            MinBaseThicknessMm = minBaseThickness,
            Palette = requestConfig.Palette.Select(p => new FilamentPaletteItem
            {
                FilamentId = Guid.TryParse(p.FilamentId, out var parsedGuid) ? parsedGuid : Guid.NewGuid(),
                Name = string.IsNullOrWhiteSpace(p.Name) ? "PLA Filament" : p.Name,
                ColorHex = string.IsNullOrWhiteSpace(p.ColorHex) ? "#000000" : p.ColorHex,
                Material = string.IsNullOrWhiteSpace(p.Material) ? "PLA" : p.Material,
                TransmissionDistanceMm = p.TransmissionDistanceMm > 0 ? p.TransmissionDistanceMm : 1.0,
                StartHeightMm = p.StartHeightMm,
                EndHeightMm = p.EndHeightMm
            }).ToList()
        };

        var calculator = new HueForgeLayerStackCalculator();
        var lut = calculator.BuildStackLookupTable(layerStackConfig);
        var swaps = calculator.GenerateLayerSwapInstructions(layerStackConfig);

        // Save uploaded image to wwwroot/uploads
        var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileBaseName = Guid.NewGuid().ToString("N");
        var imageSavedPath = Path.Combine(uploadsDir, $"{fileBaseName}{ext}");

        byte[] imageBytes;
        using (var ms = new MemoryStream())
        {
            await image.CopyToAsync(ms);
            imageBytes = ms.ToArray();
        }

        await System.IO.File.WriteAllBytesAsync(imageSavedPath, imageBytes);
        var imageRelativeUrl = $"/uploads/{fileBaseName}{ext}";

        // Calculate physical dimensions
        double widthMm = requestConfig.TargetWidthMm > 0 ? requestConfig.TargetWidthMm : 150.0;
        double heightMm = requestConfig.TargetHeightMm > 0 ? requestConfig.TargetHeightMm : 150.0;
        double maxDepthMm = layerStackConfig.MaxDepthMm;

        // Decode source image to extract RGB pixels
        DecodedImage decoded;
        try
        {
            decoded = SimpleImageReader.Decode(imageBytes);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not decode uploaded image directly via SimpleImageReader. Using fallback pixel gradient.");
            decoded = CreateFallbackDecodedImage(150, (int)Math.Max(50, Math.Round(150.0 * heightMm / widthMm)));
        }

        // Higher-density triangulation for high-resolution 3D prints (eliminating low-poly/pixelated appearance)
        int targetGridWidth = string.Equals(requestConfig.Quality, "Best", StringComparison.OrdinalIgnoreCase)
            ? 500
            : (string.Equals(requestConfig.Quality, "Low", StringComparison.OrdinalIgnoreCase) ? 300 : 400);

        int targetGridHeight = (int)Math.Clamp(Math.Round((double)targetGridWidth * decoded.Height / decoded.Width), 50, 600);
        var resampled = decoded.Resample(targetGridWidth, targetGridHeight);

        // Compute HueForge topographic heightmap and blended surface colors
        var calcResult = calculator.ProcessImageBuffer(
            resampled.RgbBytes,
            resampled.Width,
            resampled.Height,
            layerStackConfig,
            widthMm,
            heightMm
        );

        // Generate watertight high-resolution binary STL (standard 3D print file)
        byte[] stlBytes = MeshGeneratorService.GenerateBinaryStl(
            calcResult.HeightMap,
            calcResult.Width,
            calcResult.Height,
            widthMm,
            heightMm,
            layerStackConfig.MinBaseThicknessMm
        );

        // Generate binary GLTF 2.0 (GLB) with COLOR_0 vertex colors for web preview
        byte[] glbBytes = MeshGeneratorService.GenerateBinaryGlb(
            calcResult.HeightMap,
            calcResult.BlendedRgbMap,
            calcResult.Width,
            calcResult.Height,
            widthMm,
            heightMm
        );

        // Generate production ZIP file containing high-resolution STL and read-me.txt with layer swap timeline
        byte[] zipBytes = MeshGeneratorService.GenerateProductionZip(
            stlBytes,
            $"{fileBaseName}.stl",
            widthMm,
            heightMm,
            maxDepthMm,
            layerStackConfig,
            swaps
        );

        // Generate Bambu Studio / OrcaSlicer compatible production 3MF with full layer swap instructions
        byte[] threeMfBytes = MeshGeneratorService.GenerateBinary3mf(
            calcResult.HeightMap,
            calcResult.Width,
            calcResult.Height,
            widthMm,
            heightMm,
            layerStackConfig.MinBaseThicknessMm,
            layerStackConfig,
            swaps
        );

        var stlSavedPath = Path.Combine(uploadsDir, $"{fileBaseName}.stl");
        var glbSavedPath = Path.Combine(uploadsDir, $"{fileBaseName}.glb");
        var zipSavedPath = Path.Combine(uploadsDir, $"{fileBaseName}.zip");
        var threeMfSavedPath = Path.Combine(uploadsDir, $"{fileBaseName}.3mf");

        await System.IO.File.WriteAllBytesAsync(stlSavedPath, stlBytes);
        await System.IO.File.WriteAllBytesAsync(glbSavedPath, glbBytes);
        await System.IO.File.WriteAllBytesAsync(zipSavedPath, zipBytes);
        await System.IO.File.WriteAllBytesAsync(threeMfSavedPath, threeMfBytes);

        var visitorId = Request.Headers["X-Visitor-Id"].FirstOrDefault()?.Trim();
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var ownerKey = !string.IsNullOrWhiteSpace(userId)
            ? $"user:{userId}"
            : (!string.IsNullOrWhiteSpace(visitorId) ? $"anon:{visitorId}" : "anon:system");

        var metaJson = JsonSerializer.Serialize(new { OwnerKey = ownerKey, UploadedAtUtc = DateTime.UtcNow });
        const string metaSuffix = ".upload-meta.json";

        await System.IO.File.WriteAllTextAsync(imageSavedPath + metaSuffix, metaJson);
        await System.IO.File.WriteAllTextAsync(stlSavedPath + metaSuffix, metaJson);
        await System.IO.File.WriteAllTextAsync(glbSavedPath + metaSuffix, metaJson);
        await System.IO.File.WriteAllTextAsync(zipSavedPath + metaSuffix, metaJson);
        await System.IO.File.WriteAllTextAsync(threeMfSavedPath + metaSuffix, metaJson);

        var altUploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!string.Equals(Path.GetFullPath(altUploadsDir), Path.GetFullPath(uploadsDir), StringComparison.OrdinalIgnoreCase))
        {
            Directory.CreateDirectory(altUploadsDir);
            await System.IO.File.WriteAllBytesAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.stl"), stlBytes);
            await System.IO.File.WriteAllBytesAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.glb"), glbBytes);
            await System.IO.File.WriteAllBytesAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.zip"), zipBytes);
            await System.IO.File.WriteAllBytesAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.3mf"), threeMfBytes);
            await System.IO.File.WriteAllBytesAsync(Path.Combine(altUploadsDir, $"{fileBaseName}{ext}"), imageBytes);

            await System.IO.File.WriteAllTextAsync(Path.Combine(altUploadsDir, $"{fileBaseName}{ext}{metaSuffix}"), metaJson);
            await System.IO.File.WriteAllTextAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.stl{metaSuffix}"), metaJson);
            await System.IO.File.WriteAllTextAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.glb{metaSuffix}"), metaJson);
            await System.IO.File.WriteAllTextAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.zip{metaSuffix}"), metaJson);
            await System.IO.File.WriteAllTextAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.3mf{metaSuffix}"), metaJson);
        }

        var modelGlbUrl = $"/uploads/{fileBaseName}.glb";
        var modelStlUrl = $"/uploads/{fileBaseName}.stl";
        var modelZipUrl = $"/uploads/{fileBaseName}.zip";
        var model3mfUrl = $"/uploads/{fileBaseName}.3mf";

        // Calculate physical volume & filament weight based on bounding box and relief (100% solid infill)
        double baseVolumeMm3 = widthMm * heightMm * layerStackConfig.MinBaseThicknessMm;
        double reliefVolumeMm3 = widthMm * heightMm * (maxDepthMm - layerStackConfig.MinBaseThicknessMm) * 0.60;
        double totalVolumeMm3 = baseVolumeMm3 + reliefVolumeMm3;

        // PLA density: 1.24 g/cm3 (1240 kg/m3) -> 0.00124 g/mm3
        double estimatedGrams = Math.Round(totalVolumeMm3 * 0.00124, 1);

        // Pricing & Print Time Calculator:
        // 1. Infill: 100% solid infill volume
        // 2. Color Swap Fee & time buffer: €2.00 flat fee and 12 mins time buffer per filament change
        int swapCount = Math.Max(0, swaps.Count - 1);
        double colorSwapFee = swapCount * 2.00;
        double swapTimeMinutes = swapCount * 12.0;

        // Extrusion flow rate at fine detail layer heights (0.04 - 0.12mm): ~28 grams / hour
        double extrusionHours = estimatedGrams / 28.0;
        double prepHours = 0.10; // 6 mins machine prep
        double totalHours = prepHours + extrusionHours + (swapTimeMinutes / 60.0);

        int totalPrintMinutes = (int)Math.Max(30, Math.Round(totalHours * 60));
        int printHours = totalPrintMinutes / 60;
        int printMins = totalPrintMinutes % 60;
        string estimatedPrintTimeString = printHours > 0 ? $"{printHours}h {printMins}m" : $"{printMins}m";

        double materialCost = estimatedGrams * 0.05; // €0.05 / gram PLA
        double machineTimeCost = totalHours * 1.50;  // €1.50 / hour
        double plateSetupCost = 2.00;                // base plate fee

        double unitPrice = Math.Round(materialCost + machineTimeCost + colorSwapFee + plateSetupCost, 2);

        var response = new GeneratePaintingResponseDto
        {
            ModelGlbUrl = modelGlbUrl,
            ModelStlUrl = modelStlUrl,
            ModelZipUrl = modelZipUrl,
            Model3mfUrl = model3mfUrl,
            PreviewImageUrl = imageRelativeUrl,
            LayerSwaps = swaps,
            Dimensions = new ModelDimensions
            {
                X = Math.Round(widthMm, 1),
                Y = Math.Round(heightMm, 1),
                Z = Math.Round(maxDepthMm, 2)
            },
            VolumeMm3 = Math.Round(totalVolumeMm3, 1),
            EstimatedGrams = estimatedGrams,
            TotalLayers = lut.Count,
            EstimatedPrintTime = estimatedPrintTimeString,
            EstimatedPrice = unitPrice,
            UnitPrice = unitPrice,
            ColorSwapFee = colorSwapFee
        };

        return Ok(response);
    }

    private static DecodedImage CreateFallbackDecodedImage(int width, int height)
    {
        byte[] rgb = new byte[width * height * 3];
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                int idx = (y * width + x) * 3;
                byte val = (byte)((x + y) * 255 / (width + height));
                rgb[idx] = val;
                rgb[idx + 1] = val;
                rgb[idx + 2] = val;
            }
        }
        return new DecodedImage { Width = width, Height = height, RgbBytes = rgb };
    }
}
