using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PrintCraft.Shared.Models;

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
    public string Language { get; set; } = "en";
    public bool IsExpress { get; set; }
    public string RequestType { get; set; } = "StandardUpload";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // ── Production Fields (populated by state machine transitions) ────────
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
    public decimal ExpressFeeAmount
        => IsExpress ? Math.Round(SubtotalAmount * 0.30m, 2) : 0m;

    [NotMapped]
    public decimal DiscountAmount
        => Math.Max(OrderDiscountAmount, 0m);

    [NotMapped]
    public decimal FinalTotalAmount
        => Math.Max(SubtotalAmount + ExpressFeeAmount + Math.Max(ServiceFeePrice, 0m) + Math.Max(DeliveryPrice, 0m) - DiscountAmount, 0m);
}