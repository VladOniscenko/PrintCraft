import type {
  OrderDetailsDto,
  AdminOrderItem,
  OrderFileAsset,
  OrderTimelineEvent,
  OrderStatusHistoryEntry,
  OrderCommunication,
  OrderNote,
  PaymentAttempt,
} from "../../types/order";

export type {
  OrderDetailsDto,
  AdminOrderItem,
  OrderFileAsset,
  OrderTimelineEvent,
  OrderStatusHistoryEntry,
  OrderCommunication,
  OrderNote,
  PaymentAttempt,
};

export interface StatusTransitionPayload {
  targetStatus: string;
  holdReason?: string;
  assignedPrinter?: string;
  assignedMaterial?: string;
  gCodeFinalized?: boolean;
  qualityCheckPassed?: boolean;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface StatusPanelProps {
  order: OrderDetailsDto;
  onRefresh: () => Promise<void>;
  onStatusTransition: (
    targetStatus: string,
    payload?: Partial<StatusTransitionPayload>,
  ) => Promise<void>;
  isProcessing: boolean;
}
