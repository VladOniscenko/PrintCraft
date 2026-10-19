namespace PrintCraft.Features.Admin.Models;

public record CreateOrderNoteRequest(string Content, string Visibility);
public record UpdateItemRequest(double UnitPrice, double? PlateCost = null);
public record DeliveryPriceRequest(decimal DeliveryPrice);
public record FeePriceRequest(decimal ServiceFeePrice);
public record OrderDiscountRequest(decimal OrderDiscountAmount);
public record UpdateOrderStatusRequest(string Status);
public record UpdateOrderCustomerRequest(
    string FullName,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string PostalCode,
    string PhoneNumber);
public record TrackingRequest(string? TrackingCode, string? TrackingUrl);
public record SendOrderEmailRequest(
    string Type,
    decimal? Price,
    string? Message,
    string? TrackingCode,
    string? TrackingUrl,
    string? PaymentFlow,
    string? Subject,
    string? Body,
    string? Template);
public record AdminUserDto(Guid Id, string Name, string Email, string Role);
public record UpdateUserRequest(string Name, string Email, string Role);

public record ProcessFullQuoteRequest(
    Dictionary<Guid, double> ItemPrices,
    Dictionary<Guid, double> ItemPlateCosts,
    decimal DeliveryPrice,
    decimal ServiceFeePrice,
    decimal OrderDiscountAmount,
    string QuoteMessage,
    string PaymentFlow
);

