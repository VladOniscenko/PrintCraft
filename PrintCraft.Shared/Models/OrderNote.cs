using System.ComponentModel.DataAnnotations;

namespace PrintCraft.Shared.Models;

public class OrderNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }

    [Required]
    public string Content { get; set; } = string.Empty;

    [Required]
    public string Visibility { get; set; } = "internal"; // internal | customer

    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Order? Order { get; set; }
}