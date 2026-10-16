using System.ComponentModel.DataAnnotations;

namespace PrintCraftApi.Models;

public class OrderItemChangeRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderItemId { get; set; }
    public Guid OrderId { get; set; }

    /// <summary>
    /// Lifecycle state: "pending_customer", "revision_submitted", "resolved", "superseded"
    /// </summary>
    [Required]
    public string Status { get; set; } = "pending_customer";

    /// <summary>
    /// Reason category: "broken_geometry", "wall_thickness", "scale_or_size", "unsupported_format", "orientation", "other"
    /// </summary>
    [Required]
    public string ReasonCategory { get; set; } = "broken_geometry";

    /// <summary>
    /// Detailed guidance and instructions from admin to customer explaining what needs to be changed.
    /// </summary>
    [Required]
    public string AdminNotes { get; set; } = string.Empty;

    /// <summary>
    /// True if customer is required to upload a replacement 3D model/file.
    /// </summary>
    public bool RequiresNewFile { get; set; } = true;

    public string? RequestedBy { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    // Snapshot of the model file at the moment change was requested
    public string? PreviousFileUrl { get; set; }
    public string? PreviousFileName { get; set; }

    // Customer submission details
    public string? SubmittedFileUrl { get; set; }
    public string? SubmittedFileName { get; set; }
    public string? CustomerNotes { get; set; }
    public DateTime? SubmittedAt { get; set; }

    // Admin resolution details
    public string? ResolvedBy { get; set; }
    public string? ResolutionNotes { get; set; }
    public DateTime? ResolvedAt { get; set; }

    // Navigation properties
    public OrderItem? OrderItem { get; set; }
    public Order? Order { get; set; }
}
