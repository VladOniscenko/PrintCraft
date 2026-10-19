using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PrintCraft.Features.Orders.Services;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Models;
using PrintCraft.Shared.Orders;

namespace PrintCraft.Features.Admin.Services;

public static class AdminOrderHelper
{
    public const string DefaultQuoteConfirmationMessage = "Thank you for your quote request. We reviewed your files and determined the production cost based on materials, print time, and finishing. You can now confirm and pay for your quote in your personal portal.";

    public static readonly HashSet<string> KnownStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "pending",
        "pending_quote",
        OrderStatus.QuoteRequested,
        "quoted",
        "expired_quote",
        "pending_payment",
        "printing",
        "completed",
        "paid",
        "shipped",
        "sent",
        "delivered",
        "failed",
        "cancelled",
        "returned",
        "refunded"
    };

    public static readonly HashSet<string> PostPaymentStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "paid",
        "printing",
        "sent",
        "shipped",
        "delivered",
        "completed",
        "returned",
        "refunded"
    };

    public static readonly HashSet<string> AllowedNoteVisibilities = new(StringComparer.OrdinalIgnoreCase)
    {
        "internal",
        "customer",
    };

    public static bool IsPendingStatus(string? status)
    {
        return !string.IsNullOrWhiteSpace(status)
            && status.StartsWith("pending", StringComparison.OrdinalIgnoreCase);
    }

    public static string NormalizeStatus(string? status)
        => string.IsNullOrWhiteSpace(status) ? string.Empty : status.Trim().ToLowerInvariant();

    public static string NormalizePaymentFlow(string? paymentFlow)
    {
        var normalized = string.IsNullOrWhiteSpace(paymentFlow)
            ? string.Empty
            : paymentFlow.Trim().ToLowerInvariant();

        return normalized is "bank_transfer" or "manual" or "invoice"
            ? "bank_transfer"
            : "bank_transfer";
    }

    public static bool IsBankTransferFlow(string? paymentFlow)
        => string.Equals(NormalizePaymentFlow(paymentFlow), "bank_transfer", StringComparison.OrdinalIgnoreCase);

    public static bool IsKnownStatus(string? status)
        => KnownStatuses.Contains(NormalizeStatus(status));

    public static string NormalizeNoteVisibility(string? visibility)
        => string.IsNullOrWhiteSpace(visibility) ? "internal" : visibility.Trim().ToLowerInvariant();

    public static bool IsAllowedNoteVisibility(string? visibility)
        => AllowedNoteVisibilities.Contains(NormalizeNoteVisibility(visibility));

    public static bool IsPricingLocked(Order order)
    {
        if (order.IsPaid) return true;

        var status = NormalizeStatus(order.Status);
        return status is "paid" or "printing" or "sent" or "shipped" or "delivered" or "completed";
    }

    public static bool CanTransitionStatus(string? currentStatus, string? nextStatus, bool isPaid)
    {
        var current = NormalizeStatus(currentStatus);
        var next = NormalizeStatus(nextStatus);

        if (string.IsNullOrWhiteSpace(next)) return false;
        if (!IsKnownStatus(next)) return false;
        if (string.Equals(current, next, StringComparison.OrdinalIgnoreCase)) return true;

        // Allow jumping to cancelled, returned, or refunded from almost anywhere
        if (next is "cancelled" || next is "returned" || next is "refunded") return true;

        return true;
    }

    public static decimal CalculateSubtotal(Order order)
    {
        return order.Items.Sum(i => (decimal)(i.UnitPrice > 0 ? i.UnitPrice : i.Price) * (i.Count <= 0 ? 1 : i.Count) + (decimal)i.PlateCost);
    }

    public static void RecalculateQuotedPrice(Order order)
    {
        var normalizedDelivery = Math.Max(order.DeliveryPrice, 0m);
        var normalizedServiceFee = Math.Max(order.ServiceFeePrice, 0m);
        var normalizedDiscount = Math.Max(order.OrderDiscountAmount, 0m);
        var subtotal = CalculateSubtotal(order);
        var total = Math.Max(subtotal + normalizedDelivery + normalizedServiceFee - normalizedDiscount, 0m);

        order.DeliveryPrice = normalizedDelivery;
        order.ServiceFeePrice = normalizedServiceFee;
        order.OrderDiscountAmount = normalizedDiscount;
        order.QuotedPrice = total > 0 ? total : null;
    }

    public static async Task RefreshQuoteStatusesAsync(PrintCraftDb db, IEnumerable<Order> orders, string changedBy, CancellationToken cancellationToken = default)
    {
        var transitions = new List<(Guid OrderId, string PreviousStatus, string NewStatus, string Note)>();
        var changed = false;

        foreach (var order in orders)
        {
            var previousStatus = order.Status;
            var result = QuoteLifecycle.ApplyQuoteExpiration(order, DateTime.UtcNow);
            if (!result.HasChanges)
                continue;

            changed = true;
            db.Orders.Attach(order);
            db.Entry(order).State = EntityState.Modified;

            if (result.StatusChanged)
            {
                transitions.Add((
                    order.Id,
                    previousStatus,
                    order.Status,
                    "Quote expired after 7 days without payment"));
            }
        }

        if (!changed)
            return;

        await db.SaveChangesAsync(cancellationToken);

        foreach (var transition in transitions)
        {
            await LogStatusHistoryAsync(
                db,
                transition.OrderId,
                transition.PreviousStatus,
                transition.NewStatus,
                changedBy,
                transition.Note);
        }
    }

    public static async Task LogOrderCommunicationAsync(PrintCraftDb db, Guid orderId, string type, string subject, string recipientEmail)
    {
        db.OrderCommunications.Add(new OrderCommunication
        {
            OrderId = orderId,
            Channel = "email",
            CommunicationType = type,
            Subject = subject,
            RecipientEmail = recipientEmail,
            SentAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();
    }

    public static async Task LogStatusHistoryAsync(PrintCraftDb db, Guid orderId, string? previousStatus, string? newStatus, string changedBy, string? note)
    {
        if (string.IsNullOrWhiteSpace(newStatus)) return;
        if (string.Equals(previousStatus, newStatus, StringComparison.OrdinalIgnoreCase)) return;

        db.OrderStatusHistory.Add(new OrderStatusHistory
        {
            OrderId = orderId,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = changedBy,
            Note = note,
        });

        await db.SaveChangesAsync();
    }

    public static async Task LogAdminActionAsync(PrintCraftDb db, Order order, string note)
    {
        var status = string.IsNullOrWhiteSpace(order.Status) ? OrderStatus.QuoteRequested : order.Status;

        db.OrderStatusHistory.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            PreviousStatus = status,
            NewStatus = status,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = "admin_action",
            Note = note,
        });

        await db.SaveChangesAsync();
    }

    public static async Task<Payment> EnsureBankTransferPaymentAsync(PrintCraftDb db, IConfiguration configuration, Order order, decimal amount)
    {
        var payment = await db.Payments
            .Where(p => p.OrderId == order.Id && p.Provider == "bank_transfer")
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        if (payment == null)
        {
            payment = new Payment
            {
                OrderId = order.Id,
                Provider = "bank_transfer",
                Reference = BuildPaymentReference(order.Id),
                Currency = string.IsNullOrWhiteSpace(configuration["CurrencyCode"]) ? "EUR" : configuration["CurrencyCode"]!.Trim().ToUpperInvariant(),
                Amount = amount,
                Status = "pending",
                Method = "bank_transfer",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            db.Payments.Add(payment);
            return payment;
        }

        payment.Amount = amount;
        payment.Currency = string.IsNullOrWhiteSpace(configuration["CurrencyCode"]) ? payment.Currency : configuration["CurrencyCode"]!.Trim().ToUpperInvariant();
        payment.Status = string.Equals(payment.Status, "paid", StringComparison.OrdinalIgnoreCase) ? payment.Status : "pending";
        payment.Method = "bank_transfer";
        payment.FailureReason = null;
        payment.CanceledAt = null;
        payment.ExpiredAt = null;
        payment.FailedAt = null;
        payment.UpdatedAt = DateTime.UtcNow;

        return payment;
    }

    public static string BuildPaymentReference(Guid orderId)
        => $"PC-{orderId.ToString("N")[..8]}-{Guid.NewGuid().ToString("N")[..12]}";

    public static bool IsPrintable3DModelUrl(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return false;
        var clean = rawUrl.Split('?', '#')[0];
        return clean.EndsWith(".stl", StringComparison.OrdinalIgnoreCase) ||
               clean.EndsWith(".obj", StringComparison.OrdinalIgnoreCase) ||
               clean.EndsWith(".3mf", StringComparison.OrdinalIgnoreCase) ||
               clean.EndsWith(".step", StringComparison.OrdinalIgnoreCase) ||
               clean.EndsWith(".stp", StringComparison.OrdinalIgnoreCase) ||
               clean.EndsWith(".zip", StringComparison.OrdinalIgnoreCase);
    }

    public static string? ExtractFileNameFromAssetUrl(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return null;

        var path = rawUrl.Trim();
        if (Uri.TryCreate(path, UriKind.Absolute, out var absoluteUri))
        {
            path = absoluteUri.AbsolutePath;
        }

        var normalizedPath = path.Replace('\\', '/');
        var withoutQuery = normalizedPath.Split('?', '#')[0];
        var fileName = Path.GetFileName(withoutQuery);
        if (string.IsNullOrWhiteSpace(fileName)) return null;
        if (fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0) return null;

        return fileName;
    }

    public static void DeleteUploadFileIfExists(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return;

        var path = rawUrl.Trim();
        if (Uri.TryCreate(path, UriKind.Absolute, out var absoluteUri))
        {
            path = absoluteUri.AbsolutePath;
        }

        var normalizedPath = path.Replace('\\', '/');
        if (!normalizedPath.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
            return;

        var fileName = Path.GetFileName(normalizedPath);
        if (string.IsNullOrWhiteSpace(fileName)) return;
        if (fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0) return;

        var uploadsRoot = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"));
        var filePath = Path.GetFullPath(Path.Combine(uploadsRoot, fileName));

        if (!filePath.StartsWith(uploadsRoot + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            return;

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }

    public static async Task<(string Email, string Name)?> ResolveOrderEmailRecipientAsync(PrintCraftDb db, Order order)
    {
        if (order.UserId.HasValue)
        {
            var user = await db.Users.FindAsync(order.UserId.Value);
            if (user != null && !string.IsNullOrWhiteSpace(user.Email))
            {
                var name = string.IsNullOrWhiteSpace(user.Name) ? user.Email : user.Name;
                return (user.Email.Trim(), name.Trim());
            }
        }

        var recentEmail = await db.OrderCommunications
            .Where(c => c.OrderId == order.Id && !string.IsNullOrWhiteSpace(c.RecipientEmail))
            .OrderByDescending(c => c.SentAt)
            .Select(c => c.RecipientEmail)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrWhiteSpace(recentEmail))
        {
            var name = string.IsNullOrWhiteSpace(order.FullName) ? "Customer" : order.FullName.Trim();
            return (recentEmail.Trim(), name);
        }

        return null;
    }

    public static bool IsValidEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;

        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

