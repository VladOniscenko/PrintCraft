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
  unitPrice?: number;
  count: number;
  plateCost?: number;
  estimatedPrintTime?: string;
  filamentUsedGrams?: number;
  scaleFactor?: number;
  infillPercent?: number;
  printQuality?: string;
  supportsNeeded?: boolean;
  uploadType?: "native-3d" | "filament-painting";
  layerSwaps?: import("./filamentPainting").LayerSwapInstruction[];
  palettePresetId?: string;
}

export interface QuoteItemFile {
  url: string;
  name: string;
  kind?: "model" | "image" | "other";
}

export interface OrderCustomerDetails {
  userId?: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  postalCode: string;
}

export interface OrderFileAsset {
  id: string;
  itemId?: string | null;
  fileName: string;
  fileUrl: string;
  downloadUrl: string;
  kind: "model" | "image" | "other";
  extension: string;
  is3DModel: boolean;
  size?: string | null;
  material?: string | null;
  color?: string | null;
}

export interface OrderTimelineEvent {
  id: string;
  type: "status_change" | "email" | "note";
  timestamp: string;
  title: string;
  content?: string | null;
  author?: string | null;
  visibility: "system" | "customer" | "internal";
  metadata?: Record<string, string | null | undefined>;
}

export interface AdminOrderItem {
  id: string;
  orderId: string;
  fileUrl?: string | null;
  imageUrl?: string | null;
  fileName?: string | null;
  notes?: string | null;
  size?: string | null;
  material: string;
  color: string;
  count: number;
  price: number;
  unitPrice: number;
  plateCost: number;
  estimatedPrintTime?: string | null;
  filamentUsedGrams?: number | null;
  scaleFactor: number;
  infillPercent: number;
  printQuality: string;
  supportsNeeded: boolean;
  attachments?: Array<{
    id: string;
    orderItemId: string;
    url: string;
    fileName: string;
    kind: string;
  }>;
  files?: OrderFileAsset[];
}

export interface OrderStatusHistoryEntry {
  id: string;
  orderId?: string;
  previousStatus?: string | null;
  newStatus: string;
  changedAt: string;
  changedBy?: string | null;
  note?: string | null;
}

export interface OrderCommunication {
  id: string;
  orderId?: string;
  channel: string;
  communicationType: string;
  subject: string;
  recipientEmail: string;
  sentAt: string;
}

export interface OrderDetailsDto {
  id: string;
  status: string;
  normalizedStatus: string;
  isPaid: boolean;
  holdReason?: string | null;
  flaggedForRefundReview?: boolean;
  assignedPrinter?: string | null;
  assignedMaterial?: string | null;
  gCodeFinalized?: boolean;
  allowedTransitions: string[];
  customer: OrderCustomerDetails;
  fullName: string;
  customerEmail: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  postalCode: string;
  items: AdminOrderItem[];
  files: OrderFileAsset[];
  orderType: string;
  paymentFlow: string;
  deliveryPrice: number;
  serviceFeePrice: number;
  orderDiscountAmount: number;
  quotedPrice?: number | null;
  subtotalAmount: number;
  discountAmount: number;
  finalTotalAmount: number;
  quoteMessage?: string | null;
  quoteConfirmedAt?: string | null;
  quoteExpiresAt?: string | null;
  internalNotes?: string | null;
  customerNotes?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  timeline: OrderTimelineEvent[];
  payments: PaymentAttempt[];
  notes: OrderNote[];
  statusHistory: OrderStatusHistoryEntry[];
  communications: OrderCommunication[];
  createdAt: string;
  updatedAt: string;
}

