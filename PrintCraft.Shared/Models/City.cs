using System.ComponentModel.DataAnnotations;

namespace PrintCraft.Shared.Models;

public class City
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Unique URL slug (e.g., "amsterdam", "den-haag"). Accessible at /3d-print-service/{slug}.
    /// </summary>
    [Required]
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Multilingual city names keyed by language code (e.g. {"nl": "Den Haag", "en": "The Hague"}).
    /// </summary>
    public Dictionary<string, string> Names { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public string Province { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
