namespace PrintCraftApi.Models;

/// <summary>
/// Data Transfer Object representing an order safely tailored for customer-facing endpoints.
/// Conceals preliminary/auto-calculated prices when an order is pending quote review,
/// omits internal slicing and manufacturing parameters (e.g. plate cost, filament weight, print time),
/// and suppresses payment instructions until an order is officially ready for payment.
/// </summary>
public class CustomerOrderResponseDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string OrderType { get; set; } = string.Empty;
    public string PaymentFlow { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    // Pricing fields: null when quote is pending review
    public decimal? DeliveryPrice { get; set; }
    public decimal? OrderDiscountAmount { get; set; }
    public decimal? SubtotalAmount { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? FinalTotalAmount { get; set; }
    public decimal? ServiceFeePrice { get; set; }
    public decimal? QuotedPrice { get; set; }

    public DateTime? QuoteConfirmedAt { get; set; }
    public DateTime? QuoteExpiresAt { get; set; }
    public string? TrackingCode { get; set; }
    public string? TrackingUrl { get; set; }
    public string? CustomerNotes { get; set; }
    public bool IsPaid { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Sensitive bank details: only populated when order is awaiting bank transfer payment
    public CustomerBankTransferDetailsDto? BankTransferDetails { get; set; }

    public List<CustomerOrderItemDto> Items { get; set; } = new();
    public List<CustomerPaymentDto> Payments { get; set; } = new();
    public List<CustomerOrderNoteDto> Notes { get; set; } = new();
}

public class CustomerOrderItemDto
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

    // Pricing fields: null when quote is pending review
    public double? Price { get; set; }
    public double? UnitPrice { get; set; }

    public int InfillPercent { get; set; }
    public string PrintQuality { get; set; } = string.Empty;
    public double ScaleFactor { get; set; }
    public bool? SupportsNeeded { get; set; }

    public List<CustomerItemFileDto> Files { get; set; } = new();
    public List<CustomerItemFileDto> Attachments { get; set; } = new();
}

public class CustomerItemFileDto
{
    public string Url { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
}

public class CustomerBankTransferDetailsDto
{
    public string? AccountName { get; set; }
    public string? Iban { get; set; }
    public string? Bic { get; set; }
}

public class CustomerPaymentDto
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

public class CustomerOrderNoteDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Visibility { get; set; } = "customer";
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

