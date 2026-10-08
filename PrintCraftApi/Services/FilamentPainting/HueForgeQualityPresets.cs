namespace PrintCraftApi.Services.FilamentPainting;

/// <summary>
/// Optimal 3D printing parameters for HueForge-style filament painting generation based on standard slicer baselines.
/// </summary>
public sealed record HueForgeQualitySetting(
    string Name,
    double SolidBaseHeightMm,
    double DetailLayerHeightMm,
    double MaxReliefMm,
    string Description
);

public static class HueForgeQualityPresets
{
    public static readonly IReadOnlyDictionary<string, HueForgeQualitySetting> Presets =
        new Dictionary<string, HueForgeQualitySetting>(StringComparer.OrdinalIgnoreCase)
        {
            ["Low"] = new(
                Name: "Low",
                SolidBaseHeightMm: 0.16,
                DetailLayerHeightMm: 0.12,
                MaxReliefMm: 1.50,
                Description: "Draft/Fast print with 0.16mm base, 0.12mm detail layers, ~1.5mm relief. Fastest print, acceptable color blending."
            ),
            ["Medium"] = new(
                Name: "Medium",
                SolidBaseHeightMm: 0.16,
                DetailLayerHeightMm: 0.08,
                MaxReliefMm: 2.00,
                Description: "Standard HueForge baseline with 0.16mm base, 0.08mm detail layers, ~2.0mm relief. Excellent balance of print time and color accuracy."
            ),
            ["Best"] = new(
                Name: "Best",
                SolidBaseHeightMm: 0.16,
                DetailLayerHeightMm: 0.04,
                MaxReliefMm: 2.50,
                Description: "Ultra resolution with 0.16mm base, 0.04mm detail layers, ~2.5mm relief. Maximum resolution and smoothest color gradients, longest print time."
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

