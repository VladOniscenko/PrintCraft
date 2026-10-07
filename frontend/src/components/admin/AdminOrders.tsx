import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api from "../../services/api";
import type { Order } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { useNotify } from "../../context/NotifyContext";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  normalizeOrderStatus,
  getOrderStatusPillClass,
  getOrderStatusTranslationKey,
  formatOrderStatusLabel
} from "../../utils/orderStatus";

const ACTIVE_COLUMNS = [
  { id: "quote_requested", label: "Quote Requested" },
  { id: "awaiting_payment", label: "Awaiting Payment" },
  { id: "ready_to_print", label: "Ready to Print" },
  { id: "printing", label: "Printing" },
  { id: "post_processing", label: "Post-Processing" },
];

const EXCEPTION_COLUMNS = [
  { id: "shipped", label: "Shipped (Closed)" },
  { id: "on_hold", label: "On Hold" },
  { id: "cancelled", label: "Cancelled" },
  { id: "returned", label: "Returned" },
];

function SortableOrderCard({ order }: { order: Order }) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const statusKey = getOrderStatusTranslationKey(order.status);
  
  const itemsText = order.items && order.items.length > 0 
    ? order.items.map(i => `${i.count}x ${i.fileName || 'Item'} (${i.color} ${i.material})`).join("\n") 
    : "No items";
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm mb-2 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-md transition-all flex flex-col gap-1.5 relative group"
    >
      <div className="flex justify-between items-center gap-2">
        <Link
          to={`/admin/orders/${order.id}`}
          className="font-black text-emerald-700 hover:text-emerald-900 hover:underline text-xs"
          onPointerDown={(e) => e.stopPropagation()}
        >
          #{order.id.slice(0, 8)}
        </Link>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${getOrderStatusPillClass(order.status)}`}>
          {statusKey ? statusKey : formatOrderStatusLabel(order.status)}
        </span>
      </div>
      
      <div className="flex justify-between items-center gap-2">
        <p className="text-xs text-gray-800 font-bold truncate leading-tight" title={order.fullName}>
          {order.fullName}
        </p>
        <div 
          className="text-gray-400 hover:text-emerald-600 cursor-help flex-shrink-0" 
          title={itemsText}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div className="flex justify-between items-center mt-0.5 pt-1 border-t border-gray-100 text-[10px] text-gray-500">
        <span className="font-medium text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
        <span className="font-bold text-gray-900">
          {order.quotedPrice != null ? `€${order.quotedPrice.toFixed(2)}` : "-"}
        </span>
      </div>
    </div>
  );
}

function Column({ id, title, orders, isException = false }: { id: string; title: string; orders: Order[]; isException?: boolean }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`flex flex-col rounded-xl bg-gray-50 p-3 min-w-[280px] w-[280px] ${isException ? 'border border-dashed border-gray-300' : 'border border-gray-200'}`}>
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className={`font-bold text-sm ${isException ? 'text-gray-600' : 'text-gray-800'}`}>{title}</h3>
        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{orders.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SortableContext
          id={id}
          items={orders.map(o => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[100px]">
            {orders.map(order => (
              <SortableOrderCard key={order.id} order={order} />
            ))}
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch all recent orders for the board (Kanban typically loads active ones, we fetch top 100 for simplicity)
      const res = await api.get(`/admin/orders?pageSize=1000`);
      // Normalize statuses for local state
      const normalizedOrders = res.data.results.map((o: Order) => ({
        ...o,
        status: normalizeOrderStatus(o.status)
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
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const order = orders.find(o => o.id === active.id);
    if (order) setActiveDragItem(order);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;

    const activeOrder = orders.find(o => o.id === activeId);
    if (!activeOrder) return;

    let targetStatus = "";
    if (ACTIVE_COLUMNS.some(c => c.id === overId) || EXCEPTION_COLUMNS.some(c => c.id === overId)) {
      targetStatus = overId as string;
    } else {
      const overOrder = orders.find(o => o.id === overId);
      if (overOrder) {
        targetStatus = normalizeOrderStatus(overOrder.status);
      }
    }

    if (!targetStatus || activeOrder.status === targetStatus) return;

    // Visually move the item to the new column during drag
    setOrders((prev) => 
      prev.map(o => o.id === activeId ? { ...o, status: targetStatus as any } : o)
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const originalItem = activeDragItem;
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over || !originalItem) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine the target column. It can be a column ID or another item ID.
    let targetStatus = "";
    if (ACTIVE_COLUMNS.some(c => c.id === overId) || EXCEPTION_COLUMNS.some(c => c.id === overId)) {
      targetStatus = overId as string;
    } else {
      const overOrder = orders.find(o => o.id === overId);
      if (overOrder) {
        targetStatus = normalizeOrderStatus(overOrder.status);
      }
    }

    if (!targetStatus || originalItem.status === targetStatus) return;

    // Determine if we need prompt inputs (like OnHold reason, or ReadyToPrint details)
    let holdReason = undefined;
    let assignedPrinter = undefined;
    let assignedMaterial = undefined;
    let gCodeFinalized = false;
    let qualityCheckPassed = false;
    let trackingNumber = undefined;

    if (targetStatus === "on_hold") {
      const reason = window.prompt("Enter reason for placing order on hold:");
      if (reason === null) return; // User cancelled
      holdReason = reason;
    } else if (targetStatus === "shipped") {
      if (!window.confirm("Has the quality check passed?")) return;
      const tracking = window.prompt("Enter Tracking Number:");
      if (tracking === null) return;
      qualityCheckPassed = true;
      trackingNumber = tracking;
    }

    try {
      await api.patch(`/admin/orders/${activeId}/status`, {
        targetStatus,
        holdReason,
        assignedPrinter,
        assignedMaterial,
        gCodeFinalized,
        qualityCheckPassed,
        trackingNumber
      });
      notifySuccess("Status updated successfully");
      
      // Refresh to get full updated state from server
      fetchOrders();
    } catch (err: any) {
      // Revert optimistic update using original item status
      setOrders(prev => prev.map(o => o.id === activeId ? { ...o, status: originalItem.status } : o));
      notifyError(err?.response?.data?.message || "Failed to update status. Validation failed.");
    }
  };

  const getOrdersForStatus = (statusId: string) => {
    const filtered = orders.filter(o => normalizeOrderStatus(o.status) === statusId);
    if (statusId === "quote_requested") {
      return filtered
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, 10);
    }
    return filtered;
  };

  if (loading && orders.length === 0) {
    return (
      <AdminLayout wide>
        <div className="flex justify-center p-12">Loading Kanban Board...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout wide>
      <AdminBreadcrumb
        title="Production Kanban"
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: "Orders Kanban" },
        ]}
      />

      <details className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <summary className="cursor-pointer p-4 font-bold text-gray-800 bg-gray-50 rounded-lg hover:bg-gray-100 flex justify-between items-center">
          <span>Orders Backlog ({orders.length} total)</span>
          <span className="text-xs text-gray-500 font-normal">Click to expand</span>
        </summary>
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-4 mb-4">
            <input 
              type="text" 
              placeholder="Search by ID or Name..." 
              className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-1"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select 
              className="border border-gray-300 rounded px-3 py-1.5 text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {ACTIVE_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              {EXCEPTION_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 sticky top-0">
                <tr>
                  <th className="p-2 font-semibold">ID</th>
                  <th className="p-2 font-semibold">Customer</th>
                  <th className="p-2 font-semibold">Status</th>
                  <th className="p-2 font-semibold">Date</th>
                  <th className="p-2 font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(o => {
                  const matchSearch = (o.id.toLowerCase().includes(searchQuery.toLowerCase()) || o.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
                  const matchStatus = statusFilter === "all" || normalizeOrderStatus(o.status) === statusFilter;
                  return matchSearch && matchStatus;
                }).map(o => (
                  <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs"><Link to={`/admin/orders/${o.id}`} className="text-emerald-600 hover:underline">#{o.id.slice(0, 8)}</Link></td>
                    <td className="p-2">{o.fullName}</td>
                    <td className="p-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getOrderStatusPillClass(o.status)}`}>
                        {formatOrderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="p-2">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="p-2 font-bold">{o.quotedPrice != null ? `€${o.quotedPrice.toFixed(2)}` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-8 h-[calc(100vh-140px)]">
          {/* Active Pipeline */}
          <div className="flex-1">
            <h2 className="text-lg font-black text-gray-900 mb-4 px-2">Active Pipeline</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 px-2 h-full items-start">
              {ACTIVE_COLUMNS.map(col => (
                <Column 
                  key={col.id} 
                  id={col.id} 
                  title={col.label} 
                  orders={getOrdersForStatus(col.id)} 
                />
              ))}
            </div>
          </div>
          
          {/* Exceptions & Closed */}
          <div className="h-1/3 min-h-[300px]">
            <h2 className="text-lg font-black text-gray-900 mb-4 px-2">Exceptions & Closed</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 px-2 items-start">
              {EXCEPTION_COLUMNS.map(col => (
                <Column 
                  key={col.id} 
                  id={col.id} 
                  title={col.label} 
                  orders={getOrdersForStatus(col.id)} 
                  isException={true}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeDragItem ? <SortableOrderCard order={activeDragItem} /> : null}
        </DragOverlay>
      </DndContext>
    </AdminLayout>
  );
}
