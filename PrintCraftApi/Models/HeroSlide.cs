using System.ComponentModel.DataAnnotations;

namespace PrintCraftApi.Models;

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

    // Multilingual support (Dutch / second language)
    public string? TitleNl { get; set; }
    public string? SubtextNl { get; set; }
    public string? PriceTextNl { get; set; }
    public string? InstructionTooltipNl { get; set; }

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

