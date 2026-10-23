import { PauseCircle, PlayCircle, XCircle, AlertTriangle } from "lucide-react";
import type { StatusPanelProps } from "../types";
import { useI18n } from "../../../i18n/I18nContext";

export default function OnHoldPanel({
  order,
  onStatusTransition,
  isProcessing,
}: StatusPanelProps) {
  const { t } = useI18n();

  const handleResume = async () => {
    // If order was paid, return to ReadyToPrint; otherwise QuoteRequested
    const resumeStatus = order.isPaid ? "ready_to_print" : "quote_requested";
    await onStatusTransition(resumeStatus);
  };

  const handleCancel = async () => {
    if (window.confirm(t("admin.orderDetail.panels.onHold.confirmCancel"))) {
      await onStatusTransition("cancelled");
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300">
            <PauseCircle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 uppercase tracking-wide">
                {t("admin.orderDetail.panels.onHold.badge")}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t("admin.orderDetail.panels.onHold.title")}
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300 mt-1">
              {t("admin.orderDetail.panels.onHold.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-white dark:bg-[#141e1a] hover:bg-rose-50 dark:hover:bg-white/10 border border-rose-200 dark:border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <XCircle size={14} />
            <span>{t("admin.orderDetail.panels.onHold.cancelOrder")}</span>
          </button>

          <button
            type="button"
            onClick={handleResume}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <PlayCircle size={15} />
            <span>{isProcessing ? t("admin.orderDetail.panels.onHold.resuming") : t("admin.orderDetail.panels.onHold.resumeOrder")}</span>
          </button>
        </div>
      </div>

      {/* Admin Hold Reason Card */}
      <div className="bg-white dark:bg-[#0e1512] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-white/10 flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400" />
          <span>{t("admin.orderDetail.panels.onHold.reasonHeading")}</span>
        </h3>

        <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-150 dark:border-orange-800/40 text-xs">
          <p className="text-slate-800 dark:text-gray-200 font-medium whitespace-pre-wrap leading-relaxed">
            {order.holdReason ||
              t("admin.orderDetail.panels.onHold.noReasonProvided")}
          </p>
        </div>
      </div>
    </div>
  );
}
