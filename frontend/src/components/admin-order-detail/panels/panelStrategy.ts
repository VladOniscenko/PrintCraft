import React from "react";
import type { StatusPanelProps } from "../types";
import { normalizeOrderStatus } from "../../../utils/orderStatus";

import QuoteRequestedPanel from "./QuoteRequestedPanel";
import AwaitingPaymentPanel from "./AwaitingPaymentPanel";
import ReadyToPrintPanel from "./ReadyToPrintPanel";
import PrintingPanel from "./PrintingPanel";
import PostProcessingPanel from "./PostProcessingPanel";
import ShippedCancelledPanel from "./ShippedCancelledPanel";
import OnHoldPanel from "./OnHoldPanel";

/**
 * Strategy Registry mapping OrderStatusStateMachine canonical status values
 * to dedicated UI panel components.
 */
export const STATUS_PANEL_STRATEGY: Record<
  string,
  React.ComponentType<StatusPanelProps>
> = {
  quote_requested: QuoteRequestedPanel,
  awaiting_payment: AwaitingPaymentPanel,
  ready_to_print: ReadyToPrintPanel,
  printing: PrintingPanel,
  post_processing: PostProcessingPanel,
  shipped: ShippedCancelledPanel,
  cancelled: ShippedCancelledPanel,
  returned: ShippedCancelledPanel,
  on_hold: OnHoldPanel,
};

/**
 * Strategy selector resolving the appropriate UI panel for an order status.
 */
export function getStatusPanel(
  status?: string | null,
): React.ComponentType<StatusPanelProps> {
  const normalized = normalizeOrderStatus(status);
  return STATUS_PANEL_STRATEGY[normalized] || ShippedCancelledPanel;
}

