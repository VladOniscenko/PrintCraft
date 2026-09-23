import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import Navbar from "./Navbar";
import api from "../services/api";
import type { Order, PaymentAttempt } from "../types";
import type { UserAddress } from "../types/address";
import {
  normalizeShippingInfo,
  validateShippingInfo,
} from "../utils/shippingValidation";
import { useI18n } from "../i18n/I18nContext";
import Footer from "./Footer";
import { useNotify } from "../context/NotifyContext";
import OrderItemsCard from "./order-detail/OrderItemsCard";
import OrderTimeline from "./order-detail/OrderTimeline";
import OrderSidebar from "./order-detail/OrderSidebar";
import ShippingModal from "./order-detail/ShippingModal";
import type {
  SavedAddressOption,
  ShippingDetails,
  ShippingField,
} from "./order-detail/types";
import {
  buildPriceSummary,
  buildStatusSummary,
  getReachedDate,
} from "./order-detail/utils";
import {
  canCustomerRetryPayment,
  getCustomerPaymentActionVariant,
} from "../utils/orderStatus";
import { normalizeOrderStatus } from "../utils/orderStatus";

const EMPTY_SHIPPING_DETAILS: ShippingDetails = {
  fullName: "",
  phoneNumber: "",
  addressLine1: "",
  city: "",
  postalCode: "",
};

function getShippingDetailsFromOrder(order: Order | null): ShippingDetails {
  return {
    fullName: order?.fullName || "",
    phoneNumber: order?.phoneNumber || "",
    addressLine1: order?.addressLine1 || "",
    city: order?.city || "",
    postalCode: order?.postalCode || "",
  };
}

function getShippingDetailsFromAddress(
  address: SavedAddressOption | null,
): ShippingDetails {
  return {
    fullName: address?.fullName || "",
    phoneNumber: address?.phoneNumber || "",
    addressLine1: address?.addressLine1 || "",
    city: address?.city || "",
    postalCode: address?.postalCode || "",
  };
}

function mergeShippingDetails(
  base: ShippingDetails,
  fallback: ShippingDetails,
): ShippingDetails {
  return {
    fullName: base.fullName || fallback.fullName,
    phoneNumber: base.phoneNumber || fallback.phoneNumber,
    addressLine1: base.addressLine1 || fallback.addressLine1,
    city: base.city || fallback.city,
    postalCode: base.postalCode || fallback.postalCode,
  };
}

function addressMatchesShippingDetails(
  address: SavedAddressOption,
  details: ShippingDetails,
) {
  const normalize = (value: string) => value.trim().toLowerCase();
  return (
    normalize(address.fullName) === normalize(details.fullName) &&
    normalize(address.phoneNumber) === normalize(details.phoneNumber) &&
    normalize(address.addressLine1) === normalize(details.addressLine1) &&
    normalize(address.city) === normalize(details.city) &&
    normalize(address.postalCode) === normalize(details.postalCode)
  );
}

export default function OrderDetail() {
  const { t } = useI18n();
  const { notifyError, notifySuccess } = useNotify();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>(
    EMPTY_SHIPPING_DETAILS,
  );
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>(
    {},
  );
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressOption[]>(
    [],
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [payments, setPayments] = useState<PaymentAttempt[]>([]);
  const [paymentNotificationCooldown, setPaymentNotificationCooldown] =
    useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const [orderRes, paymentRes] = await Promise.all([
          api.get(`/orders/${id}`),
          api.get(`/orders/${id}/payments`),
        ]);
        setOrder(orderRes.data);
        setShippingDetails(getShippingDetailsFromOrder(orderRes.data));
        setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);

        try {
          const addressesRes = await api.get<UserAddress[]>("/me/addresses");
          const normalizedAddresses: SavedAddressOption[] = Array.isArray(
            addressesRes.data,
          )
            ? addressesRes.data.map((address) => ({
                ...address,
                addressLine2: address.addressLine2 || null,
              }))
            : [];
          setSavedAddresses(normalizedAddresses);
        } catch {
          setSavedAddresses([]);
        }
      } catch (err) {
        console.error("Error fetching order", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrderDetails();
  }, [id]);

  const handleDeleteQuote = async () => {
    const confirmCancel = window.confirm(t("orderDetail.deleteQuote") + "?");

    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      await api.put(`/orders/${id}/cancel`);
      notifySuccess(t("orderDetail.deleteQuote"));
      navigate("/orders");
    } catch (err) {
      notifyError(t("gallery.addFailed"));
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmAndPay = async () => {
    if (!id) return;

    const orderDetails = getShippingDetailsFromOrder(order);
    const defaultAddress =
      savedAddresses.find((address) => address.isDefault) ??
      savedAddresses[0] ??
      null;

    const fallbackDetails = getShippingDetailsFromAddress(defaultAddress);
    const nextDetails = mergeShippingDetails(orderDetails, fallbackDetails);

    setShippingDetails(nextDetails);
    setSelectedAddressId(
      defaultAddress &&
        addressMatchesShippingDetails(defaultAddress, nextDetails)
        ? defaultAddress.id
        : null,
    );
    setShippingErrors({});
    setShowShippingModal(true);
  };

  const refreshOrderData = async () => {
    if (!id) return;

    const [orderRes, paymentRes] = await Promise.all([
      api.get(`/orders/${id}`),
      api.get(`/orders/${id}/payments`),
    ]);

    setOrder(orderRes.data);
    setShippingDetails(getShippingDetailsFromOrder(orderRes.data));
    setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);
  };

  useEffect(() => {}, [id]);

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

  const handleShippingField = (field: ShippingField, value: string) => {
    setSelectedAddressId(null);
    setShippingDetails((prev) => ({ ...prev, [field]: value }));
    if (shippingErrors[field]) {
      const next = { ...shippingErrors };
      delete next[field];
      setShippingErrors(next);
    }
  };

  const handleSavedAddressChange = (addressId: string) => {
    if (!addressId) {
      const orderDetails = getShippingDetailsFromOrder(order);
      const defaultAddress =
        savedAddresses.find((address) => address.isDefault) ??
        savedAddresses[0] ??
        null;
      setSelectedAddressId(null);
      setShippingDetails(
        mergeShippingDetails(
          orderDetails,
          getShippingDetailsFromAddress(defaultAddress),
        ),
      );
      return;
    }

    const selectedAddress = savedAddresses.find(
      (address) => address.id === addressId,
    );
    if (!selectedAddress) return;

    setSelectedAddressId(selectedAddress.id);
    setShippingDetails(getShippingDetailsFromAddress(selectedAddress));
    setShippingErrors({});
  };

  const handleSaveAddressAndCheckout = async () => {
    if (!id) return;

    const errors = validateShippingInfo(shippingDetails, t);
    setShippingErrors(errors);
    if (Object.keys(errors).length > 0) {
      notifyError(t("quote.invalidShipping"));
      return;
    }

    setIsPaying(true);
    try {
      const shippingPayload = normalizeShippingInfo(shippingDetails);
      await api.put(`/orders/${id}/shipping`, shippingPayload);

      await api.post(`/payments/orders/${id}/create`);
      setShowShippingModal(false);
      await refreshOrderData();
      notifySuccess("Payment instructions are ready on this order.");
    } catch (err: any) {
      console.error("Quoted payment checkout error", err);

      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        setShippingErrors(apiErrors);
      }

      notifyError(
        err?.response?.data?.message || t("orderDetail.paymentStartFailed"),
      );
    } finally {
      setIsPaying(false);
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
  const paymentAttempts = payments.length > 0 ? payments : order.payments || [];
  const normalizedStatus = normalizeOrderStatus(order.status);
  const quoteExpiresAt = order.quoteExpiresAt
    ? new Date(order.quoteExpiresAt)
    : null;
  const showQuoteExpiryNotice =
    normalizedStatus === "quoted" &&
    quoteExpiresAt instanceof Date &&
    !Number.isNaN(quoteExpiresAt.getTime());
  const customerNotes = Array.isArray(order.notes)
    ? order.notes
        .filter((note) => note.visibility === "customer")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    : [];
  const canRetryPayment = canCustomerRetryPayment(
    order.status,
    !!order.isPaid,
    order.paymentFlow,
  );
  const paymentActionVariant = getCustomerPaymentActionVariant(
    order.status,
    order.paymentFlow,
  );
  const paymentActionLabel =
    paymentActionVariant === "try_again"
      ? t("orderDetail.tryAgain")
      : paymentActionVariant === "pay_again"
        ? t("orderDetail.payAgain")
        : t("orderDetail.payNow");

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
            {(priceSummary.isPendingQuote || normalizedStatus === "quoted") && (
              <button
                onClick={handleDeleteQuote}
                disabled={isCancelling}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all shadow-sm disabled:opacity-50"
              >
                {isCancelling ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <XCircle size={18} />
                )}
                {t("orderDetail.deleteQuote")}
              </button>
            )}

            {canRetryPayment && (
              <button
                onClick={handleConfirmAndPay}
                disabled={isPaying}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 border border-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
              >
                {isPaying ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {isPaying
                  ? t("orderDetail.processingPayment")
                  : paymentActionLabel}
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
              isPendingQuote={priceSummary.isPendingQuote}
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

          {paymentAttempts.length > 0 && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900 mb-3">
                {t("orderDetail.paymentAttempts")}
              </h3>
              {paymentAttempts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {t("orderDetail.noPaymentAttempts")}
                </p>
              ) : (
                <div className="space-y-3">
                  {paymentAttempts.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                          {payment.reference}
                        </p>
                        <span
                          className={`text-[10px] uppercase font-black px-2 py-1 rounded-full ${getPaymentStatusClass(payment.status)}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {payment.currency}{" "}
                        {Number(payment.amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {new Date(payment.createdAt).toLocaleString()}
                      </p>
                      {payment.paidAt && (
                        <p className="text-xs text-emerald-700 mt-1">
                          Paid {new Date(payment.paidAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <ShippingModal
        open={showShippingModal}
        shippingDetails={shippingDetails}
        shippingErrors={shippingErrors}
        savedAddresses={savedAddresses}
        selectedAddressId={selectedAddressId}
        isPaying={isPaying}
        t={t}
        onFieldChange={handleShippingField}
        onSavedAddressChange={handleSavedAddressChange}
        onCancel={() => setShowShippingModal(false)}
        onCheckout={handleSaveAddressAndCheckout}
      />
      <Footer />
    </div>
  );
}

function getPaymentStatusClass(status: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "paid") return "bg-emerald-100 text-emerald-800";
  if (normalized === "failed") return "bg-rose-100 text-rose-800";
  if (normalized === "expired" || normalized === "canceled")
    return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}
