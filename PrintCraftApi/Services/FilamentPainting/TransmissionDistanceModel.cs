namespace PrintCraftApi.Services.FilamentPainting;

/// <summary>
/// Mathematical optical models for filament painting, implementing the Beer-Lambert law
/// for semi-translucent plastic filaments and colorimetry conversion algorithms.
/// </summary>
public static class TransmissionDistanceModel
{
    // HueForge optical standard: at deltaZ == TD, light transmission drops to 1% (99% absorption).
    // ln(100) = 4.605170185988092
    private const double Ln100 = 4.605170185988092;

    // Standard D65 white point reference values for CIE L*a*b* conversion
    private const double Xn = 0.95047;
    private const double Yn = 1.00000;
    private const double Zn = 1.08883;

    /// <summary>
    /// Computes the Beer-Lambert optical attenuation / absorption coefficient (mu)
    /// from a filament's Transmission Distance (TD in mm).
    /// </summary>
    /// <param name="tdMm">Transmission Distance in millimeters.</param>
    /// <returns>Absorption coefficient in mm^-1.</returns>
    public static double GetAbsorptionCoefficient(double tdMm)
    {
        if (tdMm <= 0.001) return 1000.0; // Near zero TD is practically infinite opacity
        return Ln100 / tdMm;
    }

    /// <summary>
    /// Computes optical opacity (alpha in [0.0..1.0]) for an extruded filament layer of thickness deltaZ (mm)
    /// given the filament's Transmission Distance (TD in mm).
    /// Uses the exponential Beer-Lambert transmission decay:
    /// T(deltaZ) = exp(-mu * deltaZ) = 0.01^(deltaZ / TD)
    /// Alpha = 1.0 - T(deltaZ)
    /// </summary>
    public static double CalculateOpacity(double layerThicknessMm, double tdMm)
    {
        if (layerThicknessMm <= 0) return 0.0;
        if (tdMm <= 0.001) return 1.0;

        double mu = GetAbsorptionCoefficient(tdMm);
        double transmission = Math.Exp(-mu * layerThicknessMm);
        return Math.Clamp(1.0 - transmission, 0.0, 1.0);
    }

    /// <summary>
    /// Blends a new filament layer color over an underlying substrate color in linear RGB color space
    /// using Beer-Lambert transmission alpha compositing.
    /// </summary>
    public static ColorRgb BlendLayer(
        ColorRgb underlyingColor,
        ColorRgb layerFilamentColor,
        double layerThicknessMm,
        double tdMm)
    {
        double alpha = CalculateOpacity(layerThicknessMm, tdMm);
        if (alpha <= 0.0) return underlyingColor;
        if (alpha >= 1.0) return layerFilamentColor;

        // Convert both colors to Linear RGB to perform physically accurate radiometric blending
        double rUnderLinear = ColorRgb.ToLinear(underlyingColor.R);
        double gUnderLinear = ColorRgb.ToLinear(underlyingColor.G);
        double bUnderLinear = ColorRgb.ToLinear(underlyingColor.B);

        double rLayerLinear = ColorRgb.ToLinear(layerFilamentColor.R);
        double gLayerLinear = ColorRgb.ToLinear(layerFilamentColor.G);
        double bLayerLinear = ColorRgb.ToLinear(layerFilamentColor.B);

        // Alpha composite: C_out = alpha * C_layer + (1 - alpha) * C_under
        double rBlendedLinear = alpha * rLayerLinear + (1.0 - alpha) * rUnderLinear;
        double gBlendedLinear = alpha * gLayerLinear + (1.0 - alpha) * gUnderLinear;
        double bBlendedLinear = alpha * bLayerLinear + (1.0 - alpha) * bUnderLinear;

        // Convert back to gamma-corrected sRGB
        return new ColorRgb(
            ColorRgb.FromLinear(rBlendedLinear),
            ColorRgb.FromLinear(gBlendedLinear),
            ColorRgb.FromLinear(bBlendedLinear)
        );
    }

    /// <summary>
    /// Converts an sRGB color into CIE L*a*b* coordinates under standard D65 illuminant.
    /// </summary>
    public static ColorLab RgbToLab(ColorRgb rgb)
    {
        // 1. sRGB to linear RGB
        double r = ColorRgb.ToLinear(rgb.R);
        double g = ColorRgb.ToLinear(rgb.G);
        double b = ColorRgb.ToLinear(rgb.B);

        // 2. Linear RGB to CIE XYZ (D65)
        double x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
        double y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
        double z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

        // 3. XYZ to CIE L*a*b*
        double fx = LabPivot(x / Xn);
        double fy = LabPivot(y / Yn);
        double fz = LabPivot(z / Zn);

        double l = Math.Max(0.0, 116.0 * fy - 16.0);
        double a = 500.0 * (fx - fy);
        double bVal = 200.0 * (fy - fz);

        return new ColorLab(l, a, bVal);
    }

    private static double LabPivot(double t)
    {
        const double delta = 6.0 / 29.0;
        const double deltaCube = delta * delta * delta;
        const double factor = 1.0 / (3.0 * delta * delta);

        return t > deltaCube ? Math.Cbrt(t) : factor * t + 4.0 / 29.0;
    }
}

