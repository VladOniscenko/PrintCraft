import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api from "../../services/api";
import type { Order, OrderItem } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { useNotify } from "../../context/NotifyContext";
import { resolveAssetUrl } from "../../utils/assetUrl";
import ModelInspectorModal from "../ModelInspectorModal";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  normalizeOrderStatus,
  getOrderStatusPillClass,
  getOrderStatusTranslationKey,
  formatOrderStatusLabel,
} from "../../utils/orderStatus";
import {
  CreditCard,
  PauseCircle,
  Truck,
  XCircle,
  RotateCcw,
  Info,
  X,
  Box,
  Download,
  FileText,
} from "lucide-react";

const ACTIVE_COLUMNS = [
  { id: "quote_requested", label: "Quote Requested" },
  { id: "awaiting_payment", label: "Awaiting Payment" },
  { id: "ready_to_print", label: "Ready to Print" },
  { id: "printing", label: "Printing" },
  { id: "post_processing", label: "Post-Processing" },
];

const QUICK_DROP_STATUSES = [
  { id: "awaiting_payment", label: "Payments", icon: CreditCard, color: "sky" },
  { id: "on_hold", label: "On Hold", icon: PauseCircle, color: "amber" },
  { id: "shipped", label: "Shipped", icon: Truck, color: "emerald" },
  { id: "cancelled", label: "Cancelled", icon: XCircle, color: "rose" },
  { id: "returned", label: "Returned", icon: RotateCcw, color: "purple" },
];

export function getOrderTotal(order: Order): number | null {
  if (order.quotedPrice != null && order.quotedPrice > 0) return order.quotedPrice;
  if (order.finalTotalAmount != null && order.finalTotalAmount > 0) return order.finalTotalAmount;
  if (order.items && order.items.length > 0) {
    const itemsSubtotal = order.items.reduce((sum, item) => {
      const unit =
        item.unitPrice !== undefined && item.unitPrice > 0
          ? item.unitPrice
          : item.price || 0;
      const plate = item.plateCost ?? 2.0;
      return sum + unit * (item.count || 1) + plate;
    }, 0);
    if (itemsSubtotal > 0) {
      return Math.max(
        0,
        itemsSubtotal +
          (order.deliveryPrice || 0) +
          (order.serviceFeePrice || 0) -
          (order.orderDiscountAmount || 0),
      );
    }
  }
  return null;
}

export interface OrderItemModelFile {
  fileName: string;
  fileUrl: string;
}

export function getAllOrderItemModelFiles(item: OrderItem): OrderItemModelFile[] {
  const models: OrderItemModelFile[] = [];
  const seenUrls = new Set<string>();

  const isModel = (name?: string, url?: string, kind?: string) => {
    if (kind === "model") return true;
    const cleanExt = (name || url || "").split("?")[0].split(".").pop()?.toLowerCase();
    return cleanExt ? ["stl", "obj", "3mf", "step", "stp", "glb", "gltf"].includes(cleanExt) : false;
  };

  // 1. Direct item.fileUrl
  if (item.fileUrl && !seenUrls.has(item.fileUrl)) {
    const is3d = isModel(item.fileName, item.fileUrl);
    if (is3d || (!item.files?.length && !(item.attachments as unknown[])?.length)) {
      seenUrls.add(item.fileUrl);
      models.push({
        fileName: item.fileName || "Model",
        fileUrl: item.fileUrl,
      });
    }
  }

  // 2. Attached files in item.files
  for (const f of item.files || []) {
    if (f?.url && !seenUrls.has(f.url) && isModel(f.name, f.url, f.kind)) {
      seenUrls.add(f.url);
      models.push({
        fileName: f.name || "Model",
        fileUrl: f.url,
      });
    }
  }

  // 3. Attachments in item.attachments
  for (const a of (item.attachments as unknown as Array<{ url?: string; fileName?: string; name?: string; kind?: string }>) || []) {
    const url = a?.url;
    const name = a?.fileName || a?.name || "Model";
    if (url && !seenUrls.has(url) && isModel(name, url, a?.kind)) {
      seenUrls.add(url);
      models.push({
        fileName: name,
        fileUrl: url,
      });
    }
  }

  // Fallback: if no model found yet, but item.fileUrl exists
  if (models.length === 0 && item.fileUrl && !seenUrls.has(item.fileUrl)) {
    models.push({
      fileName: item.fileName || "Model",
      fileUrl: item.fileUrl,
    });
  }

  // Prioritize GLB/GLTF models so textured previews show first
  models.sort((a, b) => {
    const extA = (a.fileName || a.fileUrl || "").toLowerCase().split(".").pop() || "";
    const extB = (b.fileName || b.fileUrl || "").toLowerCase().split(".").pop() || "";
    const isGlbA = extA === "glb" || extA === "gltf";
    const isGlbB = extB === "glb" || extB === "gltf";
    if (isGlbA && !isGlbB) return -1;
    if (!isGlbA && isGlbB) return 1;
    return 0;
  });

  return models;
}

export interface OrderItemPricingResult {
  unitPrice: number;
  plateCost: number;
  itemTotal: number;
  isPendingQuote: boolean;
}

export function getOrderItemPricing(
  item: OrderItem,
  order?: Order | null,
): OrderItemPricingResult {
  const count = item.count && item.count > 0 ? item.count : 1;
  const plateCost = item.plateCost ?? 2.0;

  // 1. Direct item unit price (if > 0)
  let unit =
    item.unitPrice !== undefined && item.unitPrice !== null && Number(item.unitPrice) > 0
      ? Number(item.unitPrice)
      : 0;

  // 2. Fall back to item.price (if > 0)
  if (unit <= 0 && item.price !== undefined && item.price !== null && Number(item.price) > 0) {
    unit = Number(item.price);
  }

  // 3. Fall back: if unit is still 0, check if the parent order has a quotedPrice or finalTotalAmount
  if (unit <= 0 && order) {
    const orderTotal = getOrderTotal(order);
    if (orderTotal != null && orderTotal > 0 && order.items && order.items.length > 0) {
      const otherFees =
        (order.deliveryPrice || 0) +
        (order.serviceFeePrice || 0) -
        (order.orderDiscountAmount || 0);
      const subtotal = Math.max(0, orderTotal - otherFees);

      if (order.items.length === 1) {
        // Single item in the order
        const derived = Math.max(0, subtotal - plateCost) / count;
        if (derived > 0) {
          unit = Math.round(derived * 100) / 100;
        } else if (orderTotal > 0) {
          unit = Math.round((orderTotal / count) * 100) / 100;
        }
      } else {
        // Multi-item order where individual item unit prices are 0
        const allItemsZero = order.items.every(
          (i) => (!i.unitPrice || Number(i.unitPrice) <= 0) && (!i.price || Number(i.price) <= 0),
        );
        if (allItemsZero && subtotal > 0) {
          const totalCount = order.items.reduce((sum, i) => sum + (i.count || 1), 0);
          const totalPlates = order.items.length * plateCost;
          const remainingForUnits = Math.max(0, subtotal - totalPlates);
          if (totalCount > 0 && remainingForUnits > 0) {
            unit = Math.round((remainingForUnits / totalCount) * 100) / 100;
          }
        }
      }
    }
  }

  const isPendingQuote =
    unit <= 0 &&
    (!order || (order.quotedPrice == null && order.finalTotalAmount == null));

  const itemTotal = unit > 0 ? unit * count + plateCost : 0;

  return { unitPrice: unit, plateCost, itemTotal, isPendingQuote };
}

function OrderCardView({
  order,
  onShowInfo,
  isOverlay = false,
  t,
}: {
  order: Order;
  onShowInfo?: (order: Order) => void;
  isOverlay?: boolean;
  t: (key: string) => string;
}) {
  const statusKey = getOrderStatusTranslationKey(order.status);
  const statusLabel = statusKey ? t(statusKey) : formatOrderStatusLabel(order.status);
  const total = getOrderTotal(order);

  return (
    <div
      className={`bg-white p-2.5 rounded-lg border shadow-sm transition-all flex flex-col gap-1.5 overflow-hidden ${
        isOverlay
          ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-2xl rotate-1 scale-105 pointer-events-none z-[9999]"
          : "border-gray-200 hover:border-emerald-400 hover:shadow-md cursor-grab active:cursor-grabbing mb-2 group"
      }`}
    >
      <div className="flex justify-between items-center gap-1.5 min-w-0">
        <Link
          to={`/admin/orders/${order.id}`}
          className="font-black text-emerald-700 hover:text-emerald-900 hover:underline text-xs shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
        >
          #{order.id.slice(0, 8)}
        </Link>
        <span
          className={`text-[10px] px-2 py-0.5 rounded font-semibold truncate max-w-[135px] text-right ${getOrderStatusPillClass(
            order.status,
          )}`}
          title={statusLabel}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex justify-between items-center gap-1">
        <p
          className="text-xs text-gray-800 font-bold truncate leading-tight flex-1"
          title={order.fullName}
        >
          {order.fullName}
        </p>
        {!isOverlay && onShowInfo && (
          <button
            type="button"
            className="text-gray-400 hover:text-emerald-600 p-0.5 rounded cursor-pointer shrink-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShowInfo(order);
            }}
            title={t("admin.orders.kanbanOrderInfoTitle") || "View order details"}
          >
            <Info size={14} />
          </button>
        )}
      </div>

      <div className="flex justify-between items-center pt-1 border-t border-gray-100 text-[10px] text-gray-500">
        <span className="font-medium text-gray-400">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
        <span className="font-bold text-gray-900">
          {total != null ? `€${total.toFixed(2)}` : "-"}
        </span>
      </div>
    </div>
  );
}

function SortableOrderCard({
  order,
  onShowInfo,
  t,
}: {
  order: Order;
  onShowInfo?: (order: Order) => void;
  t: (key: string) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id, data: { order } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 rounded-lg p-3 mb-2 h-20"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OrderCardView order={order} onShowInfo={onShowInfo} t={t} />
    </div>
  );
}

function QuickDropColumn({
  id,
  label,
  icon: Icon,
  color,
  activeDragItem,
  count,
  t,
}: {
  id: string;
  label: string;
  icon: any;
  color: string;
  activeDragItem: Order | null;
  count: number;
  t: (key: string) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const colorStyles: Record<
    string,
    {
      border: string;
      bg: string;
      activeBg: string;
      text: string;
      icon: string;
    }
  > = {
    sky: {
      border: "border-sky-200",
      bg: "bg-sky-50/50",
      activeBg: "bg-sky-100 ring-2 ring-sky-500 border-sky-400",
      text: "text-sky-900",
      icon: "text-sky-600",
    },
    amber: {
      border: "border-amber-200",
      bg: "bg-amber-50/50",
      activeBg: "bg-amber-100 ring-2 ring-amber-500 border-amber-400",
      text: "text-amber-900",
      icon: "text-amber-600",
    },
    emerald: {
      border: "border-emerald-200",
      bg: "bg-emerald-50/50",
      activeBg: "bg-emerald-100 ring-2 ring-emerald-500 border-emerald-400",
      text: "text-emerald-900",
      icon: "text-emerald-600",
    },
    rose: {
      border: "border-rose-200",
      bg: "bg-rose-50/50",
      activeBg: "bg-rose-100 ring-2 ring-rose-500 border-rose-400",
      text: "text-rose-900",
      icon: "text-rose-600",
    },
    purple: {
      border: "border-purple-200",
      bg: "bg-purple-50/50",
      activeBg: "bg-purple-100 ring-2 ring-purple-500 border-purple-400",
      text: "text-purple-900",
      icon: "text-purple-600",
    },
  };

  const style = colorStyles[color] || colorStyles.sky;

  return (
    <div
      ref={setNodeRef}
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-150 min-h-[76px] ${
        isOver
          ? `${style.activeBg} scale-[1.02] shadow-md z-10`
          : activeDragItem
          ? `${style.bg} ${style.border} border-dashed`
          : `${style.bg} ${style.border}`
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={16} className={style.icon} />
        <span className={`font-bold text-xs ${style.text}`}>
          {t(`orderStatus.${id}`) || label}
        </span>
        <span className="bg-white/80 border border-gray-200 text-gray-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
          {count}
        </span>
      </div>
      <p className="text-[10px] text-gray-500 font-medium">
        {isOver
          ? `✓ ${t("admin.orders.kanbanDropAction") || "Drop to set status"}`
          : activeDragItem
          ? t("admin.orders.dropAction") || "Drop here to move"
          : t("admin.orders.kanbanDropAction") || "Drop ticket to change status"}
      </p>
    </div>
  );
}

function Column({
  id,
  title,
  orders,
  t,
}: {
  id: string;
  title: string;
  orders: Order[];
  t: (key: string) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl bg-gray-50/90 p-3 min-w-[270px] w-[270px] border transition-colors ${
        isOver ? "border-emerald-500 ring-2 ring-emerald-400/30 bg-emerald-50/20" : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-bold text-sm text-gray-800">{title}</h3>
        <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {orders.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
        <SortableContext
          id={id}
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[120px]">
            {orders.length === 0 ? (
              <div className="h-24 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 italic">
                {t("admin.orders.kanbanEmptyColumn") || "No orders in this stage"}
              </div>
            ) : (
              orders.map((order) => (
                <SortableOrderCard
                  key={order.id}
                  order={order}
                  onShowInfo={(o) =>
                    window.dispatchEvent(
                      new CustomEvent("show-order-info", { detail: o }),
                    )
                  }
                  t={t}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { t } = useI18n();
  const { notifySuccess, notifyError } = useNotify();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDragItem, setActiveDragItem] = useState<Order | null>(null);
  const [infoDialogOrder, setInfoDialogOrder] = useState<Order | null>(null);
  const [previewModel, setPreviewModel] = useState<{
    fileName: string;
    fileUrl?: string;
    material?: string;
    color?: string;
    printQuality?: string;
    infillPercent?: number;
    size?: string;
    count?: number;
    scaleFactor?: number;
    itemIndex?: number;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const handleShowInfo = (e: any) => setInfoDialogOrder(e.detail);
    window.addEventListener("show-order-info", handleShowInfo);
    return () => window.removeEventListener("show-order-info", handleShowInfo);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders?pageSize=1000`);
      const normalizedOrders = res.data.results.map((o: Order) => ({
        ...o,
        status: normalizeOrderStatus(o.status),
      }));
      setOrders(normalizedOrders);
    } catch (err) {
      console.error(err);
      notifyError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const order = orders.find((o) => o.id === active.id);
    if (order) setActiveDragItem(order);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    // Do NOT mutate order status in local state when dragging over quick drop zones
    if (QUICK_DROP_STATUSES.some((q) => q.id === overId)) {
      return;
    }

    // Only update position within active columns
    const overOrder = orders.find((o) => o.id === overId);
    if (!overOrder) return;

    const activeOrder = orders.find((o) => o.id === activeId);
    if (!activeOrder) return;

    const overStatus = normalizeOrderStatus(overOrder.status);
    if (activeOrder.status !== overStatus) {
      if (ACTIVE_COLUMNS.some((c) => c.id === overStatus)) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === activeId ? { ...o, status: overStatus as any } : o,
          ),
        );
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const originalItem = activeDragItem;
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over || !originalItem) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    let targetStatus = "";
    if (
      QUICK_DROP_STATUSES.some((c) => c.id === overId) ||
      ACTIVE_COLUMNS.some((c) => c.id === overId)
    ) {
      targetStatus = overId;
    } else {
      const overOrder = orders.find((o) => o.id === overId);
      if (overOrder) {
        targetStatus = normalizeOrderStatus(overOrder.status);
      }
    }

    if (!targetStatus || normalizeOrderStatus(originalItem.status) === targetStatus) {
      return;
    }

    let holdReason = undefined;
    let qualityCheckPassed = false;
    let trackingNumber = undefined;
    let trackingUrl = undefined;

    if (targetStatus === "on_hold") {
      const reason = window.prompt(
        t("admin.orders.promptHoldReason") ||
          "Enter reason for placing order on hold:",
      );
      if (reason === null) return;
      if (!reason.trim()) {
        notifyError("Hold reason cannot be empty.");
        return;
      }
      holdReason = reason.trim();
    } else if (targetStatus === "shipped") {
      if (
        !window.confirm(
          t("admin.orders.confirmQualityPassed") ||
            "Has the quality check passed?",
        )
      ) {
        return;
      }
      const tracking = window.prompt(
        t("admin.orders.promptTrackingNumber") ||
          "Enter Tracking Number:",
      );
      if (tracking === null) return;
      if (!tracking.trim()) {
        notifyError("Tracking number is required to mark as shipped.");
        return;
      }
      qualityCheckPassed = true;
      trackingNumber = tracking.trim();

      const trackingUrlInput = window.prompt(
        t("admin.orders.promptTrackingUrl") ||
          "Enter Tracking URL for the customer (optional):",
      );
      if (trackingUrlInput !== null && trackingUrlInput.trim()) {
        trackingUrl = trackingUrlInput.trim();
      }
    } else if (targetStatus === "cancelled") {
      if (!window.confirm("Are you sure you want to cancel this order?")) {
        return;
      }
    }

    try {
      await api.patch(`/admin/orders/${activeId}/status`, {
        targetStatus,
        holdReason,
        qualityCheckPassed,
        trackingNumber,
        trackingUrl,
      });
      notifySuccess(
        t("admin.orders.kanbanMoveSuccess") || "Status updated successfully",
      );
      await fetchOrders();
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        t("admin.orders.kanbanMoveFailed") ||
        "Failed to update status. Validation failed.";
      notifyError(errMsg);
      await fetchOrders();
    }
  };

  const getOrdersForStatus = (statusId: string) => {
    const filtered = orders.filter(
      (o) => normalizeOrderStatus(o.status) === statusId,
    );
    if (statusId === "quote_requested") {
      return filtered
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        .slice(0, 15);
    }
    return filtered;
  };

  if (loading && orders.length === 0) {
    return (
      <AdminLayout wide>
        <div className="flex justify-center p-12 text-gray-500 font-semibold">
          {t("admin.orders.kanbanLoading")}
        </div>
      </AdminLayout>
    );
  }

  const dialogOrderTotal = infoDialogOrder ? getOrderTotal(infoDialogOrder) : null;

  return (
    <AdminLayout wide>
      <AdminBreadcrumb
        title={t("admin.orders.kanbanTitle")}
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: t("admin.orders.kanbanBreadcrumb") },
        ]}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Quick-drop action columns row above kanban */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t("admin.orders.kanbanQuickActionsTitle")}
            </h2>
            <span className="text-[11px] text-gray-400">
              {t("admin.orders.kanbanQuickActionsSubtitle")}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {QUICK_DROP_STATUSES.map((col) => (
              <QuickDropColumn
                key={col.id}
                id={col.id}
                label={col.label}
                icon={col.icon}
                color={col.color}
                activeDragItem={activeDragItem}
                count={
                  orders.filter(
                    (o) => normalizeOrderStatus(o.status) === col.id,
                  ).length
                }
                t={t}
              />
            ))}
          </div>
        </div>

        {/* Backlog accordion */}
        <details
          id="backlog-details"
          className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        >
          <summary className="cursor-pointer p-3.5 font-bold text-gray-800 bg-gray-50/80 hover:bg-gray-100 flex justify-between items-center transition-colors">
            <span className="text-sm">
              {t("admin.orders.kanbanOrdersBacklog")} ({orders.length}{" "}
              {t("admin.orders.kanbanTotal")})
            </span>
            <span className="text-xs text-gray-500 font-normal">
              {t("admin.orders.kanbanClickToExpand")}
            </span>
          </summary>
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder={
                  t("admin.orders.searchPlaceholder") ||
                  "Search by ID or Name..."
                }
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">
                  {t("admin.orders.kanbanAllStatuses")}
                </option>
                {ACTIVE_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(`orderStatus.${c.id}`) || c.label}
                  </option>
                ))}
                {QUICK_DROP_STATUSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(`orderStatus.${c.id}`) || c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-900 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="p-2 font-semibold">
                      {t("admin.orders.kanbanColumnId")}
                    </th>
                    <th className="p-2 font-semibold">
                      {t("admin.orders.columnCustomer")}
                    </th>
                    <th className="p-2 font-semibold">
                      {t("admin.orders.columnStatus")}
                    </th>
                    <th className="p-2 font-semibold">
                      {t("admin.orders.kanbanColumnDate")}
                    </th>
                    <th className="p-2 font-semibold">
                      {t("admin.orders.kanbanColumnPrice")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter((o) => {
                      const matchSearch =
                        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        o.fullName
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase());
                      const matchStatus =
                        statusFilter === "all" ||
                        normalizeOrderStatus(o.status) === statusFilter;
                      return matchSearch && matchStatus;
                    })
                    .map((o) => {
                      const total = getOrderTotal(o);
                      return (
                        <tr
                          key={o.id}
                          className="border-t border-gray-100 hover:bg-gray-50/80"
                        >
                          <td className="p-2 font-mono text-xs">
                            <Link
                              to={`/admin/orders/${o.id}`}
                              className="text-emerald-700 font-bold hover:underline"
                            >
                              #{o.id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="p-2">{o.fullName}</td>
                          <td className="p-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold truncate max-w-[150px] inline-block ${getOrderStatusPillClass(
                                o.status,
                              )}`}
                              title={
                                t(`orderStatus.${o.status}`) ||
                                formatOrderStatusLabel(o.status)
                              }
                            >
                              {t(`orderStatus.${o.status}`) ||
                                formatOrderStatusLabel(o.status)}
                            </span>
                          </td>
                          <td className="p-2">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-2 font-bold text-gray-900">
                            {total != null ? `€${total.toFixed(2)}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </details>

        {/* Main Production Pipeline Kanban */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 px-1">
            {t("admin.orders.kanbanActivePipeline")}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-6 px-1 items-start min-h-[460px]">
            {ACTIVE_COLUMNS.map((col) => (
              <Column
                key={col.id}
                id={col.id}
                title={t(`orderStatus.${col.id}`) || col.label}
                orders={getOrdersForStatus(col.id)}
                t={t}
              />
            ))}
          </div>
        </div>

        {/* Drag Overlay: floats completely unclipped above everything */}
        <DragOverlay dropAnimation={null}>
          {activeDragItem ? (
            <div className="w-[260px]">
              <OrderCardView order={activeDragItem} isOverlay t={t} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Info Dialog */}
      {infoDialogOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setInfoDialogOrder(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col p-6 relative border border-gray-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                    {t("admin.orders.kanbanOrderInfoTitle") || "Order Items Preview"}
                  </h3>
                  <span className="font-mono text-emerald-700 font-black text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    #{infoDialogOrder.id.slice(0, 8)}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold truncate max-w-[150px] shrink-0 ${getOrderStatusPillClass(
                      infoDialogOrder.status,
                    )}`}
                    title={
                      getOrderStatusTranslationKey(infoDialogOrder.status)
                        ? t(getOrderStatusTranslationKey(infoDialogOrder.status)!)
                        : formatOrderStatusLabel(infoDialogOrder.status)
                    }
                  >
                    {getOrderStatusTranslationKey(infoDialogOrder.status)
                      ? t(getOrderStatusTranslationKey(infoDialogOrder.status)!)
                      : formatOrderStatusLabel(infoDialogOrder.status)}
                  </span>
                  {dialogOrderTotal != null && dialogOrderTotal > 0 && (
                    <span className="font-mono text-emerald-800 font-black text-xs sm:text-sm bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300 shrink-0">
                      Total: €{dialogOrderTotal.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  <span className="font-medium text-gray-700">{infoDialogOrder.fullName}</span>
                  <span className="mx-1.5">•</span>
                  <span>{new Date(infoDialogOrder.createdAt).toLocaleDateString()}</span>
                  {infoDialogOrder.items && (
                    <>
                      <span className="mx-1.5">•</span>
                      <span>
                        {infoDialogOrder.items.length}{" "}
                        {infoDialogOrder.items.length === 1 ? "item" : "items"}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInfoDialogOrder(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[56vh]">
              {infoDialogOrder.items && infoDialogOrder.items.length > 0 ? (
                infoDialogOrder.items.map((item, idx) => {
                  const modelFiles = getAllOrderItemModelFiles(item);
                  const pricing = getOrderItemPricing(item, infoDialogOrder);

                  return (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-400">
                            #{String(idx + 1).padStart(2, "0")}
                          </span>
                          <h4
                            className="text-sm font-semibold text-gray-900 truncate"
                            title={item.fileName || "Custom Item"}
                          >
                            {item.fileName || "Custom 3D Item"}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-gray-600">
                          <span className="px-2 py-0.5 rounded bg-white border border-gray-200 font-semibold text-gray-700">
                            {item.count || 1}x
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white border border-gray-200 font-medium">
                            {item.material || "PLA"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white border border-gray-200 font-medium">
                            {item.color || "Default"}
                          </span>
                          {item.size && (
                            <span className="px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-500">
                              {item.size}
                            </span>
                          )}
                          <span className="text-gray-400">•</span>
                          {pricing.isPendingQuote ? (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Pending Quote
                            </span>
                          ) : (
                            <>
                              <span className="text-gray-700 font-medium">
                                Unit: €{pricing.unitPrice.toFixed(2)}
                              </span>
                              {pricing.plateCost > 0 && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-500">
                                    Plate: €{pricing.plateCost.toFixed(2)}
                                  </span>
                                </>
                              )}
                              <span className="text-gray-400">•</span>
                              <span className="text-emerald-700 font-bold">
                                Total: €{pricing.itemTotal.toFixed(2)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions / 3D Preview */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60">
                        {modelFiles.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {modelFiles.map((m, mIdx) => (
                              <div key={mIdx} className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewModel({
                                      fileName: m.fileName,
                                      fileUrl: m.fileUrl,
                                      material: item.material,
                                      color: item.color,
                                      printQuality: item.printQuality,
                                      infillPercent: item.infillPercent,
                                      size: item.size,
                                      count: item.count,
                                      scaleFactor: item.scaleFactor,
                                      itemIndex: idx,
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
                                  title={m.fileName}
                                >
                                  <Box size={14} />
                                  <span>
                                    {modelFiles.length > 1
                                      ? `3D #${mIdx + 1}`
                                      : t("admin.orders.preview3D") || "Preview 3D"}
                                  </span>
                                </button>
                                <a
                                  href={resolveAssetUrl(m.fileUrl)}
                                  download={m.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors"
                                  title={`Download ${m.fileName}`}
                                >
                                  <Download size={14} />
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic flex items-center gap-1">
                            <FileText size={13} />
                            {t("admin.orders.no3dModel") || "No 3D model"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  {t("admin.orders.kanbanNoItems") || "No items in this order."}
                </div>
              )}
            </div>

            {/* Order Financial Breakdown Summary */}
            {dialogOrderTotal != null && dialogOrderTotal > 0 && (
              <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2.5 text-slate-600">
                  {infoDialogOrder.deliveryPrice != null && infoDialogOrder.deliveryPrice > 0 && (
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                      Delivery: €{infoDialogOrder.deliveryPrice.toFixed(2)}
                    </span>
                  )}
                  {infoDialogOrder.serviceFeePrice != null && infoDialogOrder.serviceFeePrice > 0 && (
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                      Service Fee: €{infoDialogOrder.serviceFeePrice.toFixed(2)}
                    </span>
                  )}
                  {infoDialogOrder.orderDiscountAmount != null && infoDialogOrder.orderDiscountAmount > 0 && (
                    <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700 font-semibold">
                      Discount: -€{infoDialogOrder.orderDiscountAmount.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-900 ml-auto">
                  <span>Order Total:</span>
                  <span className="text-sm font-mono text-emerald-700 font-black">
                    €{dialogOrderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-3">
              <Link
                to={`/admin/orders/${infoDialogOrder.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
              >
                {t("admin.orders.openOrderDetails") || "Open Full Order Details"} →
              </Link>
              <button
                type="button"
                className="admin-btn admin-btn-secondary px-5 py-2 font-bold text-xs"
                onClick={() => setInfoDialogOrder(null)}
              >
                {t("admin.orders.kanbanClose") || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Model Inspector Modal */}
      {previewModel && (
        <ModelInspectorModal
          isOpen={true}
          onClose={() => setPreviewModel(null)}
          fileName={previewModel.fileName}
          fileUrl={previewModel.fileUrl}
          material={previewModel.material}
          color={previewModel.color}
          printQuality={previewModel.printQuality}
          infillPercent={previewModel.infillPercent}
          size={previewModel.size}
          count={previewModel.count}
          scaleFactor={previewModel.scaleFactor}
          itemIndex={previewModel.itemIndex}
          zIndexClassName="z-[120]"
        />
      )}
    </AdminLayout>
  );
}
