import type { TranslationKey } from "../i18n/translations";

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

const STATUS_LABEL_BY_VALUE = new Map<string, string>(
  ADMIN_ORDER_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

export function normalizeOrderStatus(status?: string | null): string {
  const s = (status || "").trim().toLowerCase();
  if (s === "pending_payment" || s === "quoted") return "awaiting_payment";
  if (s === "pending_quote" || s === "pending") return "quote_requested";
  if (s === "paid" || s === "completed") return "ready_to_print";
  if (s === "sent" || s === "delivered") return "shipped";
  return s;
}

export function normalizePaymentFlow(flow?: string | null): string {
  const normalized = (flow || "").trim().toLowerCase();
  return normalized === "bank_transfer" ||
    normalized === "manual" ||
    normalized === "invoice"
    ? "bank_transfer"
    : "bank_transfer";
}

export function formatOrderStatusLabel(
  status?: string | null,
  t?: (key: TranslationKey, vars?: Record<string, string | number>) => string,
): string {
  const normalized = normalizeOrderStatus(status);
  if (!normalized) return t ? t("orderStatus.unknown") : "Unknown";

  if (t) {
    const statusKey = getOrderStatusTranslationKey(normalized);
    if (statusKey) {
      const translated = t(statusKey);
      if (translated && !translated.startsWith("🔴")) {
        return translated;
      }
    }
  }

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
      return `${base} bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300`;
    case "awaiting_payment":
      return `${base} bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300`;
    case "ready_to_print":
      return `${base} bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300`;
    case "printing":
      return `${base} bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300`;
    case "post_processing":
      return `${base} bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300`;
    case "shipped":
      return `${base} bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300`;
    case "on_hold":
      return `${base} bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300`;
    case "cancelled":
      return `${base} bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300`;
    case "returned":
      return `${base} bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200`;
    default:
      return `${base} bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300`;
  }
}

export function getOrderStatusBadgeClass(status: string): string {
  const normalized = normalizeOrderStatus(status);

  switch (normalized) {
    case "quote_requested":
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800/60";
    case "awaiting_payment":
      return "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-800/60";
    case "ready_to_print":
      return "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-800/60";
    case "printing":
      return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/60";
    case "post_processing":
      return "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800/60";
    case "shipped":
      return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/60";
    case "on_hold":
      return "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800/60";
    case "cancelled":
    case "returned":
      return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800/60";
    default:
      return "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-white/10";
  }
}

export function getOrderStatusTranslationKey(status: string): TranslationKey | null {
  const normalized = normalizeOrderStatus(status);
  return normalized ? (`orderStatus.${normalized}` as TranslationKey) : null;
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
