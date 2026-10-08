import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  FileDown,
  XCircle,
  RotateCcw,
  PauseCircle,
  Copy,
  Check,
  Calendar,
  User,
  AlertTriangle,
  PlayCircle,
} from "lucide-react";
import type { OrderDetailsDto, StatusTransitionPayload } from "./types";
import {
  formatOrderStatusLabel,
  getOrderStatusPillClass,
  normalizeOrderStatus,
} from "../../utils/orderStatus";
import { useNotify } from "../../context/NotifyContext";
import { useI18n } from "../../i18n/I18nContext";
import api from "../../services/api";

interface AdminOrderHeaderProps {
  order: OrderDetailsDto;
  onRefresh?: () => Promise<void>;
  onStatusTransition: (
    targetStatus: string,
    payload?: Partial<StatusTransitionPayload>,
  ) => Promise<void>;
  isProcessing: boolean;
}

export default function AdminOrderHeader({
  order,
  onStatusTransition,
  isProcessing,
}: AdminOrderHeaderProps) {
  const { notifySuccess, notifyError } = useNotify();
  const { language } = useI18n();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const normalizedStatus = normalizeOrderStatus(order.status);
  const customerName = order.customer?.fullName || order.fullName || "Customer";
  const createdDate = new Date(order.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(order.id);
    setCopiedId(true);
    notifySuccess("Order ID copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const response = await api.get(`/admin/orders/${order.id}/invoice`, {
        params: { language },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${order.id.slice(0, 8)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      notifySuccess("Invoice downloaded successfully");
    } catch (err) {
      console.error(err);
      notifyError("Failed to download invoice");
    } finally {
      setDownloadingInvoice(false);
      setDropdownOpen(false);
    }
  };

  const handleCancel = async () => {
    setDropdownOpen(false);
    const isPaid = order.isPaid;
    const confirmMsg = isPaid
      ? "Warning: This order has been paid. Cancelling it will flag it for refund review. Continue?"
      : "Are you sure you want to cancel this order?";

    if (window.confirm(confirmMsg)) {
      await onStatusTransition("cancelled");
    }
  };

  const handleRefund = async () => {
    setDropdownOpen(false);
    if (!order.isPaid) {
      notifyError("Cannot refund an order that has not been paid.");
      return;
    }
    if (
      window.confirm(
        "Initiate refund review for this order? This will cancel the order and mark it for payment refund.",
      )
    ) {
      await onStatusTransition("cancelled");
    }
  };

  const handleHoldToggle = async () => {
    setDropdownOpen(false);
    if (normalizedStatus === "on_hold") {
      // Resume order: transition back to an appropriate active status
      const resumeStatus = order.isPaid ? "ready_to_print" : "quote_requested";
      await onStatusTransition(resumeStatus);
    } else {
      const reason = window.prompt("Enter reason for placing order On Hold:");
      if (reason && reason.trim()) {
        await onStatusTransition("on_hold", { holdReason: reason.trim() });
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Back Link & Core Order Meta */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/admin/orders"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Back to Orders"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-base font-bold text-slate-900 tracking-tight">
                  #{order.id.slice(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                  title="Copy full Order ID"
                >
                  {copiedId ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>

              <span className="text-slate-300 hidden sm:inline">|</span>

              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <User size={14} className="text-slate-400" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {customerName}
                </span>
              </div>

              <span className="text-slate-300 hidden sm:inline">|</span>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar size={13} className="text-slate-400" />
                <span>{createdDate}</span>
              </div>
            </div>
          </div>

          {/* Right: State Machine Status Badge + Action Dropdown */}
          <div className="flex items-center gap-3">
            {/* Highly visible State Machine status badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide shadow-sm border ${getOrderStatusPillClass(
                  order.status,
                )}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
                {formatOrderStatusLabel(order.status)}
              </span>

              {order.isPaid && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Paid
                </span>
              )}

              {order.flaggedForRefundReview && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  <AlertTriangle size={11} className="mr-1" /> Refund Review
                </span>
              )}
            </div>

            {/* Top Right Action Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                aria-expanded={dropdownOpen}
              >
                <span>Actions</span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 animate-in fade-in-50 zoom-in-95">
                  <button
                    type="button"
                    onClick={handleDownloadInvoice}
                    disabled={downloadingInvoice}
                    className="w-full text-left px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                  >
                    <FileDown size={16} className="text-slate-500" />
                    <span>
                      {downloadingInvoice
                        ? "Downloading..."
                        : "Download PDF Invoice"}
                    </span>
                  </button>

                  <div className="h-px bg-slate-100 my-1" />

                  {normalizedStatus !== "cancelled" &&
                    normalizedStatus !== "shipped" && (
                      <button
                        type="button"
                        onClick={handleHoldToggle}
                        className="w-full text-left px-3.5 py-2 text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors"
                      >
                        {normalizedStatus === "on_hold" ? (
                          <>
                            <PlayCircle size={16} className="text-amber-600" />
                            <span>Resume Order</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle size={16} className="text-amber-600" />
                            <span>Place On Hold</span>
                          </>
                        )}
                      </button>
                    )}

                  {order.isPaid && (
                    <button
                      type="button"
                      onClick={handleRefund}
                      className="w-full text-left px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                    >
                      <RotateCcw size={16} className="text-rose-500" />
                      <span>Refund Order</span>
                    </button>
                  )}

                  {normalizedStatus !== "cancelled" && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full text-left px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                    >
                      <XCircle size={16} className="text-rose-500" />
                      <span>Cancel Order</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
