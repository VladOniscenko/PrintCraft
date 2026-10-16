namespace PrintCraftApi.Models;

public class OrderItemChangeRequestDto
{
    public Guid Id { get; set; }
    public Guid OrderItemId { get; set; }
    public Guid OrderId { get; set; }
    public string Status { get; set; } = string.Empty; // pending_customer, revision_submitted, resolved, superseded
    public string ReasonCategory { get; set; } = string.Empty;
    public string AdminNotes { get; set; } = string.Empty;
    public bool RequiresNewFile { get; set; } = true;
    public string? RequestedBy { get; set; }
    public DateTime RequestedAt { get; set; }
    public string? PreviousFileUrl { get; set; }
    public string? PreviousFileName { get; set; }
    public string? SubmittedFileUrl { get; set; }
    public string? SubmittedFileName { get; set; }
    public string? CustomerNotes { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? ResolvedBy { get; set; }
    public string? ResolutionNotes { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class CreateOrderItemChangeRequestRequest
{
    public string ReasonCategory { get; set; } = "broken_geometry";
    public string AdminNotes { get; set; } = string.Empty;
    public bool RequiresNewFile { get; set; } = true;
}

public class SubmitOrderItemRevisionRequest
{
    public string? CustomerNotes { get; set; }
    public string? NewFileUrl { get; set; }
    public string? NewFileName { get; set; }
}

public class ResolveOrderItemChangeRequestRequest
{
    public string? ResolutionNotes { get; set; }
}
