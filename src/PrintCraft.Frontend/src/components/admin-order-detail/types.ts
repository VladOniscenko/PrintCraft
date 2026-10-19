import type {
  OrderDetailsDto,
  AdminOrderItem,
  OrderFileAsset,
  OrderTimelineEvent,
  OrderStatusHistoryEntry,
  OrderCommunication,
  OrderNote,
  PaymentAttempt,
  OrderItemChangeRequestDto,
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
  OrderItemChangeRequestDto,
};

export interface StatusTransitionPayload {
  targetStatus: string;
  holdReason?: string;
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
