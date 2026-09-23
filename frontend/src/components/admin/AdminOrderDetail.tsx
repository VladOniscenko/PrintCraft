import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Loader2,
  Package,
  CheckCircle,
  Truck,
  AlertTriangle,
} from "lucide-react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api from "../../services/api";
import type { Order, OrderNote, PaymentAttempt } from "../../types";
import { useNotify } from "../../context/NotifyContext";
import { useI18n } from "../../i18n/I18nContext";
import type {
  OrderCommunication,
  OrderStatusHistoryEntry,
} from "./../admin-order-detail/types";
import OrderPricingPanel from "./../admin-order-detail/OrderPricingPanel";
import OrderHistoryPanel from "./../admin-order-detail/OrderHistoryPanel";
import {
  ADMIN_ORDER_STATUS_OPTIONS,
  canTransitionOrderStatus,
  formatOrderStatusLabel,
  getOrderStatusPillClass,
  isOrderPricingLocked,
  normalizeOrderStatus,
} from "../../utils/orderStatus";
import { formatCurrencyAmount } from "../../utils/currency";

export default function AdminOrderDetail() {
  const { notifyError, notifySuccess } = useNotify();
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // States
  const [internalNoteInput, setInternalNoteInput] = useState("");
  const [customerNoteInput, setCustomerNoteInput] = useState("");
  const [addingInternalNote, setAddingInternalNote] = useState(false);
  const [addingCustomerNote, setAddingCustomerNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [fullName, setFullName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [itemPrices, setItemPrices] = useState<{ [key: string]: number }>({});
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [orderDiscountAmount, setOrderDiscountAmount] = useState(0);
  const [quoteMessage, setQuoteMessage] = useState("");
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [savingServiceFee, setSavingServiceFee] = useState(false);
  const [savingOrderDiscount, setSavingOrderDiscount] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailType, setEmailType] = useState("quote_requested");
  const [emailTemplate, setEmailTemplate] = useState("custom");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [paymentFlow, setPaymentFlow] = useState("bank_transfer");
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);
  const [communications, setCommunications] = useState<OrderCommunication[]>(
    [],
  );
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistoryEntry[]>(
    [],
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [payments, setPayments] = useState<PaymentAttempt[]>([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentFromDate, setPaymentFromDate] = useState("");
  const [paymentToDate, setPaymentToDate] = useState("");
  const [reconcilingPayments, setReconcilingPayments] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("pending");

  useEffect(() => {
    if (!id) return;

    const applyOrderData = (data: Order) => {
      setOrder(data);
      setFullName(data.fullName);
      setAddressLine1(data.addressLine1);
      setAddressLine2(data.addressLine2 || "");
      setCity(data.city);
      setPostalCode(data.postalCode);
      setPhoneNumber(data.phoneNumber);

      const prices: { [key: string]: number } = {};
      data.items.forEach((item: any) => {
        if (item.id) prices[item.id] = item.price || 0;
      });

      setItemPrices(prices);
      setDeliveryPrice(data.deliveryPrice || 0);
      setServiceFee(data.serviceFeePrice || 0);
      setOrderDiscountAmount(data.orderDiscountAmount || 0);
      setQuoteMessage(data.quoteMessage || "");
      setSelectedStatus(data.status || "pending");
      setPaymentFlow(data.paymentFlow || "bank_transfer");
      setTrackingCode(data.trackingCode || "");
      setTrackingUrl(data.trackingUrl || "");

      setEmailTemplate("custom");
      setEmailSubject("");
      setEmailBody("");
    };

    const getOrder = async () => {
      try {
        const [res, commsRes, statusRes, paymentsRes] = await Promise.all([
          api.get(`/admin/orders/${id}`),
          api.get(`/admin/orders/${id}/communications`),
          api.get(`/admin/orders/${id}/status-history`),
          api.get(`/admin/orders/${id}/payments`),
        ]);
        applyOrderData(res.data);
        setCommunications(commsRes.data || []);
        setStatusHistory(statusRes.data || []);
        setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getOrder();
  }, [id]);

  const refresh = async () => {
    if (!id) return;
    const [res, commsRes, statusRes, paymentsRes] = await Promise.all([
      api.get(`/admin/orders/${id}`),
      api.get(`/admin/orders/${id}/communications`),
      api.get(`/admin/orders/${id}/status-history`),
      api.get(`/admin/orders/${id}/payments`),
    ]);
    setOrder(res.data);
    setTrackingCode(res.data.trackingCode || "");
    setTrackingUrl(res.data.trackingUrl || "");
    setPaymentFlow(res.data.paymentFlow || "bank_transfer");
    setQuoteMessage(res.data.quoteMessage || "");

    if (emailType !== "custom") {
      setEmailSubject("");
      setEmailBody("");
    }

    setCommunications(commsRes.data || []);
    setStatusHistory(statusRes.data || []);
    setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
  };

  const handleProcessQuote = async () => {
    setIsProcessing(true);
    try {
      await api.post(`/admin/orders/${id}/process-quote`, {
        itemPrices,
        deliveryPrice,
        serviceFeePrice: serviceFee,
        orderDiscountAmount,
        quoteMessage,
        paymentFlow,
      });
      notifySuccess("Quote prepared and sent to customer successfully!");
      await refresh();
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Failed to process quote.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickStatusChange = async (
    newStatus: string,
    successMessage: string,
  ) => {
    setIsProcessing(true);
    try {
      if (newStatus === "paid") {
        await api.put(`/admin/orders/${id}/paid`);
      } else {
        await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
      }

      if (newStatus === "shipped" || newStatus === "sent") {
        if (trackingCode.trim() || trackingUrl.trim()) {
          await api.patch(`/admin/orders/${id}/tracking`, {
            trackingCode,
            trackingUrl,
          });
        }
        await api.post(`/admin/orders/${id}/email`, {
          type: "order_sent_tracking",
          trackingCode: trackingCode.trim() || null,
          trackingUrl: trackingUrl.trim() || null,
        });
      }

      notifySuccess(successMessage);
      await refresh();
    } catch (err: any) {
      notifyError(err?.response?.data?.message || "Failed to update order.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!id) return;
    try {
      await api.patch(`/admin/orders/${id}/status`, {
        status: selectedStatus,
      });
      await refresh();
      notifySuccess(t("admin.order.statusUpdated"));
    } catch (err: any) {
      console.error(err);
      notifyError(
        err?.response?.data?.message || t("admin.order.statusUpdateFailed"),
      );
    }
  };

  const saveTracking = async () => {
    if (!id) return;
    if (!trackingCode.trim()) {
      notifyError(t("admin.order.trackingRequired"));
      return;
    }

    setSavingTracking(true);
    try {
      await api.patch(`/admin/orders/${id}/tracking`, {
        trackingCode: trackingCode.trim(),
        trackingUrl: trackingUrl.trim() || null,
      });
      await refresh();
      notifySuccess(t("admin.order.trackingSaved"));
    } catch (err) {
      console.error(err);
      notifyError(t("admin.order.trackingSaveFailed"));
    } finally {
      setSavingTracking(false);
    }
  };

  const updateItemPrice = async (itemId: string, price: number) => {
    if (!id) return;
    setSavingItemId(itemId);
    try {
      await api.put(`/admin/orders/${id}/items/${itemId}`, { price });
      await refresh();
      notifySuccess(t("admin.order.itemPriceUpdated"));
    } catch (err) {
      console.error(err);
      notifyError(t("admin.order.itemPriceUpdateFailed"));
    } finally {
      setSavingItemId(null);
    }
  };

  const updateDeliveryPrice = async (price: number) => {
    if (!id) return;
    setSavingDelivery(true);
    try {
      await api.patch(`/admin/orders/${id}/delivery-price`, {
        deliveryPrice: price,
      });
      await refresh();
      notifySuccess(t("admin.order.deliveryPriceUpdated"));
    } catch (err) {
      console.error(err);
      notifyError(t("admin.order.deliveryPriceUpdateFailed"));
    } finally {
      setSavingDelivery(false);
    }
  };

  const updateServiceFee = async (fee: number) => {
    if (!id) return;
    setSavingServiceFee(true);
    try {
      await api.patch(`/admin/orders/${id}/service-fee`, {
        serviceFeePrice: fee,
      });
      await refresh();
      notifySuccess(
        t("admin.order.serviceFeeUpdated") || "Service fee updated",
      );
    } catch (err) {
      console.error(err);
      notifyError(
        t("admin.order.serviceFeeUpdateFailed") ||
          "Failed to update service fee",
      );
    } finally {
      setSavingServiceFee(false);
    }
  };

  const updateOrderDiscount = async (discount: number) => {
    if (!id) return;
    if (discount < 0) {
      notifyError(t("admin.order.discountNegative"));
      return;
    }

    setSavingOrderDiscount(true);
    try {
      await api.patch(`/admin/orders/${id}/order-discount`, {
        orderDiscountAmount: discount,
      });
      await refresh();
      notifySuccess(t("admin.order.discountUpdated"));
    } catch (err) {
      console.error(err);
      notifyError(t("admin.order.discountUpdateFailed"));
    } finally {
      setSavingOrderDiscount(false);
    }
  };

  const deleteOrder = async () => {
    if (!id) return;
    try {
      await api.delete(`/admin/orders/${id}`);
      notifySuccess(t("admin.order.deleted"));
      navigate("/admin/orders");
    } catch (err: any) {
      console.error(err);
      notifyError(
        err?.response?.data?.message || t("admin.order.deleteFailed"),
      );
    }
  };

  const addNote = async (visibility: "internal" | "customer") => {
    if (!id) return;

    const content =
      visibility === "internal" ? internalNoteInput : customerNoteInput;

    if (!content.trim()) {
      notifyError(t("admin.order.noteContentRequired"));
      return;
    }

    if (visibility === "internal") {
      setAddingInternalNote(true);
    } else {
      setAddingCustomerNote(true);
    }

    try {
      await api.post(`/admin/orders/${id}/notes`, {
        content: content.trim(),
        visibility,
      });
      await refresh();
      if (visibility === "internal") {
        setInternalNoteInput("");
      } else {
        setCustomerNoteInput("");
      }
      notifySuccess(t("admin.order.noteAdded"));
    } catch (err) {
      console.error(err);
      notifyError(t("admin.order.noteAddFailed"));
    } finally {
      if (visibility === "internal") {
        setAddingInternalNote(false);
      } else {
        setAddingCustomerNote(false);
      }
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!id) return;

    setDeletingNoteId(noteId);
    try {
      await api.delete(`/admin/orders/${id}/notes/${noteId}`);
      await refresh();
      notifySuccess(t("admin.order.noteDeleted"));
    } catch (err) {
      console.error(err);
      notifyError(t("admin.order.noteDeleteFailed"));
    } finally {
      setDeletingNoteId(null);
    }
  };

  const saveCustomerInfo = async () => {
    if (!id) return;
    try {
      await api.patch(`/admin/orders/${id}/customer`, {
        fullName,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        phoneNumber,
      });
      await refresh();
      setEditingCustomer(false);
      notifySuccess(t("admin.order.customerUpdated"));
    } catch (err: any) {
      console.error(err);
      notifyError(
        err?.response?.data?.message || t("admin.order.customerUpdateFailed"),
      );
    }
  };

  const sendCustomerEmail = async () => {
    if (!id) return;

    if (emailType === "order_sent_tracking" && !trackingCode.trim()) {
      notifyError(t("admin.order.trackingRequiredForEmail"));
      return;
    }

    if (emailType === "custom") {
      if (!emailSubject.trim() || !emailBody.trim()) {
        notifyError(
          t("admin.order.customEmailRequired") ||
            "Subject and body are required.",
        );
        return;
      }
    }

    setSendingEmail(true);
    try {
      await api.post(`/admin/orders/${id}/email`, {
        type: emailType,
        price: null,
        message:
          emailType === "quote_confirmation" ? quoteMessage || null : null,
        trackingCode:
          emailType === "order_sent_tracking" ? trackingCode.trim() : null,
        trackingUrl:
          emailType === "order_sent_tracking" ? trackingUrl.trim() : null,
        paymentFlow: emailType === "quote_confirmation" ? paymentFlow : null,
        subject: emailType === "custom" ? emailSubject.trim() : null,
        body: emailType === "custom" ? emailBody.trim() : null,
        template: emailType === "custom" ? emailTemplate : null,
      });
      notifySuccess(t("admin.order.emailSent"));
    } catch (err: any) {
      console.error(err);
      notifyError(
        err?.response?.data?.message || t("admin.order.emailSendFailed"),
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const markOrderPaid = async () => {
    if (!id) return;

    setReconcilingPayments(true);
    try {
      await api.put(`/admin/orders/${id}/paid`);
      await refresh();
      notifySuccess(t("admin.order.markPaidSuccess"));
    } catch (err: any) {
      console.error(err);
      notifyError(
        err?.response?.data?.message || t("admin.order.markPaidFailed"),
      );
    } finally {
      setReconcilingPayments(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-shell flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-shell flex flex-col items-center justify-center">
        <p>{t("admin.order.notFoundTitle")}</p>
        <Link to="/admin/orders" className="mt-2 text-teal-700 underline">
          {t("admin.order.notFoundLink")}
        </Link>
      </div>
    );
  }

  const subtotal =
    order.items.reduce((sum, item) => {
      const key = item.id ?? "";
      return (
        sum +
        (key && itemPrices[key] !== undefined
          ? itemPrices[key]
          : item.price || 0) *
          (item.count ?? 1)
      );
    }, 0) || 0;

  const totalPrice = Math.max(
    0,
    subtotal + deliveryPrice + serviceFee - orderDiscountAmount,
  );
  const pricingLocked = isOrderPricingLocked(order.status, !!order.isPaid);
  const allowedStatusOptions = ADMIN_ORDER_STATUS_OPTIONS.filter((option) =>
    canTransitionOrderStatus(order.status, option.value, !!order.isPaid),
  );
  const currentStatus = normalizeOrderStatus(order.status);
  const hasCurrentStatusOption = allowedStatusOptions.some(
    (option) => option.value === currentStatus,
  );
  const statusOptionsForSelect = hasCurrentStatusOption
    ? allowedStatusOptions
    : [
        {
          value: currentStatus,
          label: formatOrderStatusLabel(currentStatus),
        },
        ...allowedStatusOptions,
      ];
  const isStatusUnchanged =
    normalizeOrderStatus(selectedStatus) === normalizeOrderStatus(order.status);
  const quoteExpiresAt = order.quoteExpiresAt
    ? new Date(order.quoteExpiresAt)
    : null;
  const hasQuoteExpiry =
    quoteExpiresAt instanceof Date && !Number.isNaN(quoteExpiresAt.getTime());
  const normalizedPaymentSearch = paymentSearch.trim().toLowerCase();
  const filteredPayments = payments.filter((payment) => {
    const statusMatch =
      paymentStatusFilter === "all" ||
      String(payment.status || "").toLowerCase() === paymentStatusFilter;

    const searchMatch =
      normalizedPaymentSearch.length === 0 ||
      String(payment.reference || "")
        .toLowerCase()
        .includes(normalizedPaymentSearch) ||
      String(payment.providerPaymentId || "")
        .toLowerCase()
        .includes(normalizedPaymentSearch);

    const createdDate = new Date(payment.createdAt);
    const fromMatch =
      !paymentFromDate ||
      createdDate >= new Date(`${paymentFromDate}T00:00:00`);
    const toMatch =
      !paymentToDate || createdDate <= new Date(`${paymentToDate}T23:59:59`);

    return statusMatch && searchMatch && fromMatch && toMatch;
  });

  const allOrderNotes = Array.isArray(order.notes) ? order.notes : [];
  const internalNotes = allOrderNotes
    .filter((note) => note.visibility === "internal")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const customerNotes = allOrderNotes
    .filter((note) => note.visibility === "customer")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const hasLegacyInternalNote =
    internalNotes.length === 0 &&
    String(order.internalNotes || "").trim().length > 0;
  const hasLegacyCustomerNote =
    customerNotes.length === 0 &&
    String(order.customerNotes || "").trim().length > 0;

  return (
    <AdminLayout>
      <AdminBreadcrumb
        title={`${t("admin.order.titlePrefix")} ${order.id.slice(0, 8)}`}
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: t("breadcrumb.orders"), to: "/admin/orders" },
          { label: order.id.slice(0, 8) },
        ]}
      />

      {/* HEADER WITH DANGER ZONE */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            Customer: {order.fullName} ({order.phoneNumber})
          </p>
          <div
            className={`text-lg font-bold ${getOrderStatusPillClass(order.status)}`}
          >
            {formatOrderStatusLabel(order.status)}
          </div>
        </div>

        <select
          className="admin-select w-full md:w-48 border-red-200 text-red-700 bg-red-50 focus:ring-red-500"
          value=""
          onChange={(e) => {
            if (
              e.target.value &&
              window.confirm(
                `Are you sure you want to change status to ${e.target.value}?`,
              )
            ) {
              handleQuickStatusChange(
                e.target.value,
                `Order marked as ${e.target.value}`,
              );
            }
          }}
        >
          <option value="">-- Danger Zone --</option>
          <option value="cancelled">Cancel Order</option>
          <option value="returned">Mark Returned</option>
          <option value="refunded">Mark Refunded</option>
        </select>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={async () => {
            const response = await api.get(`/admin/orders/${id}/invoice`, {
              responseType: "blob",
            });
            const url = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = `invoice-${id}.html`;
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download Invoice
        </button>
      </div>

      <nav
        className="mb-6 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3"
        aria-label="Order detail sections"
      >
        {["customer", "order", "finance", "communication", "activity"].map(
          (section) => (
            <a
              key={section}
              href={`#admin-order-${section}`}
              className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-bold capitalize text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {section}
            </a>
          ),
        )}
      </nav>

      {/* SMART ACTION PANEL */}
      <div className="bg-white border-2 border-emerald-100 rounded-2xl shadow-sm mb-8 overflow-hidden">
        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
          <AlertTriangle className="text-emerald-600" size={20} />
          <h2 className="font-bold text-emerald-900 text-lg">
            Recommended Next Action
          </h2>
        </div>

        <div className="p-6">
          {currentStatus === "pending_quote" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                    1. Set Item Prices
                  </h3>
                  {order.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center mb-3 bg-gray-50 p-3 rounded-lg border border-gray-100"
                    >
                      <div className="flex flex-col pr-4 overflow-hidden">
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {item.fileName || `Item ${idx + 1}`}
                        </span>
                        <span className="text-xs text-gray-500">
                          Qty: {item.count} | Mat: {item.material}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-gray-500 font-bold">€</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="admin-field w-24 text-right py-1.5"
                          value={itemPrices[item.id!] || 0}
                          onChange={(e) =>
                            setItemPrices({
                              ...itemPrices,
                              [item.id!]: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                    2. Additional Fees & Flow
                  </h3>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">
                      Delivery Price (€)
                    </span>
                    <input
                      type="number"
                      className="admin-field w-24 text-right py-1.5"
                      value={deliveryPrice}
                      onChange={(e) =>
                        setDeliveryPrice(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">
                      Service Fee (€)
                    </span>
                    <input
                      type="number"
                      className="admin-field w-24 text-right py-1.5"
                      value={serviceFee}
                      onChange={(e) =>
                        setServiceFee(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">
                      Discount (€)
                    </span>
                    <input
                      type="number"
                      className="admin-field w-24 text-right py-1.5"
                      value={orderDiscountAmount}
                      onChange={(e) =>
                        setOrderDiscountAmount(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-sm font-semibold text-gray-800">
                      Payment Flow
                    </span>
                    <select
                      className="admin-select w-40 py-1.5"
                      value={paymentFlow}
                      onChange={(e) => setPaymentFlow(e.target.value)}
                    >
                      <option value="bank_transfer">
                        Bank transfer / invoice
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                  3. Customer Message
                </h3>
                <textarea
                  className="admin-textarea"
                  rows={3}
                  placeholder="Optional message to include in the quote email..."
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-900 text-white p-5 rounded-xl gap-4">
                <div>
                  <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                    Quote Total
                  </p>
                  <p className="text-3xl font-black text-emerald-400">
                    €{totalPrice.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleProcessQuote}
                  disabled={isProcessing || totalPrice <= 0}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold py-3.5 px-8 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Package size={20} /> Process & Send Quote
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {(currentStatus === "quoted" ||
            currentStatus === "pending_payment") && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-gray-700 mb-1 text-lg">
                  Waiting for customer payment of{" "}
                  <strong className="text-emerald-700">
                    €{(order.quotedPrice || 0).toFixed(2)}
                  </strong>
                  .
                </p>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Payment flow:{" "}
                  {paymentFlow === "bank_transfer"
                    ? "Manual Bank Transfer"
                    : "Online Checkout"}
                </p>
              </div>
              <button
                onClick={() =>
                  handleQuickStatusChange("paid", "Order marked as paid!")
                }
                disabled={isProcessing}
                className="admin-btn bg-emerald-600 text-white hover:bg-emerald-700 py-3.5 px-8 text-base shadow-sm whitespace-nowrap"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Verify Payment & Mark as Paid"
                )}
              </button>
            </div>
          )}

          {currentStatus === "paid" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-700 text-lg">
                Payment received. Ready to start 3D printing.
              </p>
              <button
                onClick={() =>
                  handleQuickStatusChange("printing", "Production started!")
                }
                disabled={isProcessing}
                className="admin-btn bg-blue-600 text-white hover:bg-blue-700 py-3.5 px-8 text-base shadow-sm whitespace-nowrap"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Start Production (Printing)"
                )}
              </button>
            </div>
          )}

          {currentStatus === "printing" && (
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="flex-1 w-full space-y-3">
                <p className="text-gray-700 font-medium text-lg">
                  Ready to ship? Enter tracking info below.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Tracking Code"
                    className="admin-field flex-1"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Tracking URL (Optional)"
                    className="admin-field flex-1"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() =>
                  handleQuickStatusChange(
                    "shipped",
                    "Order shipped & Email Sent!",
                  )
                }
                disabled={isProcessing}
                className="admin-btn bg-indigo-600 text-white hover:bg-indigo-700 py-3.5 px-8 text-base h-full md:mt-10 disabled:opacity-50 shadow-sm w-full md:w-auto"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Truck size={20} /> Ship & Send Email
                  </>
                )}
              </button>
            </div>
          )}

          {(currentStatus === "shipped" || currentStatus === "sent") && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-700 text-lg">
                Order is currently in transit with tracking:{" "}
                <strong className="text-indigo-700">
                  {order.trackingCode || "N/A"}
                </strong>
              </p>
              <button
                onClick={() =>
                  handleQuickStatusChange(
                    "delivered",
                    "Order marked as delivered.",
                  )
                }
                disabled={isProcessing}
                className="admin-btn bg-emerald-600 text-white hover:bg-emerald-700 py-3.5 px-8 text-base shadow-sm whitespace-nowrap"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={20} /> Mark as Delivered
                  </>
                )}
              </button>
            </div>
          )}

          {currentStatus === "delivered" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-700 text-lg">
                Package arrived safely. Close the order.
              </p>
              <button
                onClick={() =>
                  handleQuickStatusChange("completed", "Order completed.")
                }
                disabled={isProcessing}
                className="admin-btn bg-gray-900 text-white hover:bg-gray-800 py-3.5 px-8 text-base shadow-sm whitespace-nowrap"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Archive / Mark Completed"
                )}
              </button>
            </div>
          )}

          {(currentStatus === "completed" ||
            currentStatus === "cancelled" ||
            currentStatus === "returned" ||
            currentStatus === "refunded") && (
            <p className="text-gray-500 italic text-center py-2">
              No further actions required. Order is{" "}
              {formatOrderStatusLabel(currentStatus)}.
            </p>
          )}
        </div>
      </div>

      {/* METRICS ROW */}
      <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <article className="admin-panel p-4">
          <p className="text-xs uppercase text-[#6c817a]">
            {t("admin.orderDetail.statusLabel")}
          </p>
          <p className={`${getOrderStatusPillClass(order.status)} mt-2 w-fit`}>
            {formatOrderStatusLabel(order.status)}
          </p>
        </article>
        <article className="admin-panel p-4">
          <p className="text-xs uppercase text-[#6c817a]">
            {t("admin.orderDetail.createdLabel")}
          </p>
          <p className="mt-2 text-sm text-[#2e423d]">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </article>
        <article className="admin-panel p-4">
          <p className="text-xs uppercase text-[#6c817a]">
            {t("admin.orderDetail.itemsLabel")}
          </p>
          <p className="mt-2 text-xl font-semibold text-[#1b2b25]">
            {order.items.length}
          </p>
        </article>
        <article className="admin-panel p-4">
          <p className="text-xs uppercase text-[#6c817a]">
            {t("admin.orderDetail.totalLabel")}
          </p>
          <p className="mt-2 text-xl font-semibold text-[#1b2b25]">
            {formatCurrencyAmount(totalPrice)}
          </p>
        </article>
        <article className="admin-panel p-4">
          <p className="text-xs uppercase text-[#6c817a]">
            {t("admin.order.quoteExpires")}
          </p>
          <p className="mt-2 text-sm text-[#2e423d]">
            {hasQuoteExpiry ? quoteExpiresAt.toLocaleString() : "-"}
          </p>
        </article>
      </section>

      {/* DETAILED PANELS */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <section id="admin-order-finance">
            <section id="admin-order-order">
              <OrderPricingPanel
                order={order}
                t={t}
                itemPrices={itemPrices}
                setItemPrices={setItemPrices}
                savingItemId={savingItemId}
                updateItemPrice={updateItemPrice}
                deliveryPrice={deliveryPrice}
                setDeliveryPrice={setDeliveryPrice}
                savingDelivery={savingDelivery}
                updateDeliveryPrice={updateDeliveryPrice}
                serviceFee={serviceFee}
                setServiceFee={setServiceFee}
                savingServiceFee={savingServiceFee}
                updateServiceFee={updateServiceFee}
                orderDiscountAmount={orderDiscountAmount}
                setOrderDiscountAmount={setOrderDiscountAmount}
                savingOrderDiscount={savingOrderDiscount}
                updateOrderDiscount={updateOrderDiscount}
                subtotal={subtotal}
                totalPrice={totalPrice}
                pricingLocked={pricingLocked}
              />
            </section>
          </section>

          <section id="admin-order-communication">
            <OrderHistoryPanel
              t={t}
              statusHistory={statusHistory}
              communications={communications}
            />
          </section>
        </div>

        <div className="space-y-5">
          <article id="admin-order-customer" className="admin-panel p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-bold text-[#1b2b25]">
                {t("admin.order.customerInfoTitle")}
              </h2>
              <button
                onClick={() => setEditingCustomer(!editingCustomer)}
                className="text-sm text-teal-700 hover:underline"
              >
                {editingCustomer
                  ? t("admin.order.customerCancel")
                  : t("admin.order.customerEdit")}
              </button>
            </div>
            {editingCustomer ? (
              <div className="space-y-2">
                <label className="admin-label">
                  <span className="font-semibold">
                    {t("admin.order.fullNameLabel")}
                  </span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("admin.order.fullNamePlaceholder")}
                    className="admin-field"
                  />
                </label>
                <label className="admin-label">
                  <span className="font-semibold">
                    {t("admin.order.addressLine1Label")}
                  </span>
                  <input
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder={t("admin.order.addressLine1Placeholder")}
                    className="admin-field"
                  />
                </label>
                <label className="admin-label">
                  <span className="font-semibold">
                    {t("admin.order.addressLine2Label")}
                  </span>
                  <input
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder={t("admin.order.addressLine2Placeholder")}
                    className="admin-field"
                  />
                </label>
                <label className="admin-label">
                  <span className="font-semibold">
                    {t("admin.order.cityLabel")}
                  </span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t("admin.order.cityPlaceholder")}
                    className="admin-field"
                  />
                </label>
                <label className="admin-label">
                  <span className="font-semibold">
                    {t("admin.order.postalCodeLabel")}
                  </span>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder={t("admin.order.postalCodePlaceholder")}
                    className="admin-field"
                  />
                </label>
                <label className="admin-label">
                  <span className="font-semibold">
                    {t("admin.order.phoneNumberLabel")}
                  </span>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t("admin.order.phoneNumberPlaceholder")}
                    className="admin-field"
                  />
                </label>
                <button
                  onClick={saveCustomerInfo}
                  className="admin-btn admin-btn-primary"
                >
                  {t("admin.order.saveButton")}
                </button>
              </div>
            ) : (
              <div className="space-y-1 text-[#2e423d]">
                <p className="font-semibold">{order.fullName}</p>
                <p>
                  {order.addressLine1}
                  {order.addressLine2 ? `, ${order.addressLine2}` : ""}
                </p>
                <p>
                  {order.postalCode} {order.city}
                </p>
                <p className="font-mono text-sm text-gray-500 mt-2">
                  {order.phoneNumber}
                </p>
              </div>
            )}
          </article>

          <article className="admin-panel p-4">
            <h3 className="font-bold mb-2 text-[#1b2b25]">
              Manual Status Override
            </h3>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="admin-select"
                >
                  {statusOptionsForSelect.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={updateOrderStatus}
                  disabled={isStatusUnchanged}
                >
                  {t("admin.order.updateStatusButton")}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="admin-btn admin-btn-danger"
              >
                {t("admin.order.deleteOrderButton")}
              </button>
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="admin-panel w-full max-w-sm p-6">
                    <p className="mb-4 font-semibold">
                      {t("admin.order.deleteConfirmMessage")}
                    </p>
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        {t("admin.order.cancelButton")}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-danger"
                        onClick={async () => {
                          setShowDeleteConfirm(false);
                          await deleteOrder();
                        }}
                      >
                        {t("admin.order.deleteConfirmButton")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>

          <article className="admin-panel p-4">
            <h3 className="font-bold mb-2 text-[#1b2b25]">
              {t("admin.order.trackingTitle")}
            </h3>
            <div className="grid gap-3">
              <div>
                <label className="block text-xs uppercase text-[#6c817a]">
                  {t("admin.order.trackingCodeLabel")}
                </label>
                <input
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="admin-field"
                  placeholder={t("admin.order.trackingCodePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-[#6c817a]">
                  {t("admin.order.trackingUrlLabel")}
                </label>
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="admin-field"
                  placeholder={t("admin.order.trackingUrlPlaceholder")}
                />
              </div>
              <button
                type="button"
                onClick={saveTracking}
                disabled={savingTracking}
                className="admin-btn admin-btn-secondary w-fit"
              >
                {savingTracking
                  ? t("admin.order.savingButton")
                  : t("admin.order.saveTrackingButton")}
              </button>
            </div>
          </article>

          <article className="admin-panel p-4">
            <h3 className="font-bold mb-2 text-[#1b2b25]">
              {t("admin.order.communicationTitle")}
            </h3>
            <div className="grid gap-3">
              <div>
                <label className="block text-xs uppercase text-[#6c817a]">
                  {t("admin.order.emailTypeLabel")}
                </label>
                <select
                  value={emailType}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setEmailType(nextType);

                    setEmailSubject("");
                    setEmailBody("");
                    setEmailTemplate("custom");
                  }}
                  className="admin-select"
                >
                  <option value="quote_requested">
                    {t("admin.order.emailTypeQuote")}
                  </option>
                  <option value="quote_confirmation">
                    {t("admin.order.emailTypeConfirmation")}
                  </option>
                  <option value="order_sent_tracking">
                    {t("admin.order.emailTypeTracking")}
                  </option>
                  <option value="custom">
                    {t("admin.order.emailTypeCustom")}
                  </option>
                </select>
              </div>

              {emailType === "quote_confirmation" && (
                <>
                  <div>
                    <label className="block text-xs uppercase text-[#6c817a]">
                      {t("admin.order.paymentFlowLabel")}
                    </label>
                    <select
                      value={paymentFlow}
                      onChange={(e) => setPaymentFlow(e.target.value)}
                      className="admin-select"
                    >
                      <option value="bank_transfer">
                        {t("admin.order.paymentFlowBankTransfer")}
                      </option>
                    </select>
                  </div>
                  <p className="text-sm text-[#5b706a]">
                    {paymentFlow === "bank_transfer"
                      ? t("admin.order.emailBankTransferNote")
                      : t("admin.order.emailConfirmationNote")}
                  </p>
                </>
              )}

              {emailType === "custom" && (
                <>
                  <div>
                    <label className="block text-xs uppercase text-[#6c817a]">
                      {t("admin.order.emailSubjectLabel")}
                    </label>
                    <input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="admin-field"
                      placeholder={t("admin.order.emailSubjectPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-[#6c817a]">
                      {t("admin.order.emailBodyLabel")}
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={8}
                      className="admin-textarea"
                      placeholder={t("admin.order.emailBodyPlaceholder")}
                    />
                  </div>
                </>
              )}

              {emailType === "order_sent_tracking" && (
                <p className="text-sm text-[#5b706a]">
                  {t("admin.order.emailTrackingNote")}
                </p>
              )}

              {emailType === "custom" && (
                <p className="text-sm text-[#5b706a]">
                  {t("admin.order.emailCustomNote")}
                </p>
              )}

              <button
                type="button"
                onClick={sendCustomerEmail}
                disabled={sendingEmail}
                className="admin-btn admin-btn-primary w-fit"
              >
                {sendingEmail
                  ? t("admin.order.sendingButton")
                  : t("admin.order.sendEmailButton")}
              </button>
            </div>
          </article>

          <article id="admin-order-activity" className="admin-panel p-4">
            <h3 className="font-bold mb-2 text-[#1b2b25]">
              {t("admin.order.notesTitle")}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#5f736d]">
                  {t("admin.order.internalNotesLabel")}
                </label>
                <textarea
                  value={internalNoteInput}
                  onChange={(e) => setInternalNoteInput(e.target.value)}
                  rows={3}
                  className="admin-textarea"
                  placeholder={t("admin.order.internalNotesPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => addNote("internal")}
                  disabled={addingInternalNote}
                  className="admin-btn admin-btn-secondary mt-2"
                >
                  {addingInternalNote
                    ? t("admin.order.savingButton")
                    : t("admin.order.addInternalNoteButton")}
                </button>
              </div>

              {internalNotes.length === 0 ? (
                hasLegacyInternalNote ? (
                  <div className="rounded-lg border border-[#dce7e2] bg-[#f7fbf9] p-3">
                    <p className="text-sm text-[#2e423d] whitespace-pre-wrap">
                      {order.internalNotes}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-[#6c817a]">
                        {t("admin.order.legacyNoteLabel")}
                      </p>
                      <button
                        type="button"
                        onClick={() => deleteNote("legacy-internal")}
                        disabled={deletingNoteId === "legacy-internal"}
                        className="text-xs text-rose-700 hover:underline disabled:opacity-60"
                      >
                        {t("admin.order.deleteNoteButton")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#5f736d]">
                    {t("admin.order.noInternalNotes")}
                  </p>
                )
              ) : (
                <div className="space-y-2">
                  {internalNotes.map((note: OrderNote) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-[#dce7e2] bg-[#f7fbf9] p-3"
                    >
                      <p className="text-sm text-[#2e423d] whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-xs text-[#6c817a]">
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                        {note.id !== "00000000-0000-0000-0000-000000000000" && (
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            disabled={deletingNoteId === note.id}
                            className="text-xs text-rose-700 hover:underline disabled:opacity-60"
                          >
                            {t("admin.order.deleteNoteButton")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#5f736d]">
                  {t("admin.order.customerNotesLabel")}
                </label>
                <textarea
                  value={customerNoteInput}
                  onChange={(e) => setCustomerNoteInput(e.target.value)}
                  rows={3}
                  className="admin-textarea"
                  placeholder={t("admin.order.customerNotesPlaceholder")}
                />
                <button
                  type="button"
                  onClick={() => addNote("customer")}
                  disabled={addingCustomerNote}
                  className="admin-btn admin-btn-primary mt-2"
                >
                  {addingCustomerNote
                    ? t("admin.order.savingButton")
                    : t("admin.order.addCustomerNoteButton")}
                </button>
              </div>

              {customerNotes.length === 0 ? (
                hasLegacyCustomerNote ? (
                  <div className="rounded-lg border border-[#dce7e2] bg-[#f7fbf9] p-3">
                    <p className="text-sm text-[#2e423d] whitespace-pre-wrap">
                      {order.customerNotes}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-[#6c817a]">
                        {t("admin.order.legacyNoteLabel")}
                      </p>
                      <button
                        type="button"
                        onClick={() => deleteNote("legacy-customer")}
                        disabled={deletingNoteId === "legacy-customer"}
                        className="text-xs text-rose-700 hover:underline disabled:opacity-60"
                      >
                        {t("admin.order.deleteNoteButton")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#5f736d]">
                    {t("admin.order.noCustomerNotes")}
                  </p>
                )
              ) : (
                <div className="space-y-2">
                  {customerNotes.map((note: OrderNote) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-[#dce7e2] bg-[#f7fbf9] p-3"
                    >
                      <p className="text-sm text-[#2e423d] whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-xs text-[#6c817a]">
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                        {note.id !== "00000000-0000-0000-0000-000000000000" && (
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            disabled={deletingNoteId === note.id}
                            className="text-xs text-rose-700 hover:underline disabled:opacity-60"
                          >
                            {t("admin.order.deleteNoteButton")}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>

          {payments.length > 0 && (
            <article className="admin-panel p-4">
              <h3 className="font-bold mb-2 text-[#1b2b25]">
                {t("admin.order.paymentAttempts")}
              </h3>
              <p className="mb-3 text-xs text-[#5f736d]">
                {t("admin.order.paymentAttemptsHelpBankTransfer")}
              </p>
              <button
                type="button"
                onClick={markOrderPaid}
                disabled={reconcilingPayments}
                className="admin-btn admin-btn-secondary mb-3"
              >
                {reconcilingPayments ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    {t("admin.order.markingPaid")}
                  </span>
                ) : (
                  t("admin.order.markPaidButton")
                )}
              </button>
              <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="admin-field"
                  placeholder={t("admin.order.paymentSearchPlaceholder")}
                />
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="all">{t("admin.payments.status.all")}</option>
                  <option value="paid">
                    {t("admin.payments.status.paid")}
                  </option>
                  <option value="failed">
                    {t("admin.payments.status.failed")}
                  </option>
                  <option value="expired">
                    {t("admin.payments.status.expired")}
                  </option>
                  <option value="canceled">
                    {t("admin.payments.status.canceled")}
                  </option>
                  <option value="pending">
                    {t("admin.payments.status.pending")}
                  </option>
                  <option value="open">
                    {t("admin.payments.status.open")}
                  </option>
                </select>
                <input
                  type="date"
                  value={paymentFromDate}
                  onChange={(e) => setPaymentFromDate(e.target.value)}
                  className="admin-field"
                />
                <input
                  type="date"
                  value={paymentToDate}
                  onChange={(e) => setPaymentToDate(e.target.value)}
                  className="admin-field"
                />
              </div>
              {payments.length === 0 ? (
                <p className="text-sm text-[#5b706a]">
                  {t("admin.order.noPaymentAttempts")}
                </p>
              ) : filteredPayments.length === 0 ? (
                <p className="text-sm text-[#5b706a]">
                  {t("admin.order.noPaymentAttemptsFiltered")}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-lg border border-[#dce7e2] bg-[#f7fbf9] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#2e423d]">
                          {payment.reference}
                        </p>
                        <span className="text-xs uppercase rounded-full bg-white border border-[#c9d8d1] px-2 py-0.5 text-[#29433a]">
                          {payment.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#2e423d]">
                        {`${payment.currency || ""} ${Number(payment.amount || 0).toFixed(2)}`.trim()}
                      </p>
                      <p className="text-xs text-[#6c817a] mt-1">
                        {t("admin.order.webhookAttempts")}:{" "}
                        {payment.webhookAttemptCount || 0}
                      </p>
                      {payment.providerPaymentId && (
                        <p className="text-xs text-[#6c817a] mt-1 break-all">
                          {t("admin.order.providerId")}:{" "}
                          {payment.providerPaymentId}
                        </p>
                      )}
                      {payment.lastWebhookPayloadHash && (
                        <p className="text-xs text-[#6c817a] mt-1 break-all">
                          {t("admin.order.payloadHash")}:{" "}
                          {payment.lastWebhookPayloadHash}
                        </p>
                      )}
                      {payment.lastWebhookError && (
                        <p className="text-xs text-rose-700 mt-1 break-words">
                          {t("admin.order.lastError")}:{" "}
                          {payment.lastWebhookError}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
