using System.ComponentModel.DataAnnotations;

namespace PrintCraft.Shared.Models;

public class OrderCommunication
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }

    [Required] public string Channel { get; set; } = "email";
    [Required] public string CommunicationType { get; set; } = string.Empty;
    [Required] public string Subject { get; set; } = string.Empty;
    [Required] public string RecipientEmail { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
