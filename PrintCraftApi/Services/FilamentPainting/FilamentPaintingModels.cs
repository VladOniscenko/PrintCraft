namespace PrintCraftApi.Services.FilamentPainting;

/// <summary>
/// Represents an sRGB color with utility methods for linear conversion, hex parsing, and luminance.
/// </summary>
public readonly record struct ColorRgb(byte R, byte G, byte B)
{
    public static readonly ColorRgb Black = new(0, 0, 0);
    public static readonly ColorRgb White = new(255, 255, 255);

    public string ToHex() => $"#{R:X2}{G:X2}{B:X2}";

    public static ColorRgb FromHex(string hex)
    {
        if (string.IsNullOrWhiteSpace(hex)) return Black;
        var clean = hex.Trim().TrimStart('#');
        if (clean.Length == 3)
        {
            clean = string.Concat(clean[0], clean[0], clean[1], clean[1], clean[2], clean[2]);
        }
        if (clean.Length != 6) return Black;

        if (byte.TryParse(clean.AsSpan(0, 2), System.Globalization.NumberStyles.HexNumber, null, out var r) &&
            byte.TryParse(clean.AsSpan(2, 2), System.Globalization.NumberStyles.HexNumber, null, out var g) &&
            byte.TryParse(clean.AsSpan(4, 2), System.Globalization.NumberStyles.HexNumber, null, out var b))
        {
            return new ColorRgb(r, g, b);
        }
        return Black;
    }

    /// <summary>
    /// Converts gamma-encoded sRGB component [0..255] to linear RGB [0.0..1.0].
    /// Standard IEC 61966-2-1 piecewise transfer function.
    /// </summary>
    public static double ToLinear(byte channel)
    {
        double c = channel / 255.0;
        return c <= 0.04045 ? c / 12.92 : Math.Pow((c + 0.055) / 1.055, 2.4);
    }

    /// <summary>
    /// Converts linear RGB component [0.0..1.0] to gamma-encoded sRGB [0..255].
    /// </summary>
    public static byte FromLinear(double linear)
    {
        linear = Math.Clamp(linear, 0.0, 1.0);
        double c = linear <= 0.0031308 ? linear * 12.92 : 1.055 * Math.Pow(linear, 1.0 / 2.4) - 0.055;
        return (byte)Math.Clamp((int)Math.Round(c * 255.0), 0, 255);
    }

    /// <summary>
    /// Perceived photometric luminance in linear space (CIE 1931 Rec. 709 / sRGB).
    /// </summary>
    public double PerceivedLuminance =>
        0.2126 * ToLinear(R) + 0.7152 * ToLinear(G) + 0.0722 * ToLinear(B);
}

/// <summary>
/// Represents a color in CIE L*a*b* color space for perceptually uniform color distance calculations.
/// </summary>
public readonly record struct ColorLab(double L, double A, double B)
{
    /// <summary>
    /// Computes the CIE76 color difference (Euclidean distance in Lab space).
    /// </summary>
    public double DeltaE76(ColorLab other)
    {
        double dL = L - other.L;
        double da = A - other.A;
        double db = B - other.B;
        return Math.Sqrt(dL * dL + da * da + db * db);
    }
}

/// <summary>
/// Definition of a single filament in a HueForge painting palette with its Transmission Distance (TD).
/// </summary>
public class FilamentPaletteItem
{
    public Guid FilamentId { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Material { get; set; } = "PLA";
    public string ColorHex { get; set; } = "#000000";

    /// <summary>
    /// Transmission Distance (TD) in millimeters.
    /// This is the physical thickness of filament required for light transmission to drop to ~1% (opacity ~99%).
    /// Lower TD = more opaque (e.g. Black ~0.6mm). Higher TD = more translucent (e.g. White ~5.0mm, Yellow ~3.5mm).
    /// </summary>
    public double TransmissionDistanceMm { get; set; } = 1.0;

    /// <summary>
    /// Starting height in millimeters where this filament begins printing.
    /// </summary>
    public double StartHeightMm { get; set; }

    /// <summary>
    /// Ending height in millimeters where this filament stops printing.
    /// </summary>
    public double EndHeightMm { get; set; }

    public ColorRgb Color => ColorRgb.FromHex(ColorHex);
}

/// <summary>
/// Configuration for slicing and stacking physical filament layers.
/// </summary>
public class LayerStackConfig
{
    /// <summary>
    /// Height of the first printed layer (typically 0.16mm or 0.20mm for strong bed adhesion).
    /// </summary>
    public double BaseLayerHeightMm { get; set; } = 0.16;

    /// <summary>
    /// Height of each subsequent fine detail layer (standard 0.08mm for HueForge blending).
    /// </summary>
    public double LayerHeightMm { get; set; } = 0.08;

    /// <summary>
    /// Total maximum relief depth of the painting in millimeters (typically 2.0mm to 3.2mm).
    /// </summary>
    public double MaxDepthMm { get; set; } = 2.40;

    /// <summary>
    /// Minimum backing/substrate thickness in millimeters (solid base plate).
    /// </summary>
    public double MinBaseThicknessMm { get; set; } = 0.48;

    /// <summary>
    /// Ordered list of filaments from bottom layer (substrate/darkest) to top layer (highlight/brightest).
    /// </summary>
    public List<FilamentPaletteItem> Palette { get; set; } = new();
}

/// <summary>
/// Represents a single discrete layer in the precalculated stacking look-up table (LUT).
/// </summary>
public class LayerStackStep
{
    public int LayerIndex { get; set; } // 1-based layer number
    public double HeightMm { get; set; }
    public FilamentPaletteItem ActiveFilament { get; set; } = null!;
    public double ThicknessOfActiveFilamentMm { get; set; }
    public ColorRgb BlendedColor { get; set; }
    public ColorLab BlendedColorLab { get; set; }
    public double PerceivedLuminance { get; set; }
}

/// <summary>
/// Hardware printing instructions for manual or AMS filament swaps at specific layer heights.
/// </summary>
public class LayerSwapInstruction
{
    public int SwapNumber { get; set; }
    public int LayerNumber { get; set; }
    public double HeightMm { get; set; }
    public string ColorName { get; set; } = string.Empty;
    public string ColorHex { get; set; } = string.Empty;
    public string Material { get; set; } = "PLA";
    public Guid FilamentId { get; set; }
    public string Instruction { get; set; } = string.Empty;
}

/// <summary>
/// Result of the HueForge layer calculation for an image or pixel grid.
/// </summary>
public class FilamentPaintingCalculationResult
{
    public int Width { get; set; }
    public int Height { get; set; }
    public double WidthMm { get; set; }
    public double HeightMm { get; set; }
    public double MaxHeightMm { get; set; }
    public int TotalLayers { get; set; }
    public List<LayerSwapInstruction> LayerSwaps { get; set; } = new();
    public float[] HeightMap { get; set; } = Array.Empty<float>();
    public byte[] BlendedRgbMap { get; set; } = Array.Empty<byte>(); // 3 bytes per pixel (R, G, B)
}

