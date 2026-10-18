using System.ComponentModel.DataAnnotations;

namespace PrintCraftApi.Models;

public class FaqItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Multilingual question text keyed by language code (e.g., "nl", "en", "de").
    /// </summary>
    [Required]
    public Dictionary<string, string> Question { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Multilingual answer text keyed by language code.
    /// </summary>
    [Required]
    public Dictionary<string, string> Answer { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public string Category { get; set; } = "general";

    public int SortOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
