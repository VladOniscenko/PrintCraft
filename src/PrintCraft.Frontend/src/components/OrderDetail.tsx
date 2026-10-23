import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, XCircle } from "lucide-react";
import Navbar from "./Navbar";
import api from "../services/api";
import type { Order } from "../types";
import { useI18n } from "../i18n/I18nContext";
import Footer from "./Footer";
import { useNotify } from "../context/NotifyContext";
import OrderItemsCard from "./order-detail/OrderItemsCard";
import OrderTimeline from "./order-detail/OrderTimeline";
import OrderSidebar from "./order-detail/OrderSidebar";
import {
  buildPriceSummary,
  buildStatusSummary,
  getReachedDate,
} from "./order-detail/utils";
import { normalizeOrderStatus } from "../utils/orderStatus";

export default function OrderDetail() {
  const { t, localizePath } = useI18n();
  const { notifyError, notifySuccess } = useNotify();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [paymentNotificationCooldown, setPaymentNotificationCooldown] =
    useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderRes = await api.get(`/orders/${id}`);
        setOrder(orderRes.data);
      } catch (err) {
        console.error("Error fetching order", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrderDetails();
  }, [id]);

  const handleCancelOrder = async () => {
    const isPaid = order ? normalizeOrderStatus(order.status) === "ready_to_print" : false;
    const confirmMessage = isPaid
      ? t("orderDetail.header.confirmCancelPaid")
      : t("orderDetail.header.confirmCancel");
    const confirmCancel = window.confirm(confirmMessage);

    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      await api.put(`/orders/${id}/cancel`);
      notifySuccess(t("orderDetail.cancelSuccess"));
      navigate(localizePath("/orders"));
    } catch (err: any) {
      notifyError(err?.response?.data?.message || t("orderDetail.cancelFailed"));
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const refreshOrderData = async () => {
    if (!id) return;

    const orderRes = await api.get(`/orders/${id}`);
    setOrder(orderRes.data);
  };

  const handleRequestNewQuote = async () => {
    if (!id) return;

    try {
      await api.post(`/orders/${id}/request-new-quote`);
      await refreshOrderData();
      notifySuccess(t("orderDetail.newQuoteRequested"));
    } catch (err: any) {
      console.error("New quote request failed", err);
      notifyError(
        err?.response?.data?.message || t("orderDetail.newQuoteRequestFailed"),
      );
    }
  };

  const handleManualPaymentNotification = async () => {
    if (!id) return;
    try {
      await api.post(`/orders/${id}/manual-payment-notification`, {
        message: t("orderDetail.manualPaymentNotificationMessage"),
      });
      setPaymentNotificationCooldown(
        new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      );
      notifySuccess(t("orderDetail.manualPaymentNotificationSent"));
    } catch (err: any) {
      notifyError(
        err?.response?.data?.message || t("orderDetail.paymentNotificationFailed"),
      );
    }
  };

  if (loading) {
    return (
      <div className="site-shell min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-gray-400">
          <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
          <p className="text-sm font-medium">{t("orders.loading")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="site-shell min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4 border border-gray-200/60 shadow-2xs">
            <XCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("orderDetail.notFound")}</h2>
          <button
            type="button"
            onClick={() => navigate(localizePath("/orders"))}
            className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-full bg-[#133827] text-white text-xs font-semibold hover:bg-[#1c4d37] transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{t("orderDetail.back")}</span>
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const priceSummary = buildPriceSummary(order);
  const statusSummary = buildStatusSummary(order, t);
  const reachedDate = getReachedDate(order);
  const normalizedStatus = normalizeOrderStatus(order.status);
  const quoteExpiresAt = order.quoteExpiresAt
    ? new Date(order.quoteExpiresAt)
    : null;
  const showQuoteExpiryNotice =
    normalizedStatus === "quoted" &&
    quoteExpiresAt instanceof Date &&
    !Number.isNaN(quoteExpiresAt.getTime());
  const showPendingQuoteNotice = priceSummary.isPendingQuote;
  const customerNotes = Array.isArray(order.notes)
    ? order.notes
        .filter((note) => note.visibility === "customer")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
  : [];
  let isAdmin = false;
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const parsed = JSON.parse(atob(token.split(".")[1]));
      isAdmin = parsed.role === "admin";
    }
  } catch {
    /* ignore invalid token */
  }

  return (
    <div className="site-shell">
      <Navbar />

      <main className="site-main max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <button
            type="button"
            onClick={() => navigate(localizePath("/orders"))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer self-start"
          >
            <ArrowLeft size={15} />
            <span>{t("orderDetail.back")}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <Link
                to={localizePath(`/admin/orders/${id}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#133827] hover:bg-[#1c4d37] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-full transition-all shadow-2xs cursor-pointer"
              >
                <span>{t("orderDetail.openInAdmin")}</span>
              </Link>
            )}

            {["quote_requested", "awaiting_payment", "ready_to_print"].includes(normalizedStatus) && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold rounded-full transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isCancelling ? (
                  <Loader2 className="animate-spin" size={15} />
                ) : (
                  <XCircle size={15} />
                )}
                <span>{t("orderDetail.cancelOrder")}</span>
              </button>
            )}

            {normalizedStatus === "expired_quote" && (
              <button
                type="button"
                onClick={handleRequestNewQuote}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-full transition-all shadow-2xs cursor-pointer"
              >
                <span>{t("orderDetail.requestNewQuote")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notices */}
        {showPendingQuoteNotice && (
          <div className="rounded-2xl border border-sky-200/80 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/40 p-4 text-xs sm:text-sm text-sky-950 dark:text-sky-200 flex items-center gap-3 shadow-2xs">
            <span className="shrink-0 text-sky-600 dark:text-sky-400">ℹ️</span>
            <span>{t("orderDetail.pendingQuoteInfo")}</span>
          </div>
        )}

        {showQuoteExpiryNotice && (
          <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 p-4 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-center gap-3 shadow-2xs">
            <span className="shrink-0 text-amber-600 dark:text-amber-400">⏳</span>
            <span>{t("orderDetail.quoteExpiresOn")} {quoteExpiresAt.toLocaleString()}</span>
          </div>
        )}

        {normalizedStatus === "expired_quote" && (
          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-800/60 bg-rose-50/70 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-950 dark:text-rose-200 flex items-center gap-3 shadow-2xs">
            <span className="shrink-0 text-rose-600 dark:text-rose-400">⚠️</span>
            <span>{t("orderDetail.quoteExpiredInfo")}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <OrderItemsCard
              order={order}
              t={t}
              onRefresh={refreshOrderData}
            />
            <OrderTimeline
              statusStep={statusSummary.step}
              currentStatus={order.status}
              reachedDate={reachedDate}
              t={t}
            />

            {customerNotes.length > 0 && (
              <section className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0e1512] p-6 sm:p-7 shadow-xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t("orderDetail.customerNotesTitle")}
                </h3>
                <div className="space-y-3">
                  {customerNotes.map((note) => (
                    <article
                      key={note.id || `${note.createdAt}-${note.content}`}
                      className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-[#fbfbfd] dark:bg-white/5 p-4 text-xs sm:text-sm"
                    >
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          <OrderSidebar
            order={order}
            priceSummary={priceSummary}
            statusLabel={statusSummary.label}
            t={t}
            onManualPaymentNotification={handleManualPaymentNotification}
            manualPaymentNotificationDisabled={
              paymentNotificationCooldown != null &&
              new Date(paymentNotificationCooldown) > new Date()
            }
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
