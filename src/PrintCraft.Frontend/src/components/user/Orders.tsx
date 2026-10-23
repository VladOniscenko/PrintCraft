import { useEffect, useState } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  FileText,
  ChevronRight,
  Loader2,
  Box,
  MapPin,
} from "lucide-react";
import Navbar from "../Navbar";
import type { Order } from "../../types";
import api from "../../services/api";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import Footer from "../Footer";
import {
  formatOrderStatusLabel,
  getOrderStatusBadgeClass,
  getOrderStatusTranslationKey,
  normalizeOrderStatus,
} from "../../utils/orderStatus";

export default function Orders() {
  const { t, localizePath } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders");
        setOrders(response.data);
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusLabel = (status: string) => {
    const translationKey = getOrderStatusTranslationKey(status);
    return translationKey ? t(translationKey) : formatOrderStatusLabel(status);
  };

  const visibleOrders = orders.filter(
    (order) => normalizeOrderStatus(order.status) !== "cancelled",
  );

  const isMeaningfulField = (value?: string) => {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase();
    return (
      normalized !== "" &&
      normalized !== "0" &&
      normalized !== "null" &&
      normalized !== "undefined" &&
      normalized !== "n/a" &&
      normalized !== "na" &&
      normalized !== "-"
    );
  };

  const getShippingCity = (order: Order) => {
    const city = String(order.city ?? "").trim();
    const hasCity = isMeaningfulField(city);
    const hasAddressLine = isMeaningfulField(order.addressLine1);
    const hasPostalCode = isMeaningfulField(order.postalCode);
    const isPendingQuote =
      normalizeOrderStatus(order.status) === "pending_quote";

    if (!hasCity) return null;
    if (isPendingQuote && (!hasAddressLine || !hasPostalCode)) return null;

    return city;
  };

  return (
    <div className="site-shell">
      <Navbar />

      <main className="site-main max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-100 shadow-2xs">
              <Package size={14} className="text-[#133827]" />
              <span>{t("orders.title")}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
              {t("orders.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              {t("orders.subtitle")}
            </p>
          </div>
          <Link
            to={localizePath("/checkout")}
            className="inline-flex items-center justify-center gap-2 bg-[#133827] hover:bg-[#1c4d37] text-white px-6 py-3 rounded-full text-xs font-semibold transition-all shadow-sm cursor-pointer shrink-0 self-start sm:self-center"
          >
            <span>{t("orders.start")}</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
            <p className="text-sm font-medium">{t("orders.loading")}</p>
          </div>
        ) : orders.length === 0 || visibleOrders.length === 0 ? (
          <div className="rounded-3xl border border-gray-200/80 bg-white p-12 sm:p-16 text-center shadow-xs max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-5 border border-gray-200/60 shadow-2xs">
              <Box size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {t("orders.none")}
            </h3>
            <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
              {t("orders.noneDesc")}
            </p>
            <Link
              to={localizePath("/checkout")}
              className="inline-flex items-center justify-center gap-2 bg-[#133827] hover:bg-[#1c4d37] text-white px-8 py-3.5 rounded-full text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              <span>{t("orders.start")}</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOrders.map((order) => {
              const shippingCity = getShippingCity(order);

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    {/* Status & Date */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${getOrderStatusBadgeClass(order.status)}`}
                      >
                        <BoxIcon status={order.status} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                            {t("orders.project")} #{order.id.slice(0, 8)}
                          </h3>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getOrderStatusBadgeClass(order.status)}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span>
                            {t("orders.placedOn")}{" "}
                            {new Date(order.createdAt).toLocaleDateString(
                              undefined,
                              { dateStyle: "medium" },
                            )}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                            <Package size={13} className="text-gray-400" />
                            {order.items?.length || 0}{" "}
                            {order.items?.length === 1
                              ? t("orders.model")
                              : t("orders.models")}
                          </span>
                          {shippingCity && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="inline-flex items-center gap-1 text-gray-600">
                                <MapPin size={13} className="text-gray-400" />
                                {shippingCity}
                              </span>
                            </>
                          )}
                        </div>
                        {Number(order.orderDiscountAmount ?? 0) > 0 &&
                          normalizeOrderStatus(order.status) !==
                            "pending_quote" && (
                            <p className="text-xs text-emerald-700 font-semibold mt-1">
                              {t("orderDetail.discount")}: -€
                              {Number(order.orderDiscountAmount).toFixed(2)}
                            </p>
                          )}
                      </div>
                    </div>

                    {/* View Button */}
                    <div className="flex items-center justify-end sm:justify-center shrink-0">
                      <Link
                        to={localizePath(`/orders/${order.id}`)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gray-100 hover:bg-[#133827] text-gray-800 hover:text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                      >
                        <span>{t("orders.manage")}</span>
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// Icon Logic
function BoxIcon({ status }: { status: string }) {
  const s = normalizeOrderStatus(status);
  if (s === "printing") return <Clock size={24} />;
  if (s === "completed") return <CheckCircle size={24} />;
  if (s === "shipped") return <Truck size={24} />;
  return <FileText size={24} />;
}
