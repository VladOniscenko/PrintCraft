using System.ComponentModel.DataAnnotations;

namespace PrintCraft.Shared.Models;

public class OrderStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public string? PreviousStatus { get; set; }

    [Required] public string NewStatus { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string? ChangedBy { get; set; }
    public string? Note { get; set; }
}
