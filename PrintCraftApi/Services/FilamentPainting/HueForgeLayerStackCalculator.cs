namespace PrintCraftApi.Services.FilamentPainting;

/// <summary>
/// Core HueForge-style layer-height calculator and blending engine.
/// Computes physical layer stacking, optical color blending via Transmission Distance (TD),
/// and generates printer layer-swap instructions.
/// </summary>
public class HueForgeLayerStackCalculator
{
    /// <summary>
    /// Builds the discrete layer lookup table (LUT) for the given layer configuration and filament palette.
    /// Simulates the physical deposition of filament layer-by-layer and calculates the resulting
    /// blended surface color for every discrete layer height.
    /// </summary>
    public List<LayerStackStep> BuildStackLookupTable(LayerStackConfig config)
    {
        ArgumentNullException.ThrowIfNull(config);
        if (config.Palette.Count == 0)
        {
            throw new ArgumentException("At least one filament must be present in the palette.", nameof(config));
        }

        var sortedPalette = NormalizePaletteRanges(config);
        var steps = new List<LayerStackStep>();

        double baseHeight = Math.Max(0.08, config.BaseLayerHeightMm);
        double layerHeight = Math.Max(0.02, config.LayerHeightMm);
        double maxDepth = Math.Max(baseHeight, config.MaxDepthMm);

        // Determine total discrete layers
        int totalLayers = 1 + (int)Math.Floor(Math.Max(0.0, maxDepth - baseHeight) / layerHeight + 1e-6);

        ColorRgb currentColor = sortedPalette[0].Color;
        double currentFilamentExtrudedThickness = 0.0;
        FilamentPaletteItem? previousFilament = null;

        for (int layer = 1; layer <= totalLayers; layer++)
        {
            double z = layer == 1 ? baseHeight : baseHeight + (layer - 1) * layerHeight;
            double currentLayerThickness = layer == 1 ? baseHeight : layerHeight;

            // Find active filament at height z
            var activeFilament = GetActiveFilament(sortedPalette, z);

            if (previousFilament != activeFilament)
            {
                // Swapped filament
                currentFilamentExtrudedThickness = currentLayerThickness;
                previousFilament = activeFilament;
            }
            else
            {
                currentFilamentExtrudedThickness += currentLayerThickness;
            }

            // Apply Beer-Lambert layer blending
            if (layer == 1)
            {
                // Substrate layer starts with base filament's full opaque color
                currentColor = activeFilament.Color;
            }
            else
            {
                currentColor = TransmissionDistanceModel.BlendLayer(
                    currentColor,
                    activeFilament.Color,
                    currentLayerThickness,
                    activeFilament.TransmissionDistanceMm
                );
            }

            var lab = TransmissionDistanceModel.RgbToLab(currentColor);

            steps.Add(new LayerStackStep
            {
                LayerIndex = layer,
                HeightMm = Math.Round(z, 3),
                ActiveFilament = activeFilament,
                ThicknessOfActiveFilamentMm = Math.Round(currentFilamentExtrudedThickness, 3),
                BlendedColor = currentColor,
                BlendedColorLab = lab,
                PerceivedLuminance = currentColor.PerceivedLuminance
            });
        }

        return steps;
    }

    /// <summary>
    /// Generates human- and machine-readable layer swap instructions for the printer operator.
    /// Specifies the exact layer number, Z-height, and filament color required for each manual or AMS swap.
    /// </summary>
    public List<LayerSwapInstruction> GenerateLayerSwapInstructions(LayerStackConfig config)
    {
        var lut = BuildStackLookupTable(config);
        var instructions = new List<LayerSwapInstruction>();

        if (lut.Count == 0) return instructions;

        FilamentPaletteItem? currentFilament = null;
        int swapIndex = 1;

        foreach (var step in lut)
        {
            if (currentFilament == null)
            {
                // First filament (Layer 1)
                currentFilament = step.ActiveFilament;
                instructions.Add(new LayerSwapInstruction
                {
                    SwapNumber = swapIndex++,
                    LayerNumber = step.LayerIndex,
                    HeightMm = 0.00,
                    ColorName = currentFilament.Name,
                    ColorHex = currentFilament.ColorHex,
                    Material = currentFilament.Material,
                    FilamentId = currentFilament.FilamentId,
                    Instruction = $"Start print with {currentFilament.Name} ({currentFilament.ColorHex})"
                });
            }
            else if (currentFilament.FilamentId != step.ActiveFilament.FilamentId)
            {
                // Filament transition
                var newFilament = step.ActiveFilament;
                instructions.Add(new LayerSwapInstruction
                {
                    SwapNumber = swapIndex++,
                    LayerNumber = step.LayerIndex,
                    HeightMm = step.HeightMm,
                    ColorName = newFilament.Name,
                    ColorHex = newFilament.ColorHex,
                    Material = newFilament.Material,
                    FilamentId = newFilament.FilamentId,
                    Instruction = $"At Layer {step.LayerIndex} ({step.HeightMm:F2}mm), swap filament from {currentFilament.Name} to {newFilament.Name} ({newFilament.ColorHex})"
                });
                currentFilament = newFilament;
            }
        }

        return instructions;
    }

    /// <summary>
    /// Finds the discrete layer in the look-up table whose blended color or luminance
    /// best matches the target pixel.
    /// </summary>
    public LayerStackStep FindOptimalLayerForPixel(
        ColorRgb targetPixel,
        IReadOnlyList<LayerStackStep> lut,
        bool matchByLuminanceOnly = false)
    {
        if (lut.Count == 0) throw new InvalidOperationException("LUT is empty.");

        if (matchByLuminanceOnly)
        {
            double targetLum = targetPixel.PerceivedLuminance;
            LayerStackStep bestStep = lut[0];
            double minDiff = double.MaxValue;

            for (int i = 0; i < lut.Count; i++)
            {
                double diff = Math.Abs(lut[i].PerceivedLuminance - targetLum);
                if (diff < minDiff)
                {
                    minDiff = diff;
                    bestStep = lut[i];
                }
            }

            return bestStep;
        }

        // Perceptually uniform color matching in CIE L*a*b* space using Delta-E (CIE76)
        var targetLab = TransmissionDistanceModel.RgbToLab(targetPixel);
        LayerStackStep bestColorStep = lut[0];
        double minDeltaE = double.MaxValue;

        for (int i = 0; i < lut.Count; i++)
        {
            double dE = targetLab.DeltaE76(lut[i].BlendedColorLab);
            if (dE < minDeltaE)
            {
                minDeltaE = dE;
                bestColorStep = lut[i];
            }
        }

        return bestColorStep;
    }

    /// <summary>
    /// Processes a raw 24-bit sRGB image buffer (RGB byte triplets) into a physical 3D topographic heightmap
    /// and a corresponding surface vertex/texture color map based on Transmission Distance layer stacking.
    /// </summary>
    public FilamentPaintingCalculationResult ProcessImageBuffer(
        ReadOnlySpan<byte> rgbBytes,
        int width,
        int height,
        LayerStackConfig config,
        double targetWidthMm = 150.0,
        double targetHeightMm = 150.0)
    {
        if (width <= 0 || height <= 0)
        {
            throw new ArgumentException("Image dimensions must be greater than zero.");
        }

        int expectedLength = width * height * 3;
        if (rgbBytes.Length < expectedLength)
        {
            throw new ArgumentException($"Buffer size {rgbBytes.Length} is smaller than expected {expectedLength}.");
        }

        var lut = BuildStackLookupTable(config);
        var swaps = GenerateLayerSwapInstructions(config);

        int pixelCount = width * height;
        float[] heightMap = new float[pixelCount];
        byte[] blendedRgbMap = new byte[pixelCount * 3];

        float minBase = (float)Math.Max(0.16, config.MinBaseThicknessMm);

        for (int i = 0; i < pixelCount; i++)
        {
            int byteIdx = i * 3;
            var pixelColor = new ColorRgb(rgbBytes[byteIdx], rgbBytes[byteIdx + 1], rgbBytes[byteIdx + 2]);

            var matchedStep = FindOptimalLayerForPixel(pixelColor, lut);

            // Z height: minimum base thickness + layer relief
            heightMap[i] = (float)Math.Max(minBase, matchedStep.HeightMm);

            // Blended composite surface color
            blendedRgbMap[byteIdx] = matchedStep.BlendedColor.R;
            blendedRgbMap[byteIdx + 1] = matchedStep.BlendedColor.G;
            blendedRgbMap[byteIdx + 2] = matchedStep.BlendedColor.B;
        }

        return new FilamentPaintingCalculationResult
        {
            Width = width,
            Height = height,
            WidthMm = targetWidthMm,
            HeightMm = targetHeightMm,
            MaxHeightMm = lut.Count > 0 ? lut[^1].HeightMm : config.MaxDepthMm,
            TotalLayers = lut.Count,
            LayerSwaps = swaps,
            HeightMap = heightMap,
            BlendedRgbMap = blendedRgbMap
        };
    }

    private static List<FilamentPaletteItem> NormalizePaletteRanges(LayerStackConfig config)
    {
        var list = new List<FilamentPaletteItem>(config.Palette);
        int count = list.Count;
        if (count == 0) return list;

        double maxDepth = Math.Max(config.BaseLayerHeightMm, config.MaxDepthMm);
        double minBase = Math.Max(0.0, config.MinBaseThicknessMm);
        double availableRelief = Math.Max(0.1, maxDepth - minBase);

        // If boundaries are not set or default, automatically allocate proportional ranges
        bool needsAutoPartition = list.All(f => Math.Abs(f.StartHeightMm - f.EndHeightMm) < 0.001);

        if (needsAutoPartition)
        {
            double step = availableRelief / count;
            for (int i = 0; i < count; i++)
            {
                list[i].StartHeightMm = Math.Round(i == 0 ? 0.0 : minBase + (i * step), 2);
                list[i].EndHeightMm = Math.Round(i == count - 1 ? maxDepth : minBase + ((i + 1) * step), 2);
            }
        }

        return list;
    }

    private static FilamentPaletteItem GetActiveFilament(IReadOnlyList<FilamentPaletteItem> palette, double z)
    {
        for (int i = 0; i < palette.Count; i++)
        {
            var item = palette[i];
            if (z >= item.StartHeightMm && z <= item.EndHeightMm)
            {
                return item;
            }
        }

        // Boundary clamp
        if (z < palette[0].StartHeightMm) return palette[0];
        return palette[^1];
    }
}

