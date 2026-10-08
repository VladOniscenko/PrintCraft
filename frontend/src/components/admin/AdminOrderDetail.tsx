import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import AdminLayout from "./AdminLayout";
import AdminBreadcrumb from "./AdminBreadcrumb";
import api from "../../services/api";
import type { OrderDetailsDto, StatusTransitionPayload } from "../admin-order-detail/types";
import { useNotify } from "../../context/NotifyContext";
import { useI18n } from "../../i18n/I18nContext";

// Modular components for Epic 10 Unified Dashboard
import AdminOrderHeader from "../admin-order-detail/AdminOrderHeader";
import CustomerShippingCard from "../admin-order-detail/sidebar/CustomerShippingCard";
import FilesAssetsCard from "../admin-order-detail/sidebar/FilesAssetsCard";
import CommunicationTimelineCard from "../admin-order-detail/sidebar/CommunicationTimelineCard";
import { getStatusPanel } from "../admin-order-detail/panels/panelStrategy";

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { notifyError, notifySuccess } = useNotify();
  const { t } = useI18n();

  const [order, setOrder] = useState<OrderDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Single unified API fetch
  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get<OrderDetailsDto>(`/admin/orders/${id}`);
      setOrder(res.data);
    } catch (err: unknown) {
      console.error("Failed to load unified order details:", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load order details";
      notifyError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [id, notifyError]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Unified State Machine transition handler
  const handleStatusTransition = async (
    targetStatus: string,
    payload?: Partial<StatusTransitionPayload>,
  ) => {
    if (!id) return;
    setIsProcessing(true);
    try {
      if (targetStatus === "paid") {
        await api.put(`/admin/orders/${id}/paid`);
        notifySuccess("Order marked as paid");
      } else {
        await api.patch(`/admin/orders/${id}/status`, {
          targetStatus,
          holdReason: payload?.holdReason,
          assignedPrinter: payload?.assignedPrinter,
          assignedMaterial: payload?.assignedMaterial,
          gCodeFinalized: payload?.gCodeFinalized,
          qualityCheckPassed: payload?.qualityCheckPassed,
          trackingNumber: payload?.trackingNumber,
          trackingUrl: payload?.trackingUrl,
        });
        notifySuccess(`Order status transitioned to ${targetStatus}`);
      }

      await fetchOrder();
    } catch (err: unknown) {
      console.error("Transition failed:", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Status transition rejected by State Machine";
      notifyError(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout wide>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="animate-spin text-teal-600" size={36} />
          <p className="text-sm font-medium text-slate-500">
            Loading unified order dashboard...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout wide>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <AlertCircle className="text-amber-500" size={40} />
          <h2 className="text-lg font-bold text-slate-800">Order Not Found</h2>
          <p className="text-sm text-slate-500">
            The requested order ID does not exist or has been removed.
          </p>
          <Link
            to="/admin/orders"
            className="mt-2 text-sm font-semibold text-teal-700 hover:underline"
          >
            ← Return to Orders List
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // React Strategy Pattern: resolve active Left Column panel based on state machine status
  const DynamicActionPanel = getStatusPanel(order.status);

  return (
    <AdminLayout wide>
      {/* Breadcrumb Navigation */}
      <AdminBreadcrumb
        title={`Order #${order.id.slice(0, 8)}`}
        items={[
          { label: t("breadcrumb.admin") || "Admin", to: "/admin" },
          { label: t("breadcrumb.orders") || "Orders", to: "/admin/orders" },
          { label: `#${order.id.slice(0, 8)}` },
        ]}
      />

      {/* Sticky Header with Order ID, Customer, Date, Status Badge, and Dropdown */}
      <AdminOrderHeader
        order={order}
        onRefresh={fetchOrder}
        onStatusTransition={handleStatusTransition}
        isProcessing={isProcessing}
      />

      {/* Unified Two-Column Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Dynamic Left Column (Strategy Pattern: ~7-8 cols) */}
          <main className="lg:col-span-7 xl:col-span-8 space-y-6">
            <DynamicActionPanel
              order={order}
              onRefresh={fetchOrder}
              onStatusTransition={handleStatusTransition}
              isProcessing={isProcessing}
            />
          </main>

          {/* Persistent Right Column Sidebar (~4-5 cols) */}
          <aside className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Card 1: Customer & Shipping Details */}
            <CustomerShippingCard order={order} onRefresh={fetchOrder} />

            {/* Card 2: Uploaded Files & 3D Assets (.stl, .step, images) */}
            <FilesAssetsCard order={order} />

            {/* Card 3: Unified Communication Timeline & Note Composer */}
            <CommunicationTimelineCard order={order} onRefresh={fetchOrder} />
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
