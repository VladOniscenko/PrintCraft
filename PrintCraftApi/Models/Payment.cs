using System.ComponentModel.DataAnnotations;

namespace PrintCraftApi.Models;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid OrderId { get; set; }

    [Required]
    [MaxLength(32)]
    public string Provider { get; set; } = "bank_transfer";

    // Internal payment reference for correlation across logs and webhooks.
    [Required]
    [MaxLength(64)]
    public string Reference { get; set; } = string.Empty;

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "EUR";

    [Required]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(48)]
    public string Status { get; set; } = "created";

    [MaxLength(64)]
    public string? Method { get; set; }

    [MaxLength(256)]
    public string? FailureReason { get; set; }

    public DateTime? PaidAt { get; set; }
    public DateTime? CanceledAt { get; set; }
    public DateTime? ExpiredAt { get; set; }
    public DateTime? FailedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Order? Order { get; set; }
}
