namespace PrintCraftApi.Models;

/// <summary>
/// Comprehensive Data Transfer Object for Admin Order Details dashboard (Epic 10).
/// Single payload containing state machine status, customer details, file list,
/// line items, combined timeline history, payments, and manufacturing metadata.
/// </summary>
public class OrderDetailsDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string NormalizedStatus { get; set; } = string.Empty;
    public bool IsPaid { get; set; }
    public string? HoldReason { get; set; }
    public bool FlaggedForRefundReview { get; set; }
    public string? AssignedPrinter { get; set; }
    public string? AssignedMaterial { get; set; }
    public bool GCodeFinalized { get; set; }
    public List<string> AllowedTransitions { get; set; } = new();

    // Customer & Shipping Context
    public OrderCustomerDetailsDto Customer { get; set; } = new();

    // Top-level mirrors for backward compatibility
    public string FullName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;

    // Line items
    public List<AdminOrderItemDto> Items { get; set; } = new();

    // Aggregated list of all uploaded .stl / .step / image assets
    public List<OrderFileAssetDto> Files { get; set; } = new();

    // Financial & Pricing Engine fields
    public string OrderType { get; set; } = "quote";
    public string PaymentFlow { get; set; } = "bank_transfer";
    public decimal DeliveryPrice { get; set; }
    public decimal ServiceFeePrice { get; set; }
    public decimal OrderDiscountAmount { get; set; }
    public decimal? QuotedPrice { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalTotalAmount { get; set; }
    public string? QuoteMessage { get; set; }
    public DateTime? QuoteConfirmedAt { get; set; }
    public DateTime? QuoteExpiresAt { get; set; }
    public string? InternalNotes { get; set; }
    public string? CustomerNotes { get; set; }

    // Shipping & Tracking
    public string? TrackingCode { get; set; }
    public string? TrackingUrl { get; set; }

    // Unified Chronological Timeline (Status history + automated emails + notes)
    public List<OrderTimelineEventDto> Timeline { get; set; } = new();

    // Raw collections
    public List<OrderPaymentDetailsDto> Payments { get; set; } = new();
    public List<AdminOrderNoteDto> Notes { get; set; } = new();
    public List<AdminOrderStatusHistoryDto> StatusHistory { get; set; } = new();
    public List<AdminOrderCommunicationDto> Communications { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class OrderCustomerDetailsDto
{
    public Guid? UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
}

public class AdminOrderItemDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string? FileUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string? FileName { get; set; }
    public string? Notes { get; set; }
    public string? Size { get; set; }
    public string Material { get; set; } = "PLA";
    public string Color { get; set; } = "Black";
    public int Count { get; set; }
    public double Price { get; set; }
    public double UnitPrice { get; set; }
    public double PlateCost { get; set; }

    // 3D Slicing & Manufacturing metrics
    public string? EstimatedPrintTime { get; set; }
    public double? FilamentUsedGrams { get; set; }
    public double ScaleFactor { get; set; } = 1.0;
    public int InfillPercent { get; set; } = 20;
    public string PrintQuality { get; set; } = "Standard (0.20mm)";
    public bool SupportsNeeded { get; set; }

    public List<OrderItemAttachmentDto> Attachments { get; set; } = new();
    public List<OrderFileAssetDto> Files { get; set; } = new();
}

public class OrderItemAttachmentDto
{
    public Guid Id { get; set; }
    public Guid OrderItemId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string Kind { get; set; } = "other";
}

public class OrderFileAssetDto
{
    public string Id { get; set; } = string.Empty;
    public Guid? ItemId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string DownloadUrl { get; set; } = string.Empty;
    public string Kind { get; set; } = "model"; // model | image | other
    public string? Role { get; set; } // source | preview | production
    public string? Label { get; set; } // Source File | Web Preview | Production File
    public string Extension { get; set; } = string.Empty;
    public bool Is3DModel { get; set; }
    public string? Size { get; set; }
    public string? Material { get; set; }
    public string? Color { get; set; }
}

public class OrderTimelineEventDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // status_change | email | note
    public DateTime Timestamp { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? Author { get; set; }
    public string Visibility { get; set; } = "system"; // system | customer | internal
    public Dictionary<string, string?> Metadata { get; set; } = new();
}

public class OrderPaymentDetailsDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Method { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminOrderNoteDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Visibility { get; set; } = "internal";
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminOrderStatusHistoryDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string? PreviousStatus { get; set; }
    public string NewStatus { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? ChangedBy { get; set; }
    public string? Note { get; set; }
}

public class AdminOrderCommunicationDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string Channel { get; set; } = "email";
    public string CommunicationType { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
}

