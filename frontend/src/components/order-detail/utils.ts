import type { Order } from "../../types";
import type { PriceSummary, StatusSummary, TranslateFn } from "./types";
import {
  formatOrderStatusLabel,
  getOrderStatusTimelineStep,
  getOrderStatusTranslationKey,
  normalizeOrderStatus,
} from "../../utils/orderStatus";

export function buildPriceSummary(order: Order): PriceSummary {
  const hasMissingPrice = order.items.some(
    (item) => item.price == null || item.price <= 0,
  );

  const normalizedStatus = normalizeOrderStatus(order.status);
  const isPendingQuote =
    normalizedStatus === "quote_requested" ||
    normalizedStatus === "pending_quote" ||
    normalizedStatus === "pending";
  const fallbackSubtotal = hasMissingPrice
    ? null
    : order.items.reduce((sum, item) => {
        const unit =
          item.unitPrice !== undefined && item.unitPrice > 0
            ? item.unitPrice
            : item.price || 0;
        const plate = item.plateCost ?? 2.0;
        return sum + unit * (item.count || 1) + plate;
      }, 0);

  const subtotalPrice =
    order.subtotalAmount != null ? order.subtotalAmount : fallbackSubtotal;
  const orderDiscount = Math.max(
    order.discountAmount ?? order.orderDiscountAmount ?? 0,
    0,
  );
  const deliveryPrice = Math.max(order.deliveryPrice ?? 0, 0);
  const serviceFeePrice = Math.max(order.serviceFeePrice ?? 0, 0);

  const calculatedTotal =
    subtotalPrice == null
      ? null
      : Math.max(subtotalPrice + deliveryPrice - orderDiscount, 0);

  const finalTotal =
    order.finalTotalAmount != null
      ? Math.max(order.finalTotalAmount, 0)
      : calculatedTotal;

  const displayTotal = isPendingQuote
    ? 0
    : finalTotal != null
      ? finalTotal
      : order.quotedPrice && order.quotedPrice > 0
        ? order.quotedPrice
        : 0;

  return {
    isPendingQuote,
    subtotalPrice,
    deliveryPrice,
    serviceFeePrice,
    orderDiscount,
    displayTotal,
  };
}

export function buildStatusSummary(
  order: Order,
  t: TranslateFn,
): StatusSummary {
  const normalized = normalizeOrderStatus(order.status);
  const translationKey =
    getOrderStatusTranslationKey(normalized) ||
    getOrderStatusTranslationKey(order.status);
  const label = translationKey
    ? t(translationKey)
    : formatOrderStatusLabel(order.status);

  const step = getOrderStatusTimelineStep(order.status);

  return { label, step };
}

export function getReachedDate(order: Order): string {
  return new Date(order.updatedAt || order.createdAt).toLocaleDateString();
}
