import {
  CheckCircle2,
  XCircle,
  Truck,
  Printer,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import type { StatusPanelProps } from "../types";
import { formatCurrencyAmount } from "../../../utils/currency";
import { normalizeOrderStatus } from "../../../utils/orderStatus";
import { useI18n } from "../../../i18n/I18nContext";

export default function ShippedCancelledPanel({
  order,
}: StatusPanelProps) {
  const { t } = useI18n();
  const normStatus = normalizeOrderStatus(order.status);
  const isShipped = normStatus === "shipped";
  const isCancelled = normStatus === "cancelled";

  const finalizedTotal = order.quotedPrice ?? order.finalTotalAmount;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className={`rounded-xl p-5 border flex flex-wrap items-center justify-between gap-4 ${
          isShipped
            ? "bg-emerald-50 border-emerald-200"
            : isCancelled
            ? "bg-rose-50 border-rose-200"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isShipped
                ? "bg-emerald-100 text-emerald-700"
                : isCancelled
                ? "bg-rose-100 text-rose-700"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {isShipped ? (
              <CheckCircle2 size={24} />
            ) : isCancelled ? (
              <XCircle size={24} />
            ) : (
              <RotateCcw size={24} />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isShipped
                ? t("admin.orderDetail.panels.shippedCancelled.shippedTitle")
                : isCancelled
                ? t("admin.orderDetail.panels.shippedCancelled.cancelledTitle")
                : t("admin.orderDetail.panels.shippedCancelled.returnedTitle")}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isShipped
                ? t("admin.orderDetail.panels.shippedCancelled.shippedSubtitle")
                : isCancelled
                ? t("admin.orderDetail.panels.shippedCancelled.cancelledSubtitle")
                : t("admin.orderDetail.panels.shippedCancelled.returnedSubtitle")}
            </p>
          </div>
        </div>

        {order.flaggedForRefundReview && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle size={14} />
            <span>{t("admin.orderDetail.panels.shippedCancelled.refundReviewTitle")}</span>
          </span>
        )}
      </div>

      {/* Read-Only Finalized Costs Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <CreditCard size={16} className="text-emerald-600" />
          <span>{t("admin.orderDetail.panels.shippedCancelled.summaryTitle")}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-500 block mb-0.5">{t("admin.orderDetail.panels.shippedCancelled.subtotal")}</span>
            <strong className="text-sm font-mono text-slate-900">
              {formatCurrencyAmount(order.subtotalAmount)}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-500 block mb-0.5">{t("admin.orderDetail.panels.shippedCancelled.setupFee")}</span>
            <strong className="text-sm font-mono text-slate-900">
              +{formatCurrencyAmount(order.serviceFeePrice)}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-slate-500 block mb-0.5">{t("admin.orderDetail.panels.shippedCancelled.deliveryFee")}</span>
            <strong className="text-sm font-mono text-slate-900">
              +{formatCurrencyAmount(order.deliveryPrice)}
            </strong>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-700 block mb-0.5 font-medium">
              {order.isPaid
                ? t("admin.orderDetail.panels.shippedCancelled.totalPaid")
                : t("admin.orderDetail.panels.shippedCancelled.totalFinalized")}
            </span>
            <strong className="text-base font-mono text-emerald-900">
              {formatCurrencyAmount(finalizedTotal)}
            </strong>
          </div>
        </div>

        {order.orderDiscountAmount > 0 && (
          <p className="text-xs text-emerald-700">
            {t("admin.orderDetail.panels.shippedCancelled.orderDiscountApplied")}{formatCurrencyAmount(order.orderDiscountAmount)}
          </p>
        )}
      </div>

      {/* Read-Only Hardware & Production Assignment */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Printer size={16} className="text-teal-600" />
          <span>{t("admin.orderDetail.panels.shippedCancelled.productionRecord")}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-slate-400 block mb-1">{t("admin.orderDetail.panels.shippedCancelled.assignedPrinter")}</span>
            <strong className="text-sm text-slate-800">
              {order.assignedPrinter || t("admin.orderDetail.panels.shippedCancelled.notAssigned")}
            </strong>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-slate-400 block mb-1">{t("admin.orderDetail.panels.shippedCancelled.loadedMaterial")}</span>
            <strong className="text-sm text-slate-800">
              {order.assignedMaterial || t("admin.orderDetail.panels.shippedCancelled.notAssigned")}
            </strong>
          </div>
        </div>
      </div>

      {/* Read-Only Shipping & Tracking Details */}
      {(order.trackingCode || order.trackingUrl || isShipped) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Truck size={16} className="text-purple-600" />
            <span>{t("admin.orderDetail.panels.shippedCancelled.fulfillmentDetails")}</span>
          </h3>

          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-150 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-purple-700 font-semibold block mb-1">
                {t("admin.orderDetail.panels.shippedCancelled.trackingNumber")}
              </span>
              <strong className="text-sm font-mono text-slate-900">
                {order.trackingCode || "N/A"}
              </strong>
            </div>

            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-white border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                <span>{t("admin.orderDetail.panels.shippedCancelled.trackPackage")}</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
