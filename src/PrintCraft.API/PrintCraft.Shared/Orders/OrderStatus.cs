namespace PrintCraft.Shared.Orders;

/// <summary>
/// Canonical order status constants used throughout the system.
/// Primary workflow: QuoteRequested → AwaitingPayment → ReadyToPrint → Printing → PostProcessing → Shipped
/// Exception states: OnHold, Cancelled, Returned
/// </summary>
public static class OrderStatus
{
    // ── Primary Workflow ──────────────────────────────────────────────────
    /// <summary>Initial state. Customer has submitted models and notes for review.</summary>
    public const string QuoteRequested = "quote_requested";

    /// <summary>Admin has priced the order and the customer must pay.</summary>
    public const string AwaitingPayment = "awaiting_payment";

    /// <summary>Payment confirmed. Admin assigns printer/material and finalises G-code.</summary>
    public const string ReadyToPrint = "ready_to_print";

    /// <summary>Printer is actively printing the job.</summary>
    public const string Printing = "printing";

    /// <summary>Print is done. QC check and packing required before shipping.</summary>
    public const string PostProcessing = "post_processing";

    /// <summary>Order has been shipped. Terminal success state.</summary>
    public const string Shipped = "shipped";

    // ── Exception States ──────────────────────────────────────────────────
    /// <summary>Order is paused with an admin reason. Can resume.</summary>
    public const string OnHold = "on_hold";

    /// <summary>Order cancelled. May require refund review if previously paid.</summary>
    public const string Cancelled = "cancelled";

    /// <summary>Customer has returned the shipped order.</summary>
    public const string Returned = "returned";

    public static readonly HashSet<string> All = new(StringComparer.OrdinalIgnoreCase)
    {
        QuoteRequested, AwaitingPayment, ReadyToPrint, Printing, PostProcessing, Shipped,
        OnHold, Cancelled, Returned
    };

    public static readonly HashSet<string> ActiveWorkflow = new(StringComparer.OrdinalIgnoreCase)
    {
        QuoteRequested, AwaitingPayment, ReadyToPrint, Printing, PostProcessing
    };

    public static readonly HashSet<string> ExceptionStates = new(StringComparer.OrdinalIgnoreCase)
    {
        OnHold, Cancelled, Returned
    };

    public static string Normalize(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return string.Empty;
        var s = status.Trim().ToLowerInvariant();
        if (s == "pending_payment" || s == "quoted") return AwaitingPayment;
        if (s == "pending_quote" || s == "pending") return QuoteRequested;
        if (s == "paid" || s == "completed") return ReadyToPrint;
        if (s == "sent" || s == "delivered") return Shipped;
        return s;
    }

    /// <summary>
    /// Determines whether an order is awaiting initial admin quote review.
    /// When true, all preliminary slicer/auto-calculated prices must be concealed from the customer.
    /// </summary>
    public static bool IsQuotePending(Models.Order order)
    {
        var normalizedStatus = Normalize(order.Status);
        if (normalizedStatus == QuoteRequested)
        {
            return true;
        }

        if (string.Equals(order.OrderType, "quote", StringComparison.OrdinalIgnoreCase))
        {
            var isConfirmedOrFulfilled = normalizedStatus == AwaitingPayment
                || normalizedStatus == ReadyToPrint
                || normalizedStatus == Printing
                || normalizedStatus == PostProcessing
                || normalizedStatus == Shipped;

            if (!isConfirmedOrFulfilled && order.QuotedPrice == null && !order.IsPaid)
            {
                return true;
            }
        }

        return false;
    }
}
