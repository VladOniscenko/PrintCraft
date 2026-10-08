import {
  PauseCircle,
  PlayCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { StatusPanelProps } from "../types";

export default function OnHoldPanel({
  order,
  onStatusTransition,
  isProcessing,
}: StatusPanelProps) {
  const handleResume = async () => {
    // If order was paid, return to ReadyToPrint; otherwise QuoteRequested
    const resumeStatus = order.isPaid ? "ready_to_print" : "quote_requested";
    await onStatusTransition(resumeStatus);
  };

  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      await onStatusTransition("cancelled");
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
            <PauseCircle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-200 text-orange-900 uppercase tracking-wide">
                Order Paused
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Order is On Hold
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Production or quoting for this order has been temporarily paused.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <XCircle size={14} />
            <span>Cancel Order</span>
          </button>

          <button
            type="button"
            onClick={handleResume}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <PlayCircle size={15} />
            <span>{isProcessing ? "Resuming..." : "Resume Order"}</span>
          </button>
        </div>
      </div>

      {/* Admin Hold Reason Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-600" />
          <span>Admin Reason for Hold</span>
        </h3>

        <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-150 text-xs">
          <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
            {order.holdReason || "No specific reason provided by administrator."}
          </p>
        </div>
      </div>
    </div>
  );
}

