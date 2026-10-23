import { useState } from "react";
import {
  CreditCard,
  CheckCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import type { StatusPanelProps } from "../types";
import { formatCurrencyAmount } from "../../../utils/currency";
import api from "../../../services/api";
import { useNotify } from "../../../context/NotifyContext";
import { useI18n } from "../../../i18n/I18nContext";

export default function AwaitingPaymentPanel({
  order,
  onRefresh,
  onStatusTransition,
}: StatusPanelProps) {
  const { notifySuccess, notifyError } = useNotify();
  const { t } = useI18n();
  const [markingPaid, setMarkingPaid] = useState(false);

  const handleMarkAsPaid = async () => {
    if (
      !window.confirm(
        t("admin.orderDetail.panels.awaitingPayment.confirmPaymentPrompt"),
      )
    ) {
      return;
    }

    setMarkingPaid(true);
    try {
      await api.put(`/admin/orders/${order.id}/paid`);
      notifySuccess(t("admin.orderDetail.panels.awaitingPayment.paymentConfirmedSuccess"));
      await onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to mark order as paid";
      notifyError(errMsg);
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleRollbackToQuote = async () => {
    if (
      window.confirm(
        t("admin.orderDetail.panels.awaitingPayment.confirmRevisePrompt"),
      )
    ) {
      await onStatusTransition("quote_requested");
    }
  };

  const quotedTotal = order.quotedPrice ?? order.finalTotalAmount;
  const quoteExpiresDate = order.quoteExpiresAt
    ? new Date(order.quoteExpiresAt).toLocaleDateString()
    : null;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-200 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 uppercase tracking-wide">
              {t("admin.orderDetail.panels.awaitingPayment.badge")}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t("admin.orderDetail.panels.awaitingPayment.title")}
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-gray-300 mt-1">
            {t("admin.orderDetail.panels.awaitingPayment.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRollbackToQuote}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-gray-200 bg-white dark:bg-[#141e1a] hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-300 dark:border-white/15 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>{t("admin.orderDetail.panels.awaitingPayment.reviseQuote")}</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAsPaid}
            disabled={markingPaid}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle size={14} />
            <span>
              {markingPaid
                ? t("admin.orderDetail.panels.awaitingPayment.confirmingPayment")
                : t("admin.orderDetail.panels.awaitingPayment.confirmPaymentMarkAsPaid")}
            </span>
          </button>
        </div>
      </div>

      {/* Quoted Pricing Summary */}
      <div className="bg-white dark:bg-[#0e1512] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-2">
          <CreditCard size={16} className="text-sky-600 dark:text-sky-400" />
          <span>{t("admin.orderDetail.panels.awaitingPayment.financialBreakdown")}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <span className="text-slate-500 dark:text-gray-400 block mb-0.5">{t("admin.orderDetail.panels.awaitingPayment.subtotal")}</span>
            <strong className="text-sm font-mono text-slate-900 dark:text-white">
              {formatCurrencyAmount(order.subtotalAmount)}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <span className="text-slate-500 dark:text-gray-400 block mb-0.5">{t("admin.orderDetail.panels.awaitingPayment.setupFee")}</span>
            <strong className="text-sm font-mono text-slate-900 dark:text-white">
              +{formatCurrencyAmount(order.serviceFeePrice)}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
            <span className="text-slate-500 dark:text-gray-400 block mb-0.5">{t("admin.orderDetail.panels.awaitingPayment.deliveryFee")}</span>
            <strong className="text-sm font-mono text-slate-900 dark:text-white">
              +{formatCurrencyAmount(order.deliveryPrice)}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50">
            <span className="text-sky-700 dark:text-sky-300 block mb-0.5 font-medium">{t("admin.orderDetail.panels.awaitingPayment.finalQuotedTotal")}</span>
            <strong className="text-base font-mono text-sky-900 dark:text-sky-100">
              {formatCurrencyAmount(quotedTotal)}
            </strong>
          </div>
        </div>

        {quoteExpiresDate && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 pt-2">
            <Clock size={13} className="text-slate-400 dark:text-gray-400" />
            <span>{t("admin.orderDetail.panels.awaitingPayment.validityExpires")} <strong className="text-slate-800 dark:text-gray-200">{quoteExpiresDate}</strong></span>
          </div>
        )}

        {order.quoteMessage && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs">
            <span className="font-semibold text-slate-700 dark:text-gray-200 block mb-1">
              {t("admin.orderDetail.panels.awaitingPayment.adminMessageSent")}
            </span>
            <p className="text-slate-600 dark:text-gray-300 italic whitespace-pre-wrap">
              "{order.quoteMessage}"
            </p>
          </div>
        )}
      </div>

      {/* Payment Attempts & Transactions */}
      <div className="bg-white dark:bg-[#0e1512] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard size={15} className="text-teal-600 dark:text-teal-400" />
            <span>{t("admin.orderDetail.panels.awaitingPayment.paymentAttempts", { count: order.payments?.length || 0 })}</span>
          </span>
          <span className="text-xs text-slate-500 dark:text-gray-400">
            {t("admin.orderDetail.panels.awaitingPayment.flow")}{" "}
            <strong className="text-slate-800 dark:text-gray-200">{order.paymentFlow || t("admin.orderDetail.panels.awaitingPayment.bankTransfer")}</strong>
          </span>
        </h3>

        {(!order.payments || order.payments.length === 0) ? (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-white/5">
            <Clock className="mx-auto text-slate-400 dark:text-gray-500 mb-1" size={24} />
            <p className="text-xs text-slate-500 dark:text-gray-400">{t("admin.orderDetail.panels.awaitingPayment.noTransactions")}</p>
            <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">
              {t("admin.orderDetail.panels.awaitingPayment.bankTransferHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {order.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs"
              >
                <div>
                  <span className="font-medium text-slate-800 dark:text-gray-200">{p.provider || t("admin.orderDetail.panels.awaitingPayment.bankTransfer")}</span>
                  <p className="text-[11px] text-slate-400 dark:text-gray-500 font-mono">{t("admin.orderDetail.panels.awaitingPayment.ref")} {p.reference}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrencyAmount(p.amount)}
                  </span>
                  <span
                    className={`block text-[10px] uppercase font-semibold mt-0.5 ${
                      p.status === "paid" ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
