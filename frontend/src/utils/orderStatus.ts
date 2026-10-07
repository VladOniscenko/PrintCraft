export const ADMIN_ORDER_STATUS_OPTIONS = [
  { value: "quote_requested", label: "Quote Requested" },
  { value: "awaiting_payment", label: "Awaiting Payment" },
  { value: "ready_to_print", label: "Ready to Print" },
  { value: "printing", label: "Printing" },
  { value: "post_processing", label: "Post-Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
] as const;

const POST_PAYMENT_STATUSES = new Set([
  "ready_to_print",
  "printing",
  "post_processing",
  "shipped",
  "returned",
]);

const CUSTOMER_PAYMENT_RETRYABLE_STATUSES = new Set(["awaiting_payment"]);

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
    case "quote_requested":
      return `${base} bg-amber-100 text-amber-800`;
    case "awaiting_payment":
      return `${base} bg-sky-100 text-sky-800`;
    case "ready_to_print":
      return `${base} bg-teal-100 text-teal-800`;
    case "printing":
      return `${base} bg-indigo-100 text-indigo-800`;
    case "post_processing":
      return `${base} bg-purple-100 text-purple-800`;
    case "shipped":
      return `${base} bg-emerald-100 text-emerald-800`;
    case "on_hold":
      return `${base} bg-orange-100 text-orange-800`;
    case "cancelled":
      return `${base} bg-rose-100 text-rose-800`;
    case "returned":
      return `${base} bg-rose-200 text-rose-900`;
    default:
      return `${base} bg-slate-100 text-slate-700`;
  }
}

export function getOrderStatusBadgeClass(status: string): string {
  const normalized = normalizeOrderStatus(status);

  switch (normalized) {
    case "quote_requested":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "awaiting_payment":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "ready_to_print":
      return "bg-teal-50 text-teal-700 border-teal-100";
    case "printing":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "post_processing":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "shipped":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "on_hold":
      return "bg-orange-50 text-orange-700 border-orange-100";
    case "cancelled":
    case "returned":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-gray-50 text-gray-600 border-gray-100";
  }
}

export function getOrderStatusTranslationKey(_status: string): string | null {
  // Can expand these, but for now we map canonical ones properly or fall back to formatting
  return null;
}

export function getOrderStatusTimelineStep(status: string): number {
  const normalized = normalizeOrderStatus(status);

  switch (normalized) {
    case "quote_requested":
      return 1;
    case "awaiting_payment":
      return 2;
    case "ready_to_print":
      return 3;
    case "printing":
      return 4;
    case "post_processing":
      return 5;
    case "shipped":
      return 6;
    default:
      return 1;
  }
}

export function isExceptionState(status: string): boolean {
  const normalized = normalizeOrderStatus(status);
  return ["on_hold", "cancelled", "returned"].includes(normalized);
}

export function getOrderTerminalState(
  status: string,
): "failed" | "cancelled" | "returned" | "on_hold" | null {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "cancelled") return "cancelled";
  if (normalized === "returned") return "returned";
  if (normalized === "on_hold") return "on_hold";
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
    case "awaiting_payment":
      return "pay_now";
    default:
      return null;
  }
}
