import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const { t } = useI18n();
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
      ? "Are you sure you want to cancel this order? It will be flagged for refund review."
      : "Are you sure you want to cancel this order?";
    const confirmCancel = window.confirm(confirmMessage);

    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      await api.put(`/orders/${id}/cancel`);
      notifySuccess("Order cancelled successfully");
      navigate("/orders");
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Failed to cancel order");
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
        err?.response?.data?.message || "Unable to send payment notification.",
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">{t("orderDetail.notFound")}</h2>
        <button
          onClick={() => navigate("/orders")}
          className="text-emerald-700 font-bold underline"
        >
          {t("orderDetail.back")}
        </button>
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
  } catch (e) {}

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            {t("orderDetail.back")}
          </button>

          <div className="md:ml-auto flex flex-wrap items-center justify-end gap-3">

            {isAdmin && (
              <a
                href={`/admin/orders/${id}`}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 border border-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
              >
                Open order in admin panel
              </a>
            )}

            {["quote_requested", "awaiting_payment", "ready_to_print"].includes(normalizedStatus) && (
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all shadow-sm disabled:opacity-50"
              >
                {isCancelling ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <XCircle size={18} />
                )}
                Cancel Order
              </button>
            )}


            {normalizedStatus === "expired_quote" && (
              <button
                onClick={handleRequestNewQuote}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 border border-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-sm"
              >
                {t("orderDetail.requestNewQuote")}
              </button>
            )}
          </div>
        </div>

        {showPendingQuoteNotice && (
          <p className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            {t("orderDetail.pendingQuoteInfo")}
          </p>
        )}

        {showQuoteExpiryNotice && (
          <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t("orderDetail.quoteExpiresOn")} {quoteExpiresAt.toLocaleString()}
          </p>
        )}

        {normalizedStatus === "expired_quote" && (
          <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {t("orderDetail.quoteExpiredInfo")}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <OrderItemsCard
              order={order}
              t={t}
            />
            <OrderTimeline
              statusStep={statusSummary.step}
              currentStatus={order.status}
              reachedDate={reachedDate}
              t={t}
            />

            {customerNotes.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-black uppercase tracking-wide text-gray-900 mb-3">
                  {t("orderDetail.customerNotesTitle")}
                </h3>
                <div className="space-y-3">
                  {customerNotes.map((note) => (
                    <article
                      key={note.id || `${note.createdAt}-${note.content}`}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
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
