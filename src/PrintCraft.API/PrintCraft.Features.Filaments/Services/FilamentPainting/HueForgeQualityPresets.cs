namespace PrintCraft.Features.Filaments.Services.FilamentPainting;

/// <summary>
/// Optimal 3D printing parameters for HueForge-style filament painting generation based on standard slicer baselines.
/// </summary>
public sealed record HueForgeQualitySetting(
    string Name,
    double SolidBaseHeightMm,
    double DetailLayerHeightMm,
    double MaxReliefMm,
    string Description,
    int GridResolution = 240
);

public static class HueForgeQualityPresets
{
    public static readonly IReadOnlyDictionary<string, HueForgeQualitySetting> Presets =
        new Dictionary<string, HueForgeQualitySetting>(StringComparer.OrdinalIgnoreCase)
        {
            ["Low"] = new(
                Name: "Low",
                SolidBaseHeightMm: 0.80,
                DetailLayerHeightMm: 0.12,
                MaxReliefMm: 2.20,
                Description: "Draft/Fast preview with 0.80mm solid base, 0.12mm detail layers, ~2.2mm relief. Fastest processing and preview.",
                GridResolution: 240
            ),
            ["Medium"] = new(
                Name: "Medium",
                SolidBaseHeightMm: 0.80,
                DetailLayerHeightMm: 0.08,
                MaxReliefMm: 2.40,
                Description: "Standard baseline with 0.80mm solid base, 0.08mm detail layers, ~2.4mm relief. Excellent balance of speed and fine photographic detail.",
                GridResolution: 360
            ),
            ["Best"] = new(
                Name: "Best",
                SolidBaseHeightMm: 0.80,
                DetailLayerHeightMm: 0.08,
                MaxReliefMm: 2.40,
                Description: "Ultra resolution with 0.80mm solid base, 0.08mm detail layers, ~2.4mm relief. Maximum grid resolution and ultra-crisp contours.",
                GridResolution: 480
            )
        };

    /// <summary>
    /// Resolves the quality preset by name (case-insensitive: "Low", "Medium", "Best").
    /// Defaults to "Medium" if unspecified or unrecognized.
    /// </summary>
    public static HueForgeQualitySetting Resolve(string? qualityName)
    {
        if (!string.IsNullOrWhiteSpace(qualityName) && Presets.TryGetValue(qualityName.Trim(), out var setting))
        {
            return setting;
        }

        return Presets["Medium"];
    }
}

