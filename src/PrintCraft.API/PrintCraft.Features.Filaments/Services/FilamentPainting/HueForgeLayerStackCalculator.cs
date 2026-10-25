namespace PrintCraft.Features.Filaments.Services.FilamentPainting;

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
        ColorRgb substrateColor = sortedPalette[0].Color;
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
                substrateColor = currentColor;
                currentFilamentExtrudedThickness = currentLayerThickness;
                previousFilament = activeFilament;
            }
            else
            {
                currentFilamentExtrudedThickness += currentLayerThickness;
            }

            // Apply Beer-Lambert layer blending based on cumulative active filament thickness
            if (layer == 1)
            {
                // Substrate layer starts with base filament's full opaque color
                currentColor = activeFilament.Color;
                substrateColor = activeFilament.Color;
            }
            else
            {
                double bandThickness = Math.Max(0.12, activeFilament.EndHeightMm - activeFilament.StartHeightMm);
                double maxEffectiveTd = bandThickness * 1.8;
                double effectiveTd = Math.Max(0.4, Math.Min(activeFilament.TransmissionDistanceMm, maxEffectiveTd));
                currentColor = TransmissionDistanceModel.BlendLayer(
                    substrateColor,
                    activeFilament.Color,
                    currentFilamentExtrudedThickness,
                    effectiveTd
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
    /// Uses dynamic-range-normalized perceptual luminance to map image tonal values to the discrete layer stack,
    /// ensuring all configured filament colors (shadows, midtones, highlights) are rendered vibrantly.
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
        float maxRelief = (float)Math.Max(minBase + 0.1, config.MaxDepthMm);
        float availableRelief = maxRelief - minBase;

        // 1. Pass 1: Compute perceptual luma for each pixel and evaluate dynamic range
        float minLuma = 1.0f;
        float maxLuma = 0.0f;
        float[] lumaBuffer = new float[pixelCount];

        for (int i = 0; i < pixelCount; i++)
        {
            int byteIdx = i * 3;
            byte r = rgbBytes[byteIdx];
            byte g = rgbBytes[byteIdx + 1];
            byte b = rgbBytes[byteIdx + 2];

            // Standard Rec. 601 perceptual luma in [0.0..1.0]
            float luma = ((0.299f * r) + (0.587f * g) + (0.114f * b)) / 255.0f;
            lumaBuffer[i] = luma;

            if (luma < minLuma) minLuma = luma;
            if (luma > maxLuma) maxLuma = luma;
        }

        // Robust percentile-based histogram normalization (auto-levels) to stretch dynamic range
        float pLow = minLuma;
        float pHigh = maxLuma;

        if (pixelCount >= 64)
        {
            int[] hist = new int[256];
            for (int i = 0; i < pixelCount; i++)
            {
                int bin = Math.Clamp((int)(lumaBuffer[i] * 255f), 0, 255);
                hist[bin]++;
            }

            int lowCutoff = (int)(pixelCount * 0.015f); // 1.5% shadow clip
            int highCutoff = (int)(pixelCount * 0.985f); // 1.5% highlight clip

            int cum = 0;
            bool lowFound = false;
            for (int b = 0; b < 256; b++)
            {
                cum += hist[b];
                if (!lowFound && cum >= lowCutoff)
                {
                    pLow = b / 255.0f;
                    lowFound = true;
                }
                if (cum >= highCutoff)
                {
                    pHigh = b / 255.0f;
                    break;
                }
            }
        }

        float lumaRange = pHigh - pLow;
        float[] normalizedLuma = new float[pixelCount];
        for (int i = 0; i < pixelCount; i++)
        {
            float stretched = lumaRange > 0.005f
                ? Math.Clamp((lumaBuffer[i] - pLow) / lumaRange, 0.0f, 1.0f)
                : (maxLuma - minLuma > 0.001f ? Math.Clamp((lumaBuffer[i] - minLuma) / (maxLuma - minLuma), 0.0f, 1.0f) : lumaBuffer[i]);

            // Direct linear photographic mapping: preserves continuous gradient transitions
            // without crushing shadow details or posterizing highlights
            normalizedLuma[i] = stretched;
        }

        // 3x3 Edge-Preserving Bilateral Smoothing pass:
        // Removes single-pixel noise and unprintable micro-spikes while preserving crisp edges,
        // facial features, eyes, and high-frequency photographic textures.
        // Precomputed Gaussian exp table for photometric differences makes this execute in < 2ms.
        float[] smoothedLuma = new float[pixelCount];
        if (width >= 3 && height >= 3)
        {
            const float invSigmaSquare = 1.0f / (2.0f * 0.14f * 0.14f); // photometric edge tolerance
            float[] expLut = new float[256];
            for (int b = 0; b < 256; b++)
            {
                float diff = b / 255.0f;
                expLut[b] = MathF.Exp(-diff * diff * invSigmaSquare);
            }

            for (int y = 0; y < height; y++)
            {
                int y0 = Math.Max(0, y - 1);
                int y1 = y;
                int y2 = Math.Min(height - 1, y + 1);

                int row0 = y0 * width;
                int row1 = y1 * width;
                int row2 = y2 * width;

                for (int x = 0; x < width; x++)
                {
                    int x0 = Math.Max(0, x - 1);
                    int x1 = x;
                    int x2 = Math.Min(width - 1, x + 1);

                    float centerVal = normalizedLuma[row1 + x1];

                    // Bilateral weights using precomputed lookup table
                    int d00 = Math.Clamp((int)(MathF.Abs(normalizedLuma[row0 + x0] - centerVal) * 255f), 0, 255);
                    int d01 = Math.Clamp((int)(MathF.Abs(normalizedLuma[row0 + x1] - centerVal) * 255f), 0, 255);
                    int d02 = Math.Clamp((int)(MathF.Abs(normalizedLuma[row0 + x2] - centerVal) * 255f), 0, 255);

                    int d10 = Math.Clamp((int)(MathF.Abs(normalizedLuma[row1 + x0] - centerVal) * 255f), 0, 255);
                    int d12 = Math.Clamp((int)(MathF.Abs(normalizedLuma[row1 + x2] - centerVal) * 255f), 0, 255);

                    int d20 = Math.Clamp((int)(MathF.Abs(normalizedLuma[row2 + x0] - centerVal) * 255f), 0, 255);
                    int d21 = Math.Clamp((int)(MathF.Abs(normalizedLuma[row2 + x1] - centerVal) * 255f), 0, 255);
                    int d22 = Math.Clamp((int)(MathF.Abs(normalizedLuma[row2 + x2] - centerVal) * 255f), 0, 255);

                    float w00 = 1f * expLut[d00];
                    float w01 = 2f * expLut[d01];
                    float w02 = 1f * expLut[d02];

                    float w10 = 2f * expLut[d10];
                    float w11 = 4f; // center pixel
                    float w12 = 2f * expLut[d12];

                    float w20 = 1f * expLut[d20];
                    float w21 = 2f * expLut[d21];
                    float w22 = 1f * expLut[d22];

                    float sumWeights = w00 + w01 + w02 + w10 + w11 + w12 + w20 + w21 + w22;
                    float sumValues =
                        w00 * normalizedLuma[row0 + x0] + w01 * normalizedLuma[row0 + x1] + w02 * normalizedLuma[row0 + x2] +
                        w10 * normalizedLuma[row1 + x0] + w11 * centerVal                 + w12 * normalizedLuma[row1 + x2] +
                        w20 * normalizedLuma[row2 + x0] + w21 * normalizedLuma[row2 + x1] + w22 * normalizedLuma[row2 + x2];

                    smoothedLuma[row1 + x1] = sumValues / sumWeights;
                }
            }
        }
        else
        {
            Array.Copy(normalizedLuma, smoothedLuma, pixelCount);
        }

        // 2. Pass 2: Map smoothed tones to physical Z relief height and lookup discrete LUT layer
        for (int i = 0; i < pixelCount; i++)
        {
            int byteIdx = i * 3;
            float tone = smoothedLuma[i];

            // Target continuous Z height: solid base thickness + tone * relief height
            double targetZ = minBase + (tone * availableRelief);

            // Continuous surface relief for smooth watertight STL mesh
            heightMap[i] = (float)targetZ;

            // Smoothly interpolate blended color between adjacent LUT steps for photographic quality
            int stepIdx = 0;
            for (int s = 0; s < lut.Count; s++)
            {
                if (lut[s].HeightMm >= targetZ)
                {
                    stepIdx = s;
                    break;
                }
                stepIdx = s;
            }

            ColorRgb color;
            if (stepIdx > 0 && stepIdx < lut.Count)
            {
                var s0 = lut[stepIdx - 1];
                var s1 = lut[stepIdx];
                double span = Math.Max(0.0001, s1.HeightMm - s0.HeightMm);
                double frac = Math.Clamp((targetZ - s0.HeightMm) / span, 0.0, 1.0);
                color = new ColorRgb(
                    (byte)Math.Clamp(Math.Round(s0.BlendedColor.R * (1.0 - frac) + s1.BlendedColor.R * frac), 0, 255),
                    (byte)Math.Clamp(Math.Round(s0.BlendedColor.G * (1.0 - frac) + s1.BlendedColor.G * frac), 0, 255),
                    (byte)Math.Clamp(Math.Round(s0.BlendedColor.B * (1.0 - frac) + s1.BlendedColor.B * frac), 0, 255)
                );
            }
            else
            {
                color = lut[stepIdx].BlendedColor;
            }

            blendedRgbMap[byteIdx] = color.R;
            blendedRgbMap[byteIdx + 1] = color.G;
            blendedRgbMap[byteIdx + 2] = color.B;
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

    /// <summary>
    /// Finds the discrete layer in the look-up table whose Z height best matches the target height.
    /// </summary>
    public static LayerStackStep GetStepForHeight(double targetZ, IReadOnlyList<LayerStackStep> lut)
    {
        if (lut.Count == 0) throw new InvalidOperationException("LUT is empty.");

        LayerStackStep bestStep = lut[0];
        double minDiff = Math.Abs(bestStep.HeightMm - targetZ);

        for (int i = 1; i < lut.Count; i++)
        {
            double diff = Math.Abs(lut[i].HeightMm - targetZ);
            if (diff < minDiff)
            {
                minDiff = diff;
                bestStep = lut[i];
            }
        }

        return bestStep;
    }

    private static List<FilamentPaletteItem> NormalizePaletteRanges(LayerStackConfig config)
    {
        var list = new List<FilamentPaletteItem>(config.Palette);
        int count = list.Count;
        if (count == 0) return list;

        // Automatically sort filaments by luminance from darkest (bottom base layer) to lightest (top highlight layer)
        list.Sort((a, b) => a.Color.PerceivedLuminance.CompareTo(b.Color.PerceivedLuminance));

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

