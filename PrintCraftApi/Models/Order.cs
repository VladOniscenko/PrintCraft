using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PrintCraftApi.Models;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }

    // Shipping Address
    [Required] public string FullName { get; set; } = string.Empty;
    [Required] public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    [Required] public string City { get; set; } = string.Empty;
    [Required] public string PostalCode { get; set; } = string.Empty;
    [Required] public string PhoneNumber { get; set; } = string.Empty;

    public string Status { get; set; } = "quote_requested";
    public string OrderType { get; set; } = "quote"; // "quote" or "online"
    public string PaymentFlow { get; set; } = "bank_transfer";
    public decimal DeliveryPrice { get; set; } = 4.95m;
    public decimal ServiceFeePrice { get; set; } = 5.00m;
    public decimal OrderDiscountAmount { get; set; } = 0m;
    public decimal? QuotedPrice { get; set; }
    public string? QuoteMessage { get; set; }
    public DateTime? QuoteConfirmedAt { get; set; }
    public DateTime? QuoteExpiresAt { get; set; }
    public string? TrackingCode { get; set; }
    public string? TrackingUrl { get; set; }
    public string? InternalNotes { get; set; }
    public string? CustomerNotes { get; set; }
    public bool IsPaid { get; set; }
    public bool AgreementAccepted { get; set; }
    public string? AgreementVersion { get; set; }
    public DateTime? AgreementAcceptedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Production Fields (populated by state machine transitions) ────────
    /// <summary>Printer assigned at the ReadyToPrint gate.</summary>
    public string? AssignedPrinter { get; set; }

    /// <summary>Material assigned at the ReadyToPrint gate.</summary>
    public string? AssignedMaterial { get; set; }

    /// <summary>True once admin confirms G-code is finalised.</summary>
    public bool GCodeFinalized { get; set; }

    /// <summary>Admin-supplied reason text when placing order On Hold.</summary>
    public string? HoldReason { get; set; }

    /// <summary>Set to true when a paid order is cancelled — triggers refund review.</summary>
    public bool FlaggedForRefundReview { get; set; }

    // The list of items in this order
    public List<OrderItem> Items { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
    public List<OrderCommunication> Communications { get; set; } = new();
    public List<OrderNote> Notes { get; set; } = new();
    public List<OrderStatusHistory> StatusHistory { get; set; } = new();

    [NotMapped]
    public decimal SubtotalAmount
        => Items.Sum(i => (decimal)(i.UnitPrice > 0 ? i.UnitPrice : i.Price) * (i.Count <= 0 ? 1 : i.Count) + (decimal)i.PlateCost);

    [NotMapped]
    public decimal DiscountAmount
        => Math.Max(OrderDiscountAmount, 0m);

    [NotMapped]
    public decimal FinalTotalAmount
        => Math.Max(SubtotalAmount + Math.Max(ServiceFeePrice, 0m) + Math.Max(DeliveryPrice, 0m) - DiscountAmount, 0m);
}