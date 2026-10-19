using System.ComponentModel.DataAnnotations;

namespace PrintCraft.Shared.Models;

public static class HeroMediaType
{
    public const string Image = "image";
    public const string Model3d = "model3d";

    public static bool IsValid(string? type) =>
        string.Equals(type, Image, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(type, Model3d, StringComparison.OrdinalIgnoreCase);

    public static string Normalize(string? type) =>
        string.Equals(type, Model3d, StringComparison.OrdinalIgnoreCase) ? Model3d : Image;
}

public class HeroSlide
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string Title { get; set; } = string.Empty;

    public string Subtext { get; set; } = string.Empty;

    public string PriceText { get; set; } = string.Empty;

    [Required]
    public string MediaUrl { get; set; } = string.Empty;

    [Required]
    public string MediaType { get; set; } = HeroMediaType.Image; // "image" or "model3d"

    public string? InstructionTooltip { get; set; }

    // Multilingual support (Dutch / legacy columns preserved for 100% backward compatibility)
    public string? TitleNl { get; set; }
    public string? SubtextNl { get; set; }
    public string? PriceTextNl { get; set; }
    public string? InstructionTooltipNl { get; set; }

    // Modern JSON-based multilingual dictionaries for all supported and future languages
    public Dictionary<string, string> Titles { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, string> Subtexts { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, string> PriceTexts { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, string> InstructionTooltips { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string GetLocalizedTitle(string? language)
    {
        var lang = string.IsNullOrWhiteSpace(language) ? "en" : language.Trim().ToLowerInvariant();
        if (Titles.TryGetValue(lang, out var val) && !string.IsNullOrWhiteSpace(val)) return val;
        if (lang == "nl" && !string.IsNullOrWhiteSpace(TitleNl)) return TitleNl;
        if (Titles.TryGetValue("en", out var enVal) && !string.IsNullOrWhiteSpace(enVal)) return enVal;
        return Title;
    }

    public string GetLocalizedSubtext(string? language)
    {
        var lang = string.IsNullOrWhiteSpace(language) ? "en" : language.Trim().ToLowerInvariant();
        if (Subtexts.TryGetValue(lang, out var val) && !string.IsNullOrWhiteSpace(val)) return val;
        if (lang == "nl" && !string.IsNullOrWhiteSpace(SubtextNl)) return SubtextNl;
        if (Subtexts.TryGetValue("en", out var enVal) && !string.IsNullOrWhiteSpace(enVal)) return enVal;
        return Subtext;
    }

    public string GetLocalizedPriceText(string? language)
    {
        var lang = string.IsNullOrWhiteSpace(language) ? "en" : language.Trim().ToLowerInvariant();
        if (PriceTexts.TryGetValue(lang, out var val) && !string.IsNullOrWhiteSpace(val)) return val;
        if (lang == "nl" && !string.IsNullOrWhiteSpace(PriceTextNl)) return PriceTextNl;
        if (PriceTexts.TryGetValue("en", out var enVal) && !string.IsNullOrWhiteSpace(enVal)) return enVal;
        return PriceText;
    }

    public string? GetLocalizedTooltip(string? language)
    {
        var lang = string.IsNullOrWhiteSpace(language) ? "en" : language.Trim().ToLowerInvariant();
        if (InstructionTooltips.TryGetValue(lang, out var val) && !string.IsNullOrWhiteSpace(val)) return val;
        if (lang == "nl" && !string.IsNullOrWhiteSpace(InstructionTooltipNl)) return InstructionTooltipNl;
        if (InstructionTooltips.TryGetValue("en", out var enVal) && !string.IsNullOrWhiteSpace(enVal)) return enVal;
        return InstructionTooltip;
    }
}
