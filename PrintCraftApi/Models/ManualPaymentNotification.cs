using System.ComponentModel.DataAnnotations;

namespace PrintCraftApi.Models;

public class ManualPaymentNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }

    [MaxLength(500)]
    public string? Message { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}