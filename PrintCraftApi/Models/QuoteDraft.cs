using System.ComponentModel.DataAnnotations;

namespace PrintCraftApi.Models;

public class QuoteDraft
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(128)]
    public string TokenHash { get; set; } = string.Empty;

    [MaxLength(1024)]
    public string FileUrl { get; set; } = string.Empty;

    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(32)]
    public string Material { get; set; } = "PLA";

    [MaxLength(128)]
    public string? VisitorKey { get; set; }

    public Guid? UserId { get; set; }
    public decimal Estimate { get; set; }
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(2);
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RedeemedAt { get; set; }
}
