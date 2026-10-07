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
  const { t } = useI18n();
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

      <main className="site-main max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="site-heading text-3xl font-bold tracking-tight">
              {t("orders.title")}
            </h1>
            <p className="site-subheading mt-1">{t("orders.subtitle")}</p>
          </div>
          <div className="hidden sm:block p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Package size={32} className="text-emerald-600" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
            <p className="font-medium">{t("orders.loading")}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Box className="text-gray-300" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {t("orders.none")}
            </h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
              {t("orders.noneDesc")}
            </p>
            <Link
              to="/checkout"
              className="inline-block bg-[#133827] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#1c4d37] transition-all shadow-lg shadow-emerald-900/10"
            >
              {t("orders.start")}
            </Link>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Box className="text-gray-300" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {t("orders.none")}
            </h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
              {t("orders.noneDesc")}
            </p>
            <Link
              to="/checkout"
              className="inline-block bg-[#133827] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#1c4d37] transition-all shadow-lg shadow-emerald-900/10"
            >
              {t("orders.start")}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleOrders.map((order) => {
              const shippingCity = getShippingCity(order);

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Status & Date */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-4 rounded-2xl border ${getOrderStatusBadgeClass(order.status)}`}
                      >
                        <BoxIcon status={order.status} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">
                            {t("orders.project")} #{order.id.slice(0, 8)}
                          </h3>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${getOrderStatusBadgeClass(order.status)}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {t("orders.placedOn")}{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            undefined,
                            { dateStyle: "long" },
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Summary of items */}
                    <div className="flex-1 lg:px-10 border-gray-100 lg:border-x">
                      <div className="flex items-center gap-2 text-gray-600 mb-1 text-sm font-bold">
                        <Package size={14} />
                        {order.items?.length || 0}{" "}
                        {order.items?.length === 1
                          ? t("orders.model")
                          : t("orders.models")}
                      </div>
                      {shippingCity && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin size={12} /> {t("orders.shippingTo")}{" "}
                          {shippingCity}
                        </p>
                      )}
                      {Number(order.orderDiscountAmount ?? 0) > 0 &&
                        normalizeOrderStatus(order.status) !==
                          "pending_quote" && (
                          <p className="text-xs text-emerald-700 font-semibold mt-1">
                            {t("orderDetail.discount")}: -€
                            {Number(order.orderDiscountAmount).toFixed(2)}
                          </p>
                        )}
                    </div>

                    {/* View Button */}
                    <Link
                      to={`/orders/${order.id}`}
                      className="flex items-center justify-center gap-2 bg-gray-50 text-gray-900 px-6 py-3 rounded-xl font-bold text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all"
                    >
                      {t("orders.manage")} <ChevronRight size={18} />
                    </Link>
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
