import { useState } from "react";
import {
  Calendar,
  Landmark,
  MapPin,
  Phone,
  Tag,
  Truck,
  User,
  Receipt,
  HelpCircle,
} from "lucide-react";
import type { OrderSectionProps, PriceSummary } from "./types";
import { normalizeOrderStatus, normalizePaymentFlow } from "../../utils/orderStatus";
import ReportIssueModal from "../support/ReportIssueModal";

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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const normalizedPaymentFlow = normalizePaymentFlow(order.paymentFlow);
  const bankTransferDetails = order.bankTransferDetails;
  const hasBankTransferDetails =
    !!bankTransferDetails?.accountName ||
    !!bankTransferDetails?.iban ||
    !!bankTransferDetails?.bic;

  return (
    <div className="space-y-6">
      {/* Reference ID Card */}
      <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0e1512] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={14} className="text-emerald-700 dark:text-emerald-400" />
            {t("orderDetail.referenceId")}
          </span>
        </div>
        <div className="bg-[#fbfbfd] dark:bg-white/5 border border-gray-200/60 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 dark:text-gray-300 select-all break-all">
          {order.id}
        </div>
      </div>

      {/* Pricing & Order Summary Card */}
      <div className="rounded-3xl bg-[#133827] dark:bg-[#081810] dark:border dark:border-white/10 text-white p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
              <Tag size={16} />
            </div>
            <h3 className="font-semibold text-base text-white">
              {t("orderDetail.total")}
            </h3>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-200 border border-white/15 backdrop-blur-xs">
            {statusLabel}
          </span>
        </div>

        {/* Breakdown */}
        <div className="space-y-3 text-xs sm:text-sm">
          <div className="flex justify-between items-center text-emerald-100/70">
            <span>{t("orderDetail.subtotal")}</span>
            <span className="font-medium text-white/90">
              {!priceSummary.isPendingQuote &&
              priceSummary.subtotalPrice != null
                ? `€${priceSummary.subtotalPrice.toFixed(2)}`
                : t("orderDetail.toBeCalculated")}
            </span>
          </div>

          <div className="flex justify-between items-center text-emerald-100/70">
            <span className="flex items-center gap-2">
              <Truck size={14} className="text-emerald-400/80" /> {t("orderDetail.delivery")}
            </span>
            <span className="font-medium text-white/90">
              {!priceSummary.isPendingQuote && priceSummary.deliveryPrice > 0
                ? `€${priceSummary.deliveryPrice.toFixed(2)}`
                : t("orderDetail.toBeCalculated")}
            </span>
          </div>

          <div className="flex justify-between items-center text-emerald-100/70">
            <span className="flex items-center gap-2">
              <Receipt size={14} className="text-emerald-400/80" /> {t("orderDetail.serviceFee")}
            </span>
            <span className="font-medium text-white/90">
              {!priceSummary.isPendingQuote &&
              priceSummary.serviceFeePrice > 0
                ? `€${priceSummary.serviceFeePrice.toFixed(2)}`
                : t("orderDetail.toBeCalculated")}
            </span>
          </div>

          {!priceSummary.isPendingQuote && priceSummary.orderDiscount > 0 && (
            <div className="flex justify-between items-center text-emerald-300">
              <span className="flex items-center gap-2">
                <Tag size={14} /> {t("orderDetail.discount")}
              </span>
              <span className="font-semibold">-€{priceSummary.orderDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-lg sm:text-xl font-bold text-white pt-3 border-t border-white/10">
            <span className="flex items-center gap-2">
              <Tag size={17} className="text-emerald-400" />{" "}
              {t("orderDetail.total")}
            </span>
            <span className="text-emerald-300">
              {priceSummary.isPendingQuote
                ? t("orderDetail.toBeCalculated")
                : priceSummary.displayTotal > 0
                  ? `€${priceSummary.displayTotal.toFixed(2)}`
                  : t("orderDetail.toBeCalculated")}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Details Card */}
      <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0e1512] p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-white/10">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
            <MapPin size={16} />
          </div>
          <h3 className="font-semibold text-base text-gray-900 dark:text-white">
            {t("orderDetail.shippingDetails")}
          </h3>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <User size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
            <p className="font-medium text-gray-900 dark:text-white">{order.fullName}</p>
          </div>

          <div className="flex items-center gap-3">
            <Phone size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
            <p className="text-gray-600 dark:text-gray-400 font-normal">
              {order.phoneNumber || t("orderDetail.noPhone")}
            </p>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={15} className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
            <div className="text-gray-600 dark:text-gray-400 font-normal leading-relaxed">
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
        </div>
      </div>

      {normalizedPaymentFlow === "bank_transfer" &&
        (normalizeOrderStatus(order.status) === "awaiting_payment" ||
          order.status === "quoted" ||
          order.status === "pending_payment") &&
        !order.isPaid && (
          <div className="rounded-3xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/30 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300">
                <Landmark size={16} />
              </div>
              <h4 className="font-semibold text-sm sm:text-base text-amber-950 dark:text-amber-200">
                {t("orderDetail.bankTransferTitle")}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              {t("orderDetail.bankTransferInstructions")}
            </p>

            {hasBankTransferDetails ? (
              <div className="space-y-2.5 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-white/80 dark:bg-[#121c17] backdrop-blur-xs p-4 text-xs sm:text-sm text-amber-950 dark:text-amber-200">
                {bankTransferDetails?.accountName ? (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-amber-800 dark:text-amber-400 font-medium">
                      {t("orderDetail.bankTransferAccountName")}
                    </span>
                    <span className="text-right font-semibold">
                      {bankTransferDetails.accountName}
                    </span>
                  </div>
                ) : null}

                {bankTransferDetails?.iban ? (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-amber-800 dark:text-amber-400 font-medium">
                      {t("orderDetail.bankTransferIban")}
                    </span>
                    <span className="text-right font-mono text-xs select-all break-all">
                      {bankTransferDetails.iban}
                    </span>
                  </div>
                ) : null}

                {bankTransferDetails?.bic ? (
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-amber-800 dark:text-amber-400 font-medium">
                      {t("orderDetail.bankTransferBic")}
                    </span>
                    <span className="text-right font-mono text-xs select-all break-all">
                      {bankTransferDetails.bic}
                    </span>
                  </div>
                ) : null}

                {order.payments?.find(
                  (payment) => payment.provider === "bank_transfer",
                )?.reference ? (
                  <div className="flex items-start justify-between gap-4 pt-2 border-t border-amber-100 dark:border-amber-800/50">
                    <span className="text-amber-800 dark:text-amber-400 font-medium">
                      {t("orderDetail.bankTransferReference")}
                    </span>
                    <span className="text-right font-mono text-xs select-all break-all font-semibold">
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
              <p className="rounded-2xl border border-dashed border-amber-300 dark:border-amber-700 bg-white/60 dark:bg-white/5 p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                {t("orderDetail.bankTransferMissingDetails")}
              </p>
            )}

            <p className="text-xs text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
              {t("orderDetail.bankTransferNotice")}
            </p>

            {onManualPaymentNotification && (
              <button
                type="button"
                onClick={onManualPaymentNotification}
                disabled={manualPaymentNotificationDisabled}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-amber-700 hover:bg-amber-800 active:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-xs cursor-pointer text-white px-5 py-2.5 text-xs font-semibold"
              >
                {manualPaymentNotificationDisabled
                  ? t("orderDetail.manualPaymentNotificationCooldown")
                  : t("orderDetail.manualPaymentNotificationButton")}
              </button>
            )}
          </div>
        )}

      {(order.trackingCode || order.trackingUrl) && (
        <div className="rounded-3xl border border-sky-200/80 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-950/30 p-6 sm:p-7 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-700 dark:text-sky-300">
              <Truck size={16} />
            </div>
            <h4 className="font-semibold text-sm sm:text-base text-sky-950 dark:text-sky-200">
              {t("orderDetail.trackingTitle")}
            </h4>
          </div>
          {order.trackingCode && (
            <p className="text-xs sm:text-sm text-sky-950 dark:text-sky-200 flex items-baseline gap-2">
              <span className="text-sky-800/80 dark:text-sky-400/80 font-medium">
                {t("orderDetail.trackingCode")}:
              </span>{" "}
              <span className="font-mono font-semibold bg-white dark:bg-sky-900/60 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800 select-all">
                {order.trackingCode}
              </span>
            </p>
          )}
          {order.trackingUrl && (
            <div className="pt-1">
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span>{t("orderDetail.openTracking")}</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Report Issue / Help Card */}
      <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0e1512] p-5 sm:p-6 shadow-xs flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          <HelpCircle size={15} className="text-teal-700 dark:text-teal-400" />
          <span>{t("orderDetail.needHelpTitle")}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {t("orderDetail.needHelpDesc")}
        </p>
        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-teal-700/30 dark:border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100/70 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-300 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <HelpCircle size={14} />
          <span>{t("orderDetail.reportIssue")}</span>
        </button>
      </div>

      {isReportModalOpen && (
        <ReportIssueModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          orderId={order.id}
          defaultCategory="OrderIssue"
        />
      )}
    </div>
  );
}
