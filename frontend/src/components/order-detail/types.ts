import type { Order } from "../../types";

export type TranslateFn = (key: string) => string;

export type ShippingField =
  | "fullName"
  | "phoneNumber"
  | "addressLine1"
  | "city"
  | "postalCode";

export interface ShippingDetails {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  city: string;
  postalCode: string;
}

export interface SavedAddressOption {
  id: string;
  label?: string | null;
  isDefault: boolean;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  postalCode: string;
}

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
