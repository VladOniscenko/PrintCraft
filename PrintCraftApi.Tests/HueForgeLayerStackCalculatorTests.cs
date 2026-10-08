using PrintCraftApi.Services.FilamentPainting;
using Xunit;

namespace PrintCraftApi.Tests;

public class HueForgeLayerStackCalculatorTests
{
    [Fact]
    public void TransmissionDistanceModel_CalculatesAccurateOpacityAndAbsorption()
    {
        // For a filament with TD = 1.0mm, thickness 1.0mm should yield ~99% opacity (transmission = 0.01)
        double td = 1.0;
        double opacityAtTd = TransmissionDistanceModel.CalculateOpacity(1.0, td);
        Assert.InRange(opacityAtTd, 0.989, 0.991);

        // Zero thickness should yield 0 opacity
        double opacityAtZero = TransmissionDistanceModel.CalculateOpacity(0.0, td);
        Assert.Equal(0.0, opacityAtZero);

        // Double TD thickness should yield > 99.9% opacity
        double opacityAtDouble = TransmissionDistanceModel.CalculateOpacity(2.0, td);
        Assert.True(opacityAtDouble > 0.999);
    }

    [Fact]
    public void TransmissionDistanceModel_BlendsColorsInLinearSpace()
    {
        var black = new ColorRgb(0, 0, 0);
        var white = new ColorRgb(255, 255, 255);

        // Blending white over black with high TD should yield dark gray / translucent white
        var blended = TransmissionDistanceModel.BlendLayer(black, white, 0.08, 4.0);

        Assert.True(blended.R > 0 && blended.R < 255);
        Assert.Equal(blended.R, blended.G);
        Assert.Equal(blended.G, blended.B);
    }

    [Fact]
    public void BuildStackLookupTable_GeneratesOrderedStepsAndAccurateSwaps()
    {
        var config = new LayerStackConfig
        {
            BaseLayerHeightMm = 0.16,
            LayerHeightMm = 0.08,
            MaxDepthMm = 2.08,
            MinBaseThicknessMm = 0.48,
            Palette = new List<FilamentPaletteItem>
            {
                new()
                {
                    Name = "Black",
                    ColorHex = "#101010",
                    TransmissionDistanceMm = 0.6,
                    StartHeightMm = 0.00,
                    EndHeightMm = 0.64
                },
                new()
                {
                    Name = "Red",
                    ColorHex = "#DC2626",
                    TransmissionDistanceMm = 2.2,
                    StartHeightMm = 0.64,
                    EndHeightMm = 1.20
                },
                new()
                {
                    Name = "Yellow",
                    ColorHex = "#FBBF24",
                    TransmissionDistanceMm = 3.8,
                    StartHeightMm = 1.20,
                    EndHeightMm = 1.68
                },
                new()
                {
                    Name = "White",
                    ColorHex = "#FFFFFF",
                    TransmissionDistanceMm = 5.0,
                    StartHeightMm = 1.68,
                    EndHeightMm = 2.08
                }
            }
        };

        var calculator = new HueForgeLayerStackCalculator();
        var lut = calculator.BuildStackLookupTable(config);

        Assert.NotEmpty(lut);
        Assert.Equal(1, lut[0].LayerIndex);
        Assert.Equal(0.16, lut[0].HeightMm, precision: 2);
        Assert.Equal("Black", lut[0].ActiveFilament.Name);

        var swaps = calculator.GenerateLayerSwapInstructions(config);

        // Must generate 4 filament stages: Start with Black, swap to Red, swap to Yellow, swap to White
        Assert.Equal(4, swaps.Count);

        Assert.Equal(1, swaps[0].SwapNumber);
        Assert.Equal("Black", swaps[0].ColorName);
        Assert.Equal(0.00, swaps[0].HeightMm);

        Assert.Equal(2, swaps[1].SwapNumber);
        Assert.Equal("Red", swaps[1].ColorName);
        Assert.True(swaps[1].LayerNumber > 1);
        Assert.True(swaps[1].HeightMm >= 0.64);

        Assert.Equal(3, swaps[2].SwapNumber);
        Assert.Equal("Yellow", swaps[2].ColorName);

        Assert.Equal(4, swaps[3].SwapNumber);
        Assert.Equal("White", swaps[3].ColorName);
    }

    [Fact]
    public void ProcessImageBuffer_QuantizesPixelsToCorrectHeightAndColor()
    {
        var config = new LayerStackConfig
        {
            BaseLayerHeightMm = 0.16,
            LayerHeightMm = 0.08,
            MaxDepthMm = 1.60,
            MinBaseThicknessMm = 0.48,
            Palette = new List<FilamentPaletteItem>
            {
                new() { Name = "Black", ColorHex = "#000000", TransmissionDistanceMm = 0.6, StartHeightMm = 0.0, EndHeightMm = 0.8 },
                new() { Name = "White", ColorHex = "#FFFFFF", TransmissionDistanceMm = 5.0, StartHeightMm = 0.8, EndHeightMm = 1.6 }
            }
        };

        var calculator = new HueForgeLayerStackCalculator();

        // 2x1 pixel buffer: [0] Black, [1] White
        byte[] rgb = [
            0, 0, 0,       // Black pixel
            255, 255, 255  // White pixel
        ];

        var result = calculator.ProcessImageBuffer(rgb, 2, 1, config, 100, 50);

        Assert.Equal(2, result.Width);
        Assert.Equal(1, result.Height);
        Assert.Equal(2, result.HeightMap.Length);
        Assert.Equal(6, result.BlendedRgbMap.Length);

        // White pixel should have higher Z height than dark pixel
        Assert.True(result.HeightMap[1] > result.HeightMap[0]);
    }

    [Fact]
    public void MeshGeneratorService_GeneratesValidGlbAndStlContainers()
    {
        float[] heightMap = [0.48f, 0.80f, 1.20f, 1.60f];
        byte[] rgbMap = [
            0, 0, 0,
            200, 50, 50,
            240, 200, 20,
            255, 255, 255
        ];

        // 2x2 grid
        byte[] glb = MeshGeneratorService.GenerateBinaryGlb(heightMap, rgbMap, 2, 2, 100.0, 100.0);
        Assert.NotNull(glb);
        Assert.True(glb.Length > 100);

        // Verify GLTF 2.0 Binary magic header: "glTF" = 0x46546C67
        uint magic = System.Buffers.Binary.BinaryPrimitives.ReadUInt32LittleEndian(glb.AsSpan(0, 4));
        uint version = System.Buffers.Binary.BinaryPrimitives.ReadUInt32LittleEndian(glb.AsSpan(4, 4));
        Assert.Equal(0x46546C67u, magic);
        Assert.Equal(2u, version);

        // Verify binary STL output
        byte[] stl = MeshGeneratorService.GenerateBinaryStl(heightMap, 2, 2, 100.0, 100.0, 0.48);
        Assert.NotNull(stl);
        Assert.True(stl.Length >= 84);

        string header = System.Text.Encoding.ASCII.GetString(stl, 0, 30);
        Assert.StartsWith("PrintCraft HueForge Binary STL", header);
    }

    [Fact]
    public void MeshGeneratorService_GeneratesValid3mfArchiveWithInstructions()
    {
        float[] heightMap = [0.48f, 0.80f, 1.20f, 1.60f];
        var config = new LayerStackConfig
        {
            BaseLayerHeightMm = 0.16,
            LayerHeightMm = 0.08,
            MaxDepthMm = 2.00,
            MinBaseThicknessMm = 0.48,
            Palette = new List<FilamentPaletteItem>
            {
                new() { Name = "Black", ColorHex = "#111111", Material = "PLA", TransmissionDistanceMm = 0.6 },
                new() { Name = "White", ColorHex = "#FFFFFF", Material = "PLA", TransmissionDistanceMm = 5.0 }
            }
        };

        var swaps = new List<LayerSwapInstruction>
        {
            new() { SwapNumber = 1, LayerNumber = 1, HeightMm = 0.0, ColorName = "Black", ColorHex = "#111111", Material = "PLA", Instruction = "Start print with Black (#111111)" },
            new() { SwapNumber = 2, LayerNumber = 7, HeightMm = 0.64, ColorName = "White", ColorHex = "#FFFFFF", Material = "PLA", Instruction = "Swap to White (#FFFFFF)" }
        };

        byte[] threeMf = MeshGeneratorService.GenerateBinary3mf(heightMap, 2, 2, 100.0, 100.0, 0.48, config, swaps);
        Assert.NotNull(threeMf);
        Assert.True(threeMf.Length > 200);

        // Verify ZIP magic header: PK\x03\x04 = 0x04034B50
        uint magic = System.Buffers.Binary.BinaryPrimitives.ReadUInt32LittleEndian(threeMf.AsSpan(0, 4));
        Assert.Equal(0x04034b50u, magic);

        // Inspect ZIP entries
        using var ms = new MemoryStream(threeMf);
        using var archive = new System.IO.Compression.ZipArchive(ms, System.IO.Compression.ZipArchiveMode.Read);

        var modelEntry = archive.GetEntry("3D/3dmodel.model");
        Assert.NotNull(modelEntry);

        var contentTypesEntry = archive.GetEntry("[Content_Types].xml");
        Assert.NotNull(contentTypesEntry);

        var relsEntry = archive.GetEntry("_rels/.rels");
        Assert.NotNull(relsEntry);

        var instructionsEntry = archive.GetEntry("Metadata/print_instructions.txt");
        Assert.NotNull(instructionsEntry);

        using var reader = new StreamReader(instructionsEntry.Open());
        string instructionsText = reader.ReadToEnd();
        Assert.Contains("PRINTCRAFT HUEFORGE PRINT INSTRUCTIONS", instructionsText);
        Assert.Contains("Swap # 1", instructionsText);
        Assert.Contains("Black", instructionsText);
        Assert.Contains("White", instructionsText);

        using var modelReader = new StreamReader(modelEntry.Open());
        string modelXml = modelReader.ReadToEnd();
        Assert.Contains("<model", modelXml);
        Assert.Contains("<mesh>", modelXml);
        Assert.Contains("<vertices>", modelXml);
        Assert.Contains("<triangles>", modelXml);
        Assert.Contains("colorgroup", modelXml);
    }

    [Theory]
    [InlineData("Low", 0.16, 0.12, 1.50)]
    [InlineData("low", 0.16, 0.12, 1.50)]
    [InlineData("Medium", 0.16, 0.08, 2.00)]
    [InlineData("medium", 0.16, 0.08, 2.00)]
    [InlineData("Best", 0.16, 0.04, 2.50)]
    [InlineData("best", 0.16, 0.04, 2.50)]
    [InlineData("unknown_quality", 0.16, 0.08, 2.00)] // defaults to Medium
    public void HueForgeQualityPresets_MapsAccurately(string input, double expectedBase, double expectedDetail, double expectedRelief)
    {
        var setting = HueForgeQualityPresets.Resolve(input);
        Assert.NotNull(setting);
        Assert.Equal(expectedBase, setting.SolidBaseHeightMm, precision: 3);
        Assert.Equal(expectedDetail, setting.DetailLayerHeightMm, precision: 3);
        Assert.Equal(expectedRelief, setting.MaxReliefMm, precision: 3);
    }

    [Fact]
    public void MeshGeneratorService_GeneratesValidProductionZipWithHighResStlAndReadme()
    {
        float[] heightMap = [0.48f, 0.80f, 1.20f, 1.60f];
        var config = new LayerStackConfig
        {
            BaseLayerHeightMm = 0.16,
            LayerHeightMm = 0.08,
            MaxDepthMm = 2.00,
            MinBaseThicknessMm = 0.48,
            Palette = new List<FilamentPaletteItem>
            {
                new() { Name = "Black", ColorHex = "#111111", Material = "PLA", TransmissionDistanceMm = 0.6 },
                new() { Name = "Green", ColorHex = "#22C55E", Material = "PLA", TransmissionDistanceMm = 2.0 },
                new() { Name = "White", ColorHex = "#FFFFFF", Material = "PLA", TransmissionDistanceMm = 5.0 }
            }
        };

        var swaps = new List<LayerSwapInstruction>
        {
            new() { SwapNumber = 1, LayerNumber = 1, HeightMm = 0.0, ColorName = "Black", ColorHex = "#111111", Material = "PLA", Instruction = "Start with Black" },
            new() { SwapNumber = 2, LayerNumber = 9, HeightMm = 0.80, ColorName = "Green", ColorHex = "#22C55E", Material = "PLA", Instruction = "Swap to Green" },
            new() { SwapNumber = 3, LayerNumber = 18, HeightMm = 1.52, ColorName = "White", ColorHex = "#FFFFFF", Material = "PLA", Instruction = "Swap to White" }
        };

        byte[] stlBytes = MeshGeneratorService.GenerateBinaryStl(heightMap, 2, 2, 100.0, 100.0, 0.48);
        byte[] zipBytes = MeshGeneratorService.GenerateProductionZip(stlBytes, "test_model.stl", 100.0, 100.0, 2.00, config, swaps);

        Assert.NotNull(zipBytes);
        Assert.True(zipBytes.Length > 200);

        // Verify ZIP magic header: PK\x03\x04
        uint magic = System.Buffers.Binary.BinaryPrimitives.ReadUInt32LittleEndian(zipBytes.AsSpan(0, 4));
        Assert.Equal(0x04034b50u, magic);

        using var ms = new MemoryStream(zipBytes);
        using var archive = new System.IO.Compression.ZipArchive(ms, System.IO.Compression.ZipArchiveMode.Read);

        var stlEntry = archive.GetEntry("test_model.stl");
        Assert.NotNull(stlEntry);

        var readmeEntry = archive.GetEntry("read-me.txt");
        Assert.NotNull(readmeEntry);

        using var reader = new StreamReader(readmeEntry.Open());
        string readme = reader.ReadToEnd();
        Assert.Contains("PRINTCRAFT HUEFORGE PRINT INSTRUCTIONS", readme);
        Assert.Contains("100% Solid Infill", readme);
        Assert.Contains("Swap #1", readme);
        Assert.Contains("Swap to Green (#22C55E) at Layer 9 (0.80mm)", readme);
        Assert.Contains("Swap to White (#FFFFFF) at Layer 18 (1.52mm)", readme);
    }

    [Fact]
    public void ModelGeometryAnalyzer_AnalyzesProductionZipArchive()
    {
        float[] heightMap = [0.48f, 0.80f, 1.20f, 1.60f];
        var config = new LayerStackConfig
        {
            BaseLayerHeightMm = 0.16,
            LayerHeightMm = 0.08,
            MaxDepthMm = 2.00,
            MinBaseThicknessMm = 0.48,
            Palette = new List<FilamentPaletteItem>
            {
                new() { Name = "Black", ColorHex = "#111111", Material = "PLA" }
            }
        };

        var swaps = new List<LayerSwapInstruction>
        {
            new() { SwapNumber = 1, LayerNumber = 1, HeightMm = 0.0, ColorName = "Black", ColorHex = "#111111", Material = "PLA", Instruction = "Start" }
        };

        byte[] stlBytes = MeshGeneratorService.GenerateBinaryStl(heightMap, 2, 2, 100.0, 100.0, 0.48);
        byte[] zipBytes = MeshGeneratorService.GenerateProductionZip(stlBytes, "painting.stl", 100.0, 100.0, 2.00, config, swaps);

        var tempZip = Path.Combine(Path.GetTempPath(), $"test_zip_{Guid.NewGuid():N}.zip");
        File.WriteAllBytes(tempZip, zipBytes);

        try
        {
            var geom = PrintCraftApi.Services.ModelGeometryAnalyzer.Analyze(tempZip);
            Assert.NotNull(geom);
            Assert.True(geom.VolumeMm3 > 100.0);
            Assert.True(geom.SizeX >= 99.0);
            Assert.True(geom.SizeY >= 99.0);
        }
        finally
        {
            if (File.Exists(tempZip)) File.Delete(tempZip);
        }
    }
}

