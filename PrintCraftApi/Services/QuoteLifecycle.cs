using PrintCraftApi.Models;

namespace PrintCraftApi.Services;

public static class QuoteLifecycle
{
    public const int QuoteValidityDays = 7;

    public static QuoteLifecycleResult ApplyQuoteExpiration(Order order, DateTime nowUtc)
    {
        if (!string.Equals(order.OrderType, "quote", StringComparison.OrdinalIgnoreCase) || order.IsPaid)
            return QuoteLifecycleResult.NoChanges;

        var normalizedStatus = Normalize(order.Status);
        if (normalizedStatus is not ("quoted" or "pending_payment" or "awaiting_payment" or "expired_quote"))
            return QuoteLifecycleResult.NoChanges;

        var hasChanges = false;

        if (!order.QuoteConfirmedAt.HasValue && !order.QuoteExpiresAt.HasValue)
        {
            var baseline = order.UpdatedAt != default
                ? order.UpdatedAt
                : (order.CreatedAt != default ? order.CreatedAt : nowUtc);

            order.QuoteConfirmedAt = baseline;
            order.QuoteExpiresAt = baseline.AddDays(QuoteValidityDays);
            hasChanges = true;
        }
        else if (!order.QuoteConfirmedAt.HasValue && order.QuoteExpiresAt.HasValue)
        {
            order.QuoteConfirmedAt = order.QuoteExpiresAt.Value.AddDays(-QuoteValidityDays);
            hasChanges = true;
        }
        else if (order.QuoteConfirmedAt.HasValue && !order.QuoteExpiresAt.HasValue)
        {
            order.QuoteExpiresAt = order.QuoteConfirmedAt.Value.AddDays(QuoteValidityDays);
            hasChanges = true;
        }

        var expiresAt = order.QuoteExpiresAt;
        if ((normalizedStatus is "quoted" or "pending_payment" or "awaiting_payment")
            && expiresAt.HasValue
            && expiresAt.Value <= nowUtc)
        {
            order.Status = "expired_quote";
            order.UpdatedAt = nowUtc;
            return new QuoteLifecycleResult(true, true, true);
        }

        return hasChanges
            ? new QuoteLifecycleResult(true, false, false)
            : QuoteLifecycleResult.NoChanges;
    }

    public static void MarkQuoteConfirmed(Order order, DateTime nowUtc)
    {
        order.QuoteConfirmedAt = nowUtc;
        order.QuoteExpiresAt = nowUtc.AddDays(QuoteValidityDays);
    }

    public static void ClearQuoteWindow(Order order)
    {
        order.QuoteConfirmedAt = null;
        order.QuoteExpiresAt = null;
    }

    private static string Normalize(string? status)
        => string.IsNullOrWhiteSpace(status) ? string.Empty : status.Trim().ToLowerInvariant();
}

public readonly record struct QuoteLifecycleResult(bool HasChanges, bool StatusChanged, bool ExpiredNow)
{
    public static QuoteLifecycleResult NoChanges { get; } = new(false, false, false);
}
