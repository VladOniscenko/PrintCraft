export const ADMIN_ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "pending_quote", label: "Pending Quote" },
  { value: "quoted", label: "Quoted" },
  { value: "expired_quote", label: "Expired Quote" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "paid", label: "Paid" },
  { value: "printing", label: "Printing" },
  { value: "sent", label: "Sent" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
  { value: "refunded", label: "Refunded" },
] as const;

const POST_PAYMENT_STATUSES = new Set([
  "paid",
  "printing",
  "sent",
  "shipped",
  "delivered",
  "completed",
]);

const CUSTOMER_PAYMENT_RETRYABLE_STATUSES = new Set(["quoted", "failed"]);

const STATUS_LABEL_BY_VALUE = new Map<string, string>(
  ADMIN_ORDER_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

export function normalizeOrderStatus(status?: string | null): string {
  return (status || "").trim().toLowerCase();
}

export function normalizePaymentFlow(flow?: string | null): string {
  const normalized = (flow || "").trim().toLowerCase();
  return normalized === "bank_transfer" ||
    normalized === "manual" ||
    normalized === "invoice"
    ? "bank_transfer"
    : "bank_transfer";
}

export function formatOrderStatusLabel(status?: string | null): string {
  const normalized = normalizeOrderStatus(status);
  if (!normalized) return "Unknown";

  const known = STATUS_LABEL_BY_VALUE.get(normalized);
  if (known) return known;

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getOrderStatusPillClass(status: string): string {
  const base = "admin-status-pill";
  const normalized = normalizeOrderStatus(status);

  switch (normalized) {
    case "pending_quote":
      return `${base} bg-amber-100 text-amber-800`;
    case "quoted":
      return `${base} bg-sky-100 text-sky-800`;
    case "expired_quote":
      return `${base} bg-rose-100 text-rose-800`;
    case "printing":
      return `${base} bg-indigo-100 text-indigo-800`;
    case "completed":
      return `${base} bg-emerald-100 text-emerald-800`;
    case "paid":
      return `${base} bg-teal-100 text-teal-800`;
    case "cancelled":
      return `${base} bg-rose-100 text-rose-800`;
    default:
      return `${base} bg-slate-100 text-slate-700`;
  }
}

export function getOrderStatusBadgeClass(status: string): string {
  const normalized = normalizeOrderStatus(status);

  switch (normalized) {
    case "pending_quote":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "quoted":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "expired_quote":
      return "bg-rose-50 text-rose-700 border-rose-100";
    case "pending_payment":
      return "bg-orange-50 text-orange-700 border-orange-100";
    case "printing":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "paid":
      return "bg-teal-50 text-teal-700 border-teal-100";
    case "shipped":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "failed":
    case "cancelled":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-gray-50 text-gray-600 border-gray-100";
  }
}

export function getOrderStatusTranslationKey(status: string): string | null {
  const normalized = normalizeOrderStatus(status);

  switch (normalized) {
    case "pending_quote":
      return "orderStatus.pendingQuote";
    case "quoted":
      return "orderStatus.quoted";
    case "expired_quote":
      return "orderStatus.expiredQuote";
    case "pending_payment":
      return "orderStatus.pendingPayment";
    case "printing":
      return "orderStatus.printing";
    case "completed":
      return "orderStatus.completed";
    case "paid":
      return "orderStatus.paid";
    case "shipped":
      return "orderStatus.shipped";
    case "sent":
      return "orderStatus.sent";
    case "delivered":
      return "orderStatus.delivered";
    case "failed":
      return "orderStatus.failed";
    case "cancelled":
      return "orderStatus.cancelled";
    default:
      return null;
  }
}

export function getOrderStatusTimelineStep(status: string): number {
  const normalized = normalizeOrderStatus(status);

  switch (normalized) {
    case "pending_quote":
      return 1;
    case "quoted":
    case "pending_payment":
    case "expired_quote":
    case "failed":
      return 2;
    case "paid":
      return 3;
    case "printing":
      return 4;
    case "sent":
    case "shipped":
      return 5;
    case "delivered":
      return 6;
    case "completed":
      return 7;
    case "cancelled":
      return 1;
    default:
      return 1;
  }
}

export function getOrderTerminalState(
  status: string,
): "failed" | "cancelled" | null {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "failed") return "failed";
  if (normalized === "cancelled") return "cancelled";
  return null;
}

export function canTransitionOrderStatus(
  currentStatus: string,
  nextStatus: string,
  _isPaid: boolean,
): boolean {
  void _isPaid;
  const current = normalizeOrderStatus(currentStatus);
  const next = normalizeOrderStatus(nextStatus);

  if (!next) return false;
  if (current === next) return true;
  return true;
}

export function isOrderPricingLocked(status: string, isPaid: boolean): boolean {
  if (isPaid) return true;

  const normalized = normalizeOrderStatus(status);
  return POST_PAYMENT_STATUSES.has(normalized);
}

export function canCustomerRetryPayment(
  status: string,
  isPaid: boolean,
  paymentFlow?: string | null,
): boolean {
  if (isPaid) return false;
  if (normalizePaymentFlow(paymentFlow) !== "bank_transfer") return false;

  const normalized = normalizeOrderStatus(status);
  return CUSTOMER_PAYMENT_RETRYABLE_STATUSES.has(normalized);
}

export function getCustomerPaymentActionVariant(
  status: string,
  paymentFlow?: string | null,
): "pay_now" | "pay_again" | null {
  if (normalizePaymentFlow(paymentFlow) !== "bank_transfer") return null;

  const normalized = normalizeOrderStatus(status);

  switch (normalized) {
    case "quoted":
      return "pay_now";
    case "failed":
      return "pay_again";
    default:
      return null;
  }
}
