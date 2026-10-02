import {
  Calendar,
  Landmark,
  MapPin,
  Phone,
  Tag,
  Truck,
  User,
  Receipt,
} from "lucide-react";
import type { OrderSectionProps, PriceSummary } from "./types";
import { normalizePaymentFlow } from "../../utils/orderStatus";

interface OrderSidebarProps extends OrderSectionProps {
  priceSummary: PriceSummary;
  statusLabel: string;
}

export default function OrderSidebar({
  order,
  priceSummary,
  statusLabel,
  t,
  onManualPaymentNotification,
  manualPaymentNotificationDisabled,
}: OrderSidebarProps) {
  const normalizedPaymentFlow = normalizePaymentFlow(order.paymentFlow);
  const bankTransferDetails = order.bankTransferDetails;
  const hasBankTransferDetails =
    !!bankTransferDetails?.accountName ||
    !!bankTransferDetails?.iban ||
    !!bankTransferDetails?.bic;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h4 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-2">
          <Calendar size={16} className="text-emerald-600" />{" "}
          {t("orderDetail.referenceId")}
        </h4>
        <p className="text-[10px] font-mono text-gray-400 break-all">
          {order.id}
        </p>
      </div>

      <div className="bg-[#133827] text-white rounded-2xl p-8 shadow-lg">
        <h3 className="font-bold mb-6 flex items-center gap-2 text-emerald-400">
          <MapPin size={20} />
          {t("orderDetail.shippingDetails")}
        </h3>
        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            <User size={16} className="text-emerald-500 shrink-0" />
            <p className="font-bold">{order.fullName}</p>
          </div>

          <div className="flex gap-3">
            <Phone size={16} className="text-emerald-500 shrink-0" />
            <p className="text-emerald-50/80">
              {order.phoneNumber || t("orderDetail.noPhone")}
            </p>
          </div>

          <div className="flex gap-3">
            <MapPin size={16} className="text-emerald-500 shrink-0" />
            <div className="text-emerald-50/80">
              {order.addressLine1 && order.city && order.postalCode ? (
                <>
                  <p>{order.addressLine1}</p>
                  <p>
                    {order.city}, {order.postalCode}
                  </p>
                </>
              ) : (
                <p>{t("orderDetail.pending")}</p>
              )}
            </div>
          </div>

          <div className="pt-6 mt-2 border-t border-white/10 space-y-3">
            <div className="flex justify-between items-center text-emerald-100/70">
              <span>{t("orderDetail.subtotal")}</span>
              <span>
                {!priceSummary.isPendingQuote &&
                priceSummary.subtotalPrice != null
                  ? `€${priceSummary.subtotalPrice.toFixed(2)}`
                  : t("orderDetail.toBeCalculated")}
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-100/70">
              <span className="flex items-center gap-2">
                <Truck size={14} /> {t("orderDetail.delivery")}
              </span>
              <span>
                {!priceSummary.isPendingQuote && priceSummary.deliveryPrice > 0
                  ? `€${priceSummary.deliveryPrice.toFixed(2)}`
                  : t("orderDetail.toBeCalculated")}
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-100/70">
              <span className="flex items-center gap-2">
                <Receipt size={14} /> {t("orderDetail.serviceFee")}
              </span>
              <span>
                {!priceSummary.isPendingQuote &&
                priceSummary.serviceFeePrice > 0
                  ? `€${priceSummary.serviceFeePrice.toFixed(2)}`
                  : t("orderDetail.toBeCalculated")}
              </span>
            </div>

            {!priceSummary.isPendingQuote && priceSummary.orderDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-200">
                <span className="flex items-center gap-2">
                  <Tag size={14} /> {t("orderDetail.discount")}
                </span>
                <span>-€{priceSummary.orderDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xl font-bold text-white pt-2">
              <span className="flex items-center gap-2">
                <Tag size={18} className="text-emerald-400" />{" "}
                {t("orderDetail.total")}
              </span>
              <span className="text-emerald-400">
                {priceSummary.displayTotal > 0
                  ? `€${priceSummary.displayTotal.toFixed(2)}`
                  : t("orderDetail.pendingQuote")}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p className="text-emerald-100/40 text-xs uppercase font-bold tracking-widest mb-1">
              {t("orderDetail.status")}
            </p>
            <p className="text-xl font-bold text-emerald-400 uppercase tracking-tight">
              {statusLabel}
            </p>
          </div>
        </div>
      </div>

      {normalizedPaymentFlow === "bank_transfer" &&
        (order.status === "quoted" || order.status === "pending_payment") &&
        !order.isPaid && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h4 className="font-bold text-sm text-amber-900 mb-3 flex items-center gap-2">
              <Landmark size={16} className="text-amber-700" />
              {t("orderDetail.bankTransferTitle")}
            </h4>
            <p className="text-sm text-amber-900/80">
              {t("orderDetail.bankTransferInstructions")}
            </p>

            {hasBankTransferDetails ? (
              <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-white/70 p-4 text-sm text-amber-950">
                {bankTransferDetails?.accountName ? (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-amber-700 font-semibold">
                      {t("orderDetail.bankTransferAccountName")}
                    </span>
                    <span className="text-right font-medium">
                      {bankTransferDetails.accountName}
                    </span>
                  </div>
                ) : null}

                {bankTransferDetails?.iban ? (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-amber-700 font-semibold">
                      {t("orderDetail.bankTransferIban")}
                    </span>
                    <span className="text-right font-mono text-xs break-all">
                      {bankTransferDetails.iban}
                    </span>
                  </div>
                ) : null}

                {bankTransferDetails?.bic ? (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-amber-700 font-semibold">
                      {t("orderDetail.bankTransferBic")}
                    </span>
                    <span className="text-right font-mono text-xs break-all">
                      {bankTransferDetails.bic}
                    </span>
                  </div>
                ) : null}

                {order.payments?.find(
                  (payment) => payment.provider === "bank_transfer",
                )?.reference ? (
                  <div className="flex items-start justify-between gap-4 pt-2 border-t border-amber-100">
                    <span className="text-amber-700 font-semibold">
                      {t("orderDetail.bankTransferReference")}
                    </span>
                    <span className="text-right font-mono text-xs break-all">
                      {
                        order.payments?.find(
                          (payment) => payment.provider === "bank_transfer",
                        )?.reference
                      }
                    </span>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-amber-200 bg-white/60 p-4 text-sm text-amber-800">
                {t("orderDetail.bankTransferMissingDetails")}
              </p>
            )}
            <p className="mt-4 text-sm text-amber-900/80">
              {t("orderDetail.bankTransferNotice")}
            </p>
            {onManualPaymentNotification && (
              <button
                type="button"
                onClick={onManualPaymentNotification}
                disabled={manualPaymentNotificationDisabled}
                className="mt-3 rounded-lg bg-amber-700 px-3 py-2 text-xs font-bold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {manualPaymentNotificationDisabled
                  ? t("orderDetail.manualPaymentNotificationCooldown")
                  : t("orderDetail.manualPaymentNotificationButton")}
              </button>
            )}
          </div>
        )}

      {(order.trackingCode || order.trackingUrl) && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-sky-950">
            <Truck size={16} className="text-sky-700" />
            {t("orderDetail.trackingTitle")}
          </h4>
          {order.trackingCode && (
            <p className="text-sm text-sky-950">
              <span className="font-semibold">
                {t("orderDetail.trackingCode")}:
              </span>{" "}
              <span className="font-mono">{order.trackingCode}</span>
            </p>
          )}
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-bold text-sky-800 underline"
            >
              {t("orderDetail.openTracking")}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
