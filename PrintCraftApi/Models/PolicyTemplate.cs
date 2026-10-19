using System.ComponentModel.DataAnnotations;

namespace PrintCraftApi.Models;

public class PolicyTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Unique policy URL slug (e.g., "privacy", "terms", "refunds", "shipping").
    /// </summary>
    [Required]
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// Multilingual title keyed by language code (e.g. {"nl": "Privacybeleid", "en": "Privacy Policy"}).
    /// </summary>
    public Dictionary<string, string> Title { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Multilingual last updated label or date string (e.g. {"nl": "Laatst bijgewerkt: 27 maart 2026", "en": "Last updated: 27 March 2026"}).
    /// </summary>
    public Dictionary<string, string> LastUpdated { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Ordered list of content sections.
    /// </summary>
    public List<PolicySection> Sections { get; set; } = new();

    /// <summary>
    /// Optional multilingual title for the contact callout box at the bottom.
    /// </summary>
    public Dictionary<string, string> ContactTitle { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Optional multilingual body for the contact callout box at the bottom.
    /// </summary>
    public Dictionary<string, string> ContactBody { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Whether this policy page is currently active.
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class PolicySection
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>
    /// Multilingual section heading.
    /// </summary>
    public Dictionary<string, string> Title { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Multilingual section body (supports multiline paragraphs and formatting).
    /// </summary>
    public Dictionary<string, string> Body { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public int SortOrder { get; set; } = 0;
}

