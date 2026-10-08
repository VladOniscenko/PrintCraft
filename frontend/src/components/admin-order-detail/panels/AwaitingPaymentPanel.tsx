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

export default function AwaitingPaymentPanel({
  order,
  onRefresh,
  onStatusTransition,
}: StatusPanelProps) {
  const { notifySuccess, notifyError } = useNotify();
  const [markingPaid, setMarkingPaid] = useState(false);

  const handleMarkAsPaid = async () => {
    if (
      !window.confirm(
        "Confirm that payment has been received in full? This will advance the order to 'Ready to Print'.",
      )
    ) {
      return;
    }

    setMarkingPaid(true);
    try {
      await api.put(`/admin/orders/${order.id}/paid`);
      notifySuccess("Payment confirmed! Order moved to Ready to Print.");
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
        "Re-open quote for adjustments? This will return the order to 'Quote Requested' status.",
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
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-200 text-sky-900 uppercase tracking-wide">
              Awaiting Customer Payment
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Quote Sent & Pending Payment
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            The quote has been confirmed and communicated to the customer. Once payment is confirmed, advance to production.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRollbackToQuote}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Revise Quote</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAsPaid}
            disabled={markingPaid}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle size={14} />
            <span>{markingPaid ? "Confirming..." : "Confirm Payment Received (Mark as Paid)"}</span>
          </button>
        </div>
      </div>

      {/* Quoted Pricing Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <CreditCard size={16} className="text-sky-600" />
          <span>Quoted Financial Breakdown</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-500 block mb-0.5">Subtotal</span>
            <strong className="text-sm font-mono text-slate-900">
              {formatCurrencyAmount(order.subtotalAmount)}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-500 block mb-0.5">Setup Fee</span>
            <strong className="text-sm font-mono text-slate-900">
              +{formatCurrencyAmount(order.serviceFeePrice)}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-500 block mb-0.5">Delivery Fee</span>
            <strong className="text-sm font-mono text-slate-900">
              +{formatCurrencyAmount(order.deliveryPrice)}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
            <span className="text-sky-700 block mb-0.5 font-medium">Final Quoted Total</span>
            <strong className="text-base font-mono text-sky-900">
              {formatCurrencyAmount(quotedTotal)}
            </strong>
          </div>
        </div>

        {quoteExpiresDate && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
            <Clock size={13} className="text-slate-400" />
            <span>Quote Validity Expires: <strong>{quoteExpiresDate}</strong></span>
          </div>
        )}

        {order.quoteMessage && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="font-semibold text-slate-700 block mb-1">
              Admin Quote Review Message Sent to Customer:
            </span>
            <p className="text-slate-600 italic whitespace-pre-wrap">
              "{order.quoteMessage}"
            </p>
          </div>
        )}
      </div>

      {/* Payment Attempts & Transactions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard size={15} className="text-teal-600" />
            <span>Payment Attempts ({order.payments?.length || 0})</span>
          </span>
          <span className="text-xs text-slate-500">
            Flow: <strong>{order.paymentFlow || "Bank Transfer"}</strong>
          </span>
        </h3>

        {(!order.payments || order.payments.length === 0) ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Clock className="mx-auto text-slate-400 mb-1" size={24} />
            <p className="text-xs text-slate-500">No payment transaction records received yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click "Confirm Payment Received" when manual bank transfer lands in the business account.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {order.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs"
              >
                <div>
                  <span className="font-medium text-slate-800">{p.provider || "Bank Transfer"}</span>
                  <p className="text-[11px] text-slate-400 font-mono">Ref: {p.reference}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrencyAmount(p.amount)}
                  </span>
                  <span
                    className={`block text-[10px] uppercase font-semibold mt-0.5 ${
                      p.status === "paid" ? "text-emerald-700" : "text-amber-700"
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
