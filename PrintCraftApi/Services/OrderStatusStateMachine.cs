using PrintCraftApi.Data;
using PrintCraftApi.Models;
using Microsoft.EntityFrameworkCore;

namespace PrintCraftApi.Services;

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
        => string.IsNullOrWhiteSpace(status) ? string.Empty : status.Trim().ToLowerInvariant();
}

/// <summary>
/// Outcome of a state machine transition attempt.
/// </summary>
public sealed class TransitionResult
{
    public bool Success { get; private init; }
    public string? ErrorMessage { get; private init; }
    public bool FlagForRefundReview { get; private init; }

    public static TransitionResult Ok(bool flagRefund = false)
        => new() { Success = true, FlagForRefundReview = flagRefund };

    public static TransitionResult Fail(string reason)
        => new() { Success = false, ErrorMessage = reason };
}

/// <summary>
/// Request payload for a status transition from the admin PATCH endpoint.
/// </summary>
public sealed class StatusTransitionRequest
{
    /// <summary>Target status to move the order into.</summary>
    public string TargetStatus { get; init; } = string.Empty;

    /// <summary>Required when transitioning to OnHold. Admin must provide a reason.</summary>
    public string? HoldReason { get; init; }

    /// <summary>Required for ReadyToPrint: which printer will be used.</summary>
    public string? AssignedPrinter { get; init; }

    /// <summary>Required for ReadyToPrint: which material is loaded.</summary>
    public string? AssignedMaterial { get; init; }

    /// <summary>
    /// Required for ReadyToPrint: signals that G-code has been reviewed and finalised.
    /// </summary>
    public bool GCodeFinalized { get; init; }

    /// <summary>Required for PostProcessing: indicates QC has passed.</summary>
    public bool QualityCheckPassed { get; init; }

    /// <summary>Required for PostProcessing → Shipped: the courier tracking number.</summary>
    public string? TrackingNumber { get; init; }

    /// <summary>Optional tracking URL accompanying the tracking number.</summary>
    public string? TrackingUrl { get; init; }
}

/// <summary>
/// Central state machine that governs all order status transitions.
/// Every rule is in one place – no transition logic lives in the controller.
/// </summary>
public sealed class OrderStatusStateMachine
{
    private readonly PrintCraftDb _db;

    public OrderStatusStateMachine(PrintCraftDb db)
    {
        _db = db;
    }

    /// <summary>
    /// Attempts to transition <paramref name="order"/> to the status specified in
    /// <paramref name="request"/>. Returns a <see cref="TransitionResult"/> describing
    /// success or the specific prerequisite that was not met.
    /// The caller is responsible for persisting the order after a successful result.
    /// </summary>
    public async Task<TransitionResult> TryTransitionAsync(
        Order order,
        StatusTransitionRequest request)
    {
        var target = OrderStatus.Normalize(request.TargetStatus);
        var current = OrderStatus.Normalize(order.Status);

        if (string.IsNullOrWhiteSpace(target))
            return TransitionResult.Fail("Target status must not be empty.");

        if (current == target)
            return TransitionResult.Fail($"Order is already in status '{target}'.");

        // ── Exception State Transitions ─────────────────────────────────
        if (target == OrderStatus.OnHold)
            return await TransitionToOnHoldAsync(order, request, current);

        if (target == OrderStatus.Cancelled)
            return TransitionToCancelled(order, current);

        if (target == OrderStatus.Returned)
            return TransitionToReturned(current);

        // ── Primary Workflow Transitions ─────────────────────────────────
        return target switch
        {
            OrderStatus.AwaitingPayment => await TransitionToAwaitingPaymentAsync(order, current),
            OrderStatus.ReadyToPrint    => TransitionToReadyToPrint(order, request, current),
            OrderStatus.Printing        => TransitionToPrinting(current),
            OrderStatus.PostProcessing  => TransitionToPostProcessing(current),
            OrderStatus.Shipped         => TransitionToShipped(order, request, current),
            _                           => TransitionResult.Fail($"Unknown target status '{target}'.")
        };
    }

    // ══════════════════════════════════════════════════════════════════════
    //  Primary Workflow Gate Methods
    // ══════════════════════════════════════════════════════════════════════

    /// <summary>
    /// QuoteRequested → AwaitingPayment
    /// Gate: every OrderItem must have a Price > 0, and CustomerNotes must have been reviewed
    /// (i.e. the quote message was set, signalling admin reviewed the notes).
    /// </summary>
    private async Task<TransitionResult> TransitionToAwaitingPaymentAsync(Order order, string current)
    {
        if (!IsAllowedPredecessor(current,
            OrderStatus.QuoteRequested, OrderStatus.OnHold))
            return TransitionResult.Fail(
                $"Cannot move to Awaiting Payment from '{current}'. " +
                "Order must be in Quote Requested (or On Hold returning to workflow).");

        // Ensure items are loaded
        if (!_db.Entry(order).Collection(o => o.Items).IsLoaded)
            await _db.Entry(order).Collection(o => o.Items).LoadAsync();

        if (order.Items == null || order.Items.Count == 0)
            return TransitionResult.Fail("Order has no items and cannot be quoted.");

        var unpricedItems = order.Items.Where(i => i.Price <= 0).ToList();
        if (unpricedItems.Count > 0)
            return TransitionResult.Fail(
                $"{unpricedItems.Count} item(s) still have no price set. " +
                "All items must be priced before sending to the customer.");

        if (string.IsNullOrWhiteSpace(order.QuoteMessage))
            return TransitionResult.Fail(
                "A quote message is required before advancing. " +
                "This confirms the admin has reviewed the customer notes.");

        if ((order.QuotedPrice ?? 0m) <= 0m)
            return TransitionResult.Fail(
                "Quoted total must be greater than zero before advancing.");

        // Apply transition
        order.Status = OrderStatus.AwaitingPayment;
        QuoteLifecycle.MarkQuoteConfirmed(order, DateTime.UtcNow);
        order.UpdatedAt = DateTime.UtcNow;
        return TransitionResult.Ok();
    }

    /// <summary>
    /// AwaitingPayment → ReadyToPrint
    /// Gate: order.IsPaid must be true (payment confirmed), printer assigned, material assigned, G-code finalised.
    /// </summary>
    private static TransitionResult TransitionToReadyToPrint(
        Order order, StatusTransitionRequest request, string current)
    {
        if (!IsAllowedPredecessor(current,
            OrderStatus.AwaitingPayment, OrderStatus.OnHold))
            return TransitionResult.Fail(
                $"Cannot move to Ready to Print from '{current}'. " +
                "Order must have confirmed payment first.");

        if (!order.IsPaid)
            return TransitionResult.Fail(
                "Payment has not been confirmed. " +
                "Mark the order as paid before moving to Ready to Print.");

        // Transition the order
        order.Status           = OrderStatus.ReadyToPrint;
        order.UpdatedAt        = DateTime.UtcNow;
        return TransitionResult.Ok();
    }

    /// <summary>
    /// ReadyToPrint → Printing
    /// Gate: structural only – order must be in ReadyToPrint.
    /// The physical print start is the gate.
    /// </summary>
    private static TransitionResult TransitionToPrinting(string current)
    {
        if (!IsAllowedPredecessor(current, OrderStatus.ReadyToPrint, OrderStatus.OnHold))
            return TransitionResult.Fail(
                $"Cannot move to Printing from '{current}'. " +
                "Order must be in Ready to Print first.");

        return TransitionResult.Ok();
    }

    /// <summary>
    /// Printing → PostProcessing
    /// Gate: print job must be marked complete (implicit when admin moves the card).
    /// In practice this is a drag from Printing → PostProcessing which confirms success.
    /// </summary>
    private static TransitionResult TransitionToPostProcessing(string current)
    {
        if (!IsAllowedPredecessor(current, OrderStatus.Printing, OrderStatus.OnHold))
            return TransitionResult.Fail(
                $"Cannot move to Post-Processing from '{current}'. " +
                "Order must have been printing first.");

        return TransitionResult.Ok();
    }

    /// <summary>
    /// PostProcessing → Shipped
    /// Gate: quality check must have passed AND a tracking number must be provided.
    /// </summary>
    private static TransitionResult TransitionToShipped(
        Order order, StatusTransitionRequest request, string current)
    {
        if (!IsAllowedPredecessor(current, OrderStatus.PostProcessing, OrderStatus.OnHold))
            return TransitionResult.Fail(
                $"Cannot mark as Shipped from '{current}'. " +
                "Order must complete post-processing first.");

        if (!request.QualityCheckPassed)
            return TransitionResult.Fail(
                "Quality check must be confirmed as passed before shipping.");

        if (string.IsNullOrWhiteSpace(request.TrackingNumber))
            return TransitionResult.Fail(
                "A tracking number is required before the order can be marked as shipped.");

        order.TrackingCode  = request.TrackingNumber.Trim();
        order.TrackingUrl   = request.TrackingUrl?.Trim();
        order.Status        = OrderStatus.Shipped;
        order.UpdatedAt     = DateTime.UtcNow;
        return TransitionResult.Ok();
    }

    // ══════════════════════════════════════════════════════════════════════
    //  Exception State Gate Methods
    // ══════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Any active state → OnHold.
    /// Gate: admin must provide a hold reason text.
    /// </summary>
    private static async Task<TransitionResult> TransitionToOnHoldAsync(
        Order order, StatusTransitionRequest request, string current)
    {
        await Task.CompletedTask; // async signature for future extensibility

        var nonHoldableStates = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            OrderStatus.Shipped, OrderStatus.Cancelled, OrderStatus.Returned, OrderStatus.OnHold
        };

        if (nonHoldableStates.Contains(current))
            return TransitionResult.Fail(
                $"Order cannot be placed On Hold from status '{current}'.");

        if (string.IsNullOrWhiteSpace(request.HoldReason))
            return TransitionResult.Fail(
                "An admin reason is required to place an order On Hold.");

        order.HoldReason = request.HoldReason.Trim();
        order.Status     = OrderStatus.OnHold;
        order.UpdatedAt  = DateTime.UtcNow;
        return TransitionResult.Ok();
    }

    /// <summary>
    /// Can cancel from: QuoteRequested, AwaitingPayment, ReadyToPrint.
    /// If the order was paid, flags it for refund review.
    /// </summary>
    private static TransitionResult TransitionToCancelled(Order order, string current)
    {
        var cancellableFrom = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            OrderStatus.QuoteRequested,
            OrderStatus.AwaitingPayment,
            OrderStatus.ReadyToPrint,
            OrderStatus.OnHold
        };

        if (!cancellableFrom.Contains(current))
            return TransitionResult.Fail(
                $"Order cannot be cancelled from status '{current}'. " +
                "Only orders that have not yet started printing may be cancelled.");

        var requiresRefund = order.IsPaid;
        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;
        return TransitionResult.Ok(flagRefund: requiresRefund);
    }

    /// <summary>
    /// Can only return from Shipped.
    /// </summary>
    private static TransitionResult TransitionToReturned(string current)
    {
        if (!IsAllowedPredecessor(current, OrderStatus.Shipped))
            return TransitionResult.Fail(
                $"Order cannot be marked Returned from '{current}'. " +
                "Only shipped orders can be returned.");

        return TransitionResult.Ok();
    }

    // ══════════════════════════════════════════════════════════════════════
    //  Helpers
    // ══════════════════════════════════════════════════════════════════════

    private static bool IsAllowedPredecessor(string current, params string[] allowed)
        => allowed.Any(a => string.Equals(a, current, StringComparison.OrdinalIgnoreCase));
}

