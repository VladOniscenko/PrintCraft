import type { Order } from "../../types";

export type TranslateFn = (key: string) => string;

export interface PriceSummary {
  isPendingQuote: boolean;
  subtotalPrice: number | null;
  deliveryPrice: number;
  serviceFeePrice: number;
  orderDiscount: number;
  displayTotal: number;
}

export interface StatusSummary {
  label: string;
  step: number;
}

export interface OrderSectionProps {
  order: Order;
  t: TranslateFn;
  onManualPaymentNotification?: () => void;
  manualPaymentNotificationDisabled?: boolean;
}
