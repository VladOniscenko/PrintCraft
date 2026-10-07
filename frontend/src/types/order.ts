export interface Order {
  id: string;
  userId?: string | null;
  status:
    | "pending_quote"
    | "quoted"
    | "expired_quote"
    | "pending_payment"
    | "printing"
    | "completed"
    | "shipped"
    | "sent"
    | "delivered"
    | "paid"
    | "failed"
    | "cancelled";
  orderType: "quote" | "online";
  paymentFlow?: "bank_transfer";
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  phoneNumber: string;
  deliveryPrice?: number;
  serviceFeePrice?: number;
  orderDiscountAmount?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  finalTotalAmount?: number;
  quotedPrice?: number;
  quoteMessage?: string;
  quoteConfirmedAt?: string;
  quoteExpiresAt?: string;
  trackingCode?: string;
  trackingUrl?: string;
  internalNotes?: string;
  customerNotes?: string;
  bankTransferDetails?: {
    accountName?: string | null;
    iban?: string | null;
    bic?: string | null;
  } | null;
  notes?: OrderNote[];
  isPaid?: boolean;
  updatedAt?: string;
  createdAt: string;
  items: OrderItem[];
  payments?: PaymentAttempt[];
}

export interface OrderNote {
  id: string;
  orderId?: string;
  content: string;
  visibility: "internal" | "customer";
  createdBy?: string;
  createdAt: string;
}

export interface PaymentAttempt {
  id: string;
  orderId: string;
  provider: string;
  reference: string;
  providerPaymentId?: string;
  currency: string;
  amount: number;
  status: string;
  checkoutUrl?: string;
  method?: string;
  failureReason?: string;
  paidAt?: string;
  canceledAt?: string;
  expiredAt?: string;
  failedAt?: string;
  lastWebhookAt?: string;
  webhookAttemptCount?: number;
  lastWebhookPayloadHash?: string;
  lastWebhookError?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  imageUrl: string;
  fileUrl?: string;
  fileName: string;
  files?: QuoteItemFile[];
  attachments?: QuoteItemFile[];
  notes?: string;
  size?: string;
  dimensionX?: number;
  dimensionY?: number;
  dimensionZ?: number;
  dimensionBaseX?: number;
  dimensionBaseY?: number;
  dimensionBaseZ?: number;
  dimensionScale?: number;
  material: string;
  color: string;
  price: number;
  count: number;
  estimatedPrintTime?: string;
  filamentUsedGrams?: number;
  scaleFactor?: number;
  infillPercent?: number;
  printQuality?: string;
  supportsNeeded?: boolean;
}

export interface QuoteItemFile {
  url: string;
  name: string;
  kind?: "model" | "image" | "other";
}
