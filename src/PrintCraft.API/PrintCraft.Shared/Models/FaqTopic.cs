using System.ComponentModel.DataAnnotations;

namespace PrintCraft.Shared.Models;

public class FaqQuestionAnswerDto
{
    public string Q { get; set; } = string.Empty;
    public string A { get; set; } = string.Empty;
}

public class FaqTopic
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// URL alias for the topic (e.g., "vervangende-onderdelen-printen"). Accessible at /faq/{slug}.
    /// </summary>
    [Required]
    public string Slug { get; set; } = string.Empty;

    public string? Key { get; set; }

    /// <summary>
    /// Multilingual topic/service name (e.g. "Vervangende Onderdelen Printen").
    /// </summary>
    public Dictionary<string, string> Names { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Tagline { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Badge { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> HeroTitle { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> HeroSubtitle { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Description { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Multilingual list of bullet benefits.
    /// </summary>
    public Dictionary<string, List<string>> Benefits { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public List<string> RecommendedMaterials { get; set; } = new();

    public string LeadTime { get; set; } = string.Empty;

    public string Precision { get; set; } = string.Empty;

    public Dictionary<string, string> MetaTitle { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> MetaDescription { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> MetaKeywords { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Dedicated topic FAQs keyed by language code.
    /// </summary>
    public Dictionary<string, List<FaqQuestionAnswerDto>> Faqs { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
