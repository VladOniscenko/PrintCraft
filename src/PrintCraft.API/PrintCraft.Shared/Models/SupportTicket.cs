using System.ComponentModel.DataAnnotations;

namespace PrintCraft.Shared.Models;

public enum SupportTicketCategory
{
    OrderIssue,
    Bug,
    Payment,
    General
}

public enum SupportTicketStatus
{
    Open,
    InProgress,
    Resolved
}

public class SupportTicket
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? UserId { get; set; }

    [Required]
    [MaxLength(256)]
    public string UserEmail { get; set; } = string.Empty;

    public Guid? OrderId { get; set; }

    public SupportTicketCategory Category { get; set; } = SupportTicketCategory.General;

    [Required]
    [MaxLength(256)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;

    public List<string> AttachmentUrls { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
    public Order? Order { get; set; }
}

