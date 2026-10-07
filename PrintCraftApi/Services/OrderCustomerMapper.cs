using Microsoft.Extensions.Configuration;
using PrintCraftApi.Models;

namespace PrintCraftApi.Services;

/// <summary>
/// Service responsible for mapping domain Order entities into secure, sanitized customer DTOs.
/// Strictly enforces information disclosure rules:
/// 1. Preliminary/auto-calculated prices are masked (null) while an order is awaiting quote review.
/// 2. Internal manufacturing and slicing parameters (plateCost, filamentUsedGrams, estimatedPrintTime)
///    are never exposed to customer-facing endpoints.
/// 3. Sensitive bank transfer details are suppressed until the order is officially quoted and awaiting payment.
/// 4. Internal notes are strictly excluded from customer visibility.
/// </summary>
public static class OrderCustomerMapper
{
    /// <summary>
    /// Determines whether an order is awaiting initial admin quote review.
    /// When true, all preliminary slicer/auto-calculated prices must be concealed from the customer.
    /// </summary>
    public static bool IsQuotePending(Order order)
    {
        var normalizedStatus = OrderStatus.Normalize(order.Status);
        if (normalizedStatus == OrderStatus.QuoteRequested)
        {
            return true;
        }

        if (string.Equals(order.OrderType, "quote", StringComparison.OrdinalIgnoreCase))
        {
            var isConfirmedOrFulfilled = normalizedStatus == OrderStatus.AwaitingPayment
                || normalizedStatus == OrderStatus.ReadyToPrint
                || normalizedStatus == OrderStatus.Printing
                || normalizedStatus == OrderStatus.PostProcessing
                || normalizedStatus == OrderStatus.Shipped;

            if (!isConfirmedOrFulfilled && order.QuotedPrice == null && !order.IsPaid)
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Maps an Order domain entity into a sanitized CustomerOrderResponseDto.
    /// </summary>
    public static CustomerOrderResponseDto MapOrderForCustomer(Order order, IConfiguration? configuration = null)
    {
        var isPendingQuote = IsQuotePending(order);
        var normalizedStatus = OrderStatus.Normalize(order.Status);

        // Bank transfer details: ONLY exposed if payment flow is bank transfer, order is NOT paid,
        // order is awaiting payment, and bank configuration exists.
        CustomerBankTransferDetailsDto? bankTransferDetails = null;
        if (configuration != null
            && string.Equals(order.PaymentFlow, "bank_transfer", StringComparison.OrdinalIgnoreCase)
            && !order.IsPaid
            && normalizedStatus == OrderStatus.AwaitingPayment)
        {
            var accountName = configuration["BankTransfer:AccountName"]?.Trim();
            var iban = configuration["BankTransfer:Iban"]?.Trim();
            var bic = configuration["BankTransfer:Bic"]?.Trim();

            if (!string.IsNullOrWhiteSpace(accountName) || !string.IsNullOrWhiteSpace(iban) || !string.IsNullOrWhiteSpace(bic))
            {
                bankTransferDetails = new CustomerBankTransferDetailsDto
                {
                    AccountName = accountName,
                    Iban = iban,
                    Bic = bic,
                };
            }
        }

        // Customer notes (strictly exclude internal notes)
        var noteItems = new List<CustomerOrderNoteDto>();
        if (order.Notes != null)
        {
            noteItems.AddRange(order.Notes
                .Where(n => string.Equals(n.Visibility, "customer", StringComparison.OrdinalIgnoreCase))
                .OrderBy(n => n.CreatedAt)
                .Select(n => new CustomerOrderNoteDto
                {
                    Id = n.Id,
                    Content = n.Content,
                    Visibility = "customer",
                    CreatedBy = n.CreatedBy ?? string.Empty,
                    CreatedAt = n.CreatedAt,
                }));
        }

        // Backward compatibility for legacy CustomerNotes field
        if (!string.IsNullOrWhiteSpace(order.CustomerNotes) && noteItems.Count == 0)
        {
            noteItems.Add(new CustomerOrderNoteDto
            {
                Id = Guid.Empty,
                Content = order.CustomerNotes,
                Visibility = "customer",
                CreatedBy = "admin",
                CreatedAt = order.UpdatedAt,
            });
        }

        // Order items mapping
        var orderItems = (order.Items ?? new List<OrderItem>())
            .Select(item =>
            {
                var files = new List<CustomerItemFileDto>();
                var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                if (item.Attachments != null)
                {
                    foreach (var attachment in item.Attachments)
                    {
                        if (string.IsNullOrWhiteSpace(attachment.Url)) continue;
                        var url = attachment.Url.Trim();
                        if (!seenUrls.Add(url)) continue;

                        files.Add(new CustomerItemFileDto
                        {
                            Url = url,
                            Name = string.IsNullOrWhiteSpace(attachment.FileName) ? "file" : attachment.FileName,
                            Kind = string.IsNullOrWhiteSpace(attachment.Kind) ? "other" : attachment.Kind,
                        });
                    }
                }

                if (!string.IsNullOrWhiteSpace(item.FileUrl))
                {
                    var fileUrl = item.FileUrl.Trim();
                    if (seenUrls.Add(fileUrl))
                    {
                        files.Add(new CustomerItemFileDto
                        {
                            Url = fileUrl,
                            Name = string.IsNullOrWhiteSpace(item.fileName) ? "model" : item.fileName,
                            Kind = "model",
                        });
                    }
                }

                if (!string.IsNullOrWhiteSpace(item.ImageUrl))
                {
                    var imageUrl = item.ImageUrl.Trim();
                    if (seenUrls.Add(imageUrl))
                    {
                        files.Add(new CustomerItemFileDto
                        {
                            Url = imageUrl,
                            Name = "image",
                            Kind = "image",
                        });
                    }
                }

                return new CustomerOrderItemDto
                {
                    Id = item.Id,
                    OrderId = item.OrderId,
                    FileUrl = item.FileUrl,
                    ImageUrl = item.ImageUrl,
                    FileName = item.fileName,
                    Notes = item.Notes,
                    Size = item.Size,
                    Material = item.Material,
                    Color = item.Color,
                    Count = item.Count,
                    // If quote is pending review, mask preliminary item price and unit price
                    Price = isPendingQuote ? null : item.Price,
                    UnitPrice = isPendingQuote ? null : (item.UnitPrice > 0 ? item.UnitPrice : item.Price),
                    InfillPercent = item.InfillPercent,
                    PrintQuality = item.PrintQuality,
                    ScaleFactor = item.ScaleFactor,
                    SupportsNeeded = item.SupportsNeeded,
                    Files = files,
                    Attachments = files,
                    // Internal slicing & manufacturing metrics (PlateCost, FilamentUsedGrams, EstimatedPrintTime)
                    // are never returned to customer endpoints.
                };
            })
            .ToList();

        // Customer payments
        var payments = (order.Payments ?? new List<Payment>())
            .Select(p => new CustomerPaymentDto
            {
                Id = p.Id,
                OrderId = p.OrderId,
                Provider = p.Provider,
                Reference = p.Reference,
                Currency = p.Currency,
                Amount = p.Amount,
                Status = p.Status,
                Method = p.Method,
                PaidAt = p.PaidAt,
                CreatedAt = p.CreatedAt,
            })
            .ToList();

        return new CustomerOrderResponseDto
        {
            Id = order.Id,
            UserId = order.UserId,
            Status = order.Status,
            OrderType = order.OrderType,
            PaymentFlow = order.PaymentFlow,
            FullName = order.FullName,
            AddressLine1 = order.AddressLine1,
            AddressLine2 = order.AddressLine2,
            City = order.City,
            PostalCode = order.PostalCode,
            PhoneNumber = order.PhoneNumber,

            // Pricing: if quote is pending review, mask all auto-calculated preliminary prices
            DeliveryPrice = isPendingQuote ? null : order.DeliveryPrice,
            OrderDiscountAmount = isPendingQuote ? null : order.OrderDiscountAmount,
            SubtotalAmount = isPendingQuote ? null : order.SubtotalAmount,
            DiscountAmount = isPendingQuote ? null : order.DiscountAmount,
            FinalTotalAmount = isPendingQuote ? null : (order.QuotedPrice ?? order.FinalTotalAmount),
            ServiceFeePrice = isPendingQuote ? null : order.ServiceFeePrice,
            QuotedPrice = isPendingQuote ? null : order.QuotedPrice,

            QuoteConfirmedAt = order.QuoteConfirmedAt,
            QuoteExpiresAt = order.QuoteExpiresAt,
            TrackingCode = order.TrackingCode,
            TrackingUrl = order.TrackingUrl,
            CustomerNotes = order.CustomerNotes,
            IsPaid = order.IsPaid,
            UpdatedAt = order.UpdatedAt,
            CreatedAt = order.CreatedAt,

            BankTransferDetails = bankTransferDetails,
            Items = orderItems,
            Payments = payments,
            Notes = noteItems,
        };
    }
}
