using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PrintCraft.Shared.Data;
using PrintCraft.Features.Filaments.Services.FilamentPainting;

namespace PrintCraft.Features.Filaments.Controllers;

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
        public string? SlotId { get; set; }
        public string? SessionId { get; set; }
    }

    public sealed class GeneratePaintingResponseDto
    {
        public string ModelGlbUrl { get; set; } = string.Empty;
        public string ModelStlUrl { get; set; } = string.Empty;
        public string ModelZipUrl { get; set; } = string.Empty;
        public string PreviewImageUrl { get; set; } = string.Empty;
        public string PreviewImageBase64 { get; set; } = string.Empty;
        public List<LayerSwapInstruction> LayerSwaps { get; set; } = new();
        public List<LayerColorThresholdDto> LayerColorMap { get; set; } = new();
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
    // Permission: Public Mutate (Whitelisted: 2D-to-3D Image Generation Tool)
    [HttpPost("/api/3d-generate-painting")]
    [AllowAnonymous]
    [EnableRateLimiting("UploadLimit")]
    [RequestSizeLimit(52_428_800)]
    [RequestFormLimits(MultipartBodyLengthLimit = 52_428_800)]
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
            : 0.20; // 0.20mm standard 3D printer first layer height on build plate

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

        // Automatically sort filaments by luminance from darkest (bottom base layer) to lightest (top highlight layer)
        requestConfig.Palette.Sort((a, b) =>
        {
            var lumA = ColorRgb.FromHex(a.ColorHex).PerceivedLuminance;
            var lumB = ColorRgb.FromHex(b.ColorHex).PerceivedLuminance;
            return lumA.CompareTo(lumB);
        });

        // Distribute start and end heights monotonically across base and relief depth
        int colorCount = requestConfig.Palette.Count;
        double availableRelief = Math.Max(0.2, maxDepth - minBaseThickness);
        double stepPerBand = availableRelief / Math.Max(1, colorCount);

        for (int i = 0; i < colorCount; i++)
        {
            var p = requestConfig.Palette[i];
            double startH = i == 0 ? 0.0 : minBaseThickness + i * stepPerBand;
            double endH = i == colorCount - 1 ? maxDepth : minBaseThickness + (i + 1) * stepPerBand;
            p.StartHeightMm = Math.Round(startH, 2);
            p.EndHeightMm = Math.Round(endH, 2);
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

        // Visitor / Session / Slot ID reuse:
        // Instead of generating a brand new Guid on every tweak, associate the file base name with
        // the visitor/session ID or item slot ID (e.g., temp_{visitorId}_{slotId}) so subsequent edits
        // overwrite the previous draft rather than creating redundant files.
        var visitorId = Request.Headers["X-Visitor-Id"].FirstOrDefault()?.Trim();
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value?.Trim();

        var cleanVisitor = SanitizeIdentifier(!string.IsNullOrWhiteSpace(userId) ? userId : visitorId);
        var cleanSlot = SanitizeIdentifier(requestConfig.SlotId ?? requestConfig.SessionId);

        string fileBaseName;
        if (!string.IsNullOrWhiteSpace(cleanVisitor) && !string.IsNullOrWhiteSpace(cleanSlot))
        {
            fileBaseName = $"temp_{cleanVisitor}_{cleanSlot}";
        }
        else if (!string.IsNullOrWhiteSpace(cleanSlot))
        {
            fileBaseName = $"temp_{cleanSlot}";
        }
        else if (!string.IsNullOrWhiteSpace(cleanVisitor))
        {
            fileBaseName = $"temp_{cleanVisitor}_{Guid.NewGuid():N}";
        }
        else
        {
            fileBaseName = $"temp_{Guid.NewGuid():N}";
        }

        // Clean up any stale image with a different extension for this slot if format changed
        try
        {
            var existingFiles = Directory.GetFiles(uploadsDir, $"{fileBaseName}.*");
            foreach (var existing in existingFiles)
            {
                var existingExt = Path.GetExtension(existing).ToLowerInvariant();
                if (existingExt != ext && existingExt != ".glb" && existingExt != ".stl" &&
                    !existing.EndsWith(".upload-meta.json", StringComparison.OrdinalIgnoreCase) &&
                    !existing.EndsWith(".config.json", StringComparison.OrdinalIgnoreCase))
                {
                    System.IO.File.Delete(existing);
                    var metaPath = existing + ".upload-meta.json";
                    if (System.IO.File.Exists(metaPath))
                    {
                        System.IO.File.Delete(metaPath);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to clean up stale image variations for {FileBaseName}", fileBaseName);
        }

        var imageSavedPath = Path.Combine(uploadsDir, $"{fileBaseName}{ext}");

        await using (var fs = new FileStream(imageSavedPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            await image.CopyToAsync(fs);
        }

        var configSavedPath = Path.Combine(uploadsDir, $"{fileBaseName}.config.json");
        await System.IO.File.WriteAllTextAsync(configSavedPath, JsonSerializer.Serialize(requestConfig));

        var imageRelativeUrl = $"/uploads/{fileBaseName}{ext}";

        // Calculate physical dimensions
        double widthMm = requestConfig.TargetWidthMm > 0 ? requestConfig.TargetWidthMm : 150.0;
        double heightMm = requestConfig.TargetHeightMm > 0 ? requestConfig.TargetHeightMm : 150.0;
        double maxDepthMm = layerStackConfig.MaxDepthMm;

        // Decode source image to extract RGB pixels
        DecodedImage decoded;
        byte[]? imageBytes = null;
        try
        {
            imageBytes = await System.IO.File.ReadAllBytesAsync(imageSavedPath);
            decoded = SimpleImageReader.Decode(imageBytes);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not decode uploaded image directly via SimpleImageReader. Using fallback pixel gradient.");
            decoded = CreateFallbackDecodedImage(150, (int)Math.Max(50, Math.Round(150.0 * heightMm / widthMm)));
        }

        // Optimized grid resolution from preset (180 for low/fast preview, 240 for medium, 300 for best)
        int targetGridWidth = qualitySetting.GridResolution > 0 ? qualitySetting.GridResolution : 240;
        int targetGridHeight = (int)Math.Clamp(Math.Round((double)targetGridWidth * decoded.Height / decoded.Width), 50, 450);
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

        // Compute exact layer height color thresholds (zMin, zMax, hexColor, filamentId)
        var layerColorMap = new List<LayerColorThresholdDto>();
        if (lut.Count > 0)
        {
            var curFil = lut[0].ActiveFilament;
            double zStart = 0.0;
            int lStart = lut[0].LayerIndex;

            for (int i = 1; i < lut.Count; i++)
            {
                if (lut[i].ActiveFilament.FilamentId != curFil.FilamentId)
                {
                    layerColorMap.Add(new LayerColorThresholdDto
                    {
                        ZMin = Math.Round(zStart, 2),
                        ZMax = Math.Round(lut[i].HeightMm, 2),
                        HexColor = curFil.ColorHex,
                        FilamentId = curFil.FilamentId.ToString(),
                        FilamentName = curFil.Name,
                        LayerStart = lStart,
                        LayerEnd = lut[i - 1].LayerIndex
                    });
                    curFil = lut[i].ActiveFilament;
                    zStart = lut[i].HeightMm;
                    lStart = lut[i].LayerIndex;
                }
            }

            layerColorMap.Add(new LayerColorThresholdDto
            {
                ZMin = Math.Round(zStart, 2),
                ZMax = Math.Round(lut[^1].HeightMm, 2),
                HexColor = curFil.ColorHex,
                FilamentId = curFil.FilamentId.ToString(),
                FilamentName = curFil.Name,
                LayerStart = lStart,
                LayerEnd = lut[^1].LayerIndex
            });
        }

        // Generate simulated 2D print preview PNG from optical blended RGB buffer
        byte[] previewPngBytes = EncodeRgbToPng(calcResult.BlendedRgbMap, calcResult.Width, calcResult.Height);
        var previewSavedPath = Path.Combine(uploadsDir, $"{fileBaseName}_preview.png");
        await System.IO.File.WriteAllBytesAsync(previewSavedPath, previewPngBytes);

        // Determine base filament color for framing border
        var baseColor = layerStackConfig.Palette.Count > 0
            ? layerStackConfig.Palette[0].Color
            : new ColorRgb(17, 17, 17);

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
            heightMm,
            layerStackConfig.MinBaseThicknessMm,
            baseColor
        );

        var stlSavedPath = Path.Combine(uploadsDir, $"{fileBaseName}.stl");
        var glbSavedPath = Path.Combine(uploadsDir, $"{fileBaseName}.glb");

        await System.IO.File.WriteAllBytesAsync(stlSavedPath, stlBytes);
        await System.IO.File.WriteAllBytesAsync(glbSavedPath, glbBytes);

        var ownerKey = !string.IsNullOrWhiteSpace(userId)
            ? $"user:{userId}"
            : (!string.IsNullOrWhiteSpace(visitorId) ? $"anon:{visitorId}" : "anon:system");

        var metaJson = JsonSerializer.Serialize(new { OwnerKey = ownerKey, UploadedAtUtc = DateTime.UtcNow });
        const string metaSuffix = ".upload-meta.json";

        await System.IO.File.WriteAllTextAsync(imageSavedPath + metaSuffix, metaJson);
        await System.IO.File.WriteAllTextAsync(stlSavedPath + metaSuffix, metaJson);
        await System.IO.File.WriteAllTextAsync(glbSavedPath + metaSuffix, metaJson);
        await System.IO.File.WriteAllTextAsync(previewSavedPath + metaSuffix, metaJson);

        var altUploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!string.Equals(Path.GetFullPath(altUploadsDir), Path.GetFullPath(uploadsDir), StringComparison.OrdinalIgnoreCase))
        {
            Directory.CreateDirectory(altUploadsDir);
            await System.IO.File.WriteAllBytesAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.stl"), stlBytes);
            await System.IO.File.WriteAllBytesAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.glb"), glbBytes);
            await System.IO.File.WriteAllBytesAsync(Path.Combine(altUploadsDir, $"{fileBaseName}_preview.png"), previewPngBytes);
            System.IO.File.Copy(imageSavedPath, Path.Combine(altUploadsDir, $"{fileBaseName}{ext}"), overwrite: true);

            await System.IO.File.WriteAllTextAsync(Path.Combine(altUploadsDir, $"{fileBaseName}{ext}{metaSuffix}"), metaJson);
            await System.IO.File.WriteAllTextAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.stl{metaSuffix}"), metaJson);
            await System.IO.File.WriteAllTextAsync(Path.Combine(altUploadsDir, $"{fileBaseName}.glb{metaSuffix}"), metaJson);
            await System.IO.File.WriteAllTextAsync(Path.Combine(altUploadsDir, $"{fileBaseName}_preview.png{metaSuffix}"), metaJson);
        }

        var modelGlbUrl = $"/uploads/{fileBaseName}.glb";
        var modelStlUrl = $"/uploads/{fileBaseName}.stl";
        var previewImageUrl = $"/uploads/{fileBaseName}_preview.png";
        var previewImageBase64 = $"data:image/png;base64,{Convert.ToBase64String(previewPngBytes)}";
        var modelZipUrl = string.Empty;

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
            PreviewImageUrl = previewImageUrl,
            PreviewImageBase64 = previewImageBase64,
            LayerSwaps = swaps,
            LayerColorMap = layerColorMap,
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

    private static byte[] EncodeRgbToPng(byte[] rgb, int width, int height)
    {
        using var ms = new MemoryStream();
        ms.Write([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

        // IHDR Chunk
        byte[] ihdrData = new byte[13];
        System.Buffers.Binary.BinaryPrimitives.WriteInt32BigEndian(ihdrData.AsSpan(0, 4), width);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32BigEndian(ihdrData.AsSpan(4, 4), height);
        ihdrData[8] = 8;  // 8 bits per sample
        ihdrData[9] = 2;  // ColorType: RGB
        ihdrData[10] = 0; // Deflate compression
        ihdrData[11] = 0; // Standard filter
        ihdrData[12] = 0; // Non-interlaced
        WritePngChunk(ms, "IHDR", ihdrData);

        // IDAT Chunk
        using var idatRaw = new MemoryStream();
        int rowStride = width * 3;
        for (int y = 0; y < height; y++)
        {
            idatRaw.WriteByte(0); // Filter: None
            idatRaw.Write(rgb.AsSpan(y * rowStride, rowStride));
        }
        idatRaw.Position = 0;

        using var idatCompressed = new MemoryStream();
        using (var zlib = new System.IO.Compression.ZLibStream(idatCompressed, System.IO.Compression.CompressionLevel.Optimal, leaveOpen: true))
        {
            idatRaw.CopyTo(zlib);
        }
        WritePngChunk(ms, "IDAT", idatCompressed.ToArray());

        // IEND Chunk
        WritePngChunk(ms, "IEND", Array.Empty<byte>());

        return ms.ToArray();
    }

    private static void WritePngChunk(Stream stream, string type, ReadOnlySpan<byte> data)
    {
        Span<byte> lenBytes = stackalloc byte[4];
        System.Buffers.Binary.BinaryPrimitives.WriteUInt32BigEndian(lenBytes, (uint)data.Length);
        stream.Write(lenBytes);

        byte[] typeBytes = System.Text.Encoding.ASCII.GetBytes(type);
        stream.Write(typeBytes);
        stream.Write(data);

        uint crc = CalculateCrc32(typeBytes, data);
        Span<byte> crcBytes = stackalloc byte[4];
        System.Buffers.Binary.BinaryPrimitives.WriteUInt32BigEndian(crcBytes, crc);
        stream.Write(crcBytes);
    }

    private static uint CalculateCrc32(byte[] typeBytes, ReadOnlySpan<byte> data)
    {
        uint crc = 0xFFFFFFFF;
        void Update(byte b)
        {
            crc ^= b;
            for (int k = 0; k < 8; k++)
            {
                crc = (crc >> 1) ^ (0xEDB88320 & (uint)-((int)(crc & 1)));
            }
        }
        foreach (var b in typeBytes) Update(b);
        foreach (var b in data) Update(b);
        return ~crc;
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

    private static string SanitizeIdentifier(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var cleaned = new System.Text.StringBuilder(raw.Length);
        foreach (var ch in raw)
        {
            if (char.IsLetterOrDigit(ch) || ch == '-' || ch == '_')
            {
                cleaned.Append(ch);
            }
        }
        var result = cleaned.ToString();
        return result.Length > 40 ? result[..40] : result;
    }
}
