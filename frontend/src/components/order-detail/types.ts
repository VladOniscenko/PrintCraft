import type { Order } from "../../types";
import type { TranslationKey } from "../../i18n/translations";

export type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;


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
  onRefresh?: () => void | Promise<void>;
  onManualPaymentNotification?: () => void;
  manualPaymentNotificationDisabled?: boolean;
}
