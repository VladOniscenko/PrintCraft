import { useState, useEffect } from "react";
import {
  Calculator,
  Send,
  Sparkles,
  Layers,
  Wrench,
  Truck,
  Tag,
  DollarSign,
  Clock,
  Weight,
  Eye,
} from "lucide-react";
import type { StatusPanelProps } from "../types";
import { formatCurrencyAmount } from "../../../utils/currency";
import api from "../../../services/api";
import { useNotify } from "../../../context/NotifyContext";
import ModelInspectorModal from "../../ModelInspectorModal";

export default function QuoteRequestedPanel({
  order,
  onRefresh,
}: StatusPanelProps) {
  const { notifySuccess, notifyError } = useNotify();

  // Pricing engine states
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [itemPlateCosts, setItemPlateCosts] = useState<Record<string, number>>({});
  const [deliveryPrice, setDeliveryPrice] = useState<number>(order.deliveryPrice ?? 4.95);
  const [serviceFee, setServiceFee] = useState<number>(order.serviceFeePrice ?? 5.00);
  const [orderDiscount, setOrderDiscount] = useState<number>(order.orderDiscountAmount ?? 0);
  const [quoteMessage, setQuoteMessage] = useState<string>(
    order.quoteMessage ||
      "Thank you for your quote request. We reviewed your files and determined the production cost based on materials, print time, and finishing.",
  );
  const [paymentFlow, setPaymentFlow] = useState<string>(order.paymentFlow || "bank_transfer");

  // Loading states
  const [calculatingAll, setCalculatingAll] = useState(false);
  const [calculatingItemId, setCalculatingItemId] = useState<string | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // 3D preview modal
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  // Initialize prices from order items
  useEffect(() => {
    const prices: Record<string, number> = {};
    const plates: Record<string, number> = {};

    (order.items || []).forEach((item) => {
      const price = item.unitPrice > 0 ? item.unitPrice : item.price || 0;
      prices[item.id] = price;
      plates[item.id] = item.plateCost ?? 2.0;
    });

    setItemPrices(prices);
    setItemPlateCosts(plates);
    setDeliveryPrice(order.deliveryPrice ?? 4.95);
    setServiceFee(order.serviceFeePrice ?? 5.00);
    setOrderDiscount(order.orderDiscountAmount ?? 0);
  }, [order]);

  // Recalculate Subtotal & Grand Total
  const subtotal = (order.items || []).reduce((sum, item) => {
    const fallbackPrice = item.unitPrice > 0 ? item.unitPrice : item.price || 0;
    const unit = itemPrices[item.id] ?? fallbackPrice;
    const plate = itemPlateCosts[item.id] ?? item.plateCost ?? 2.0;
    const count = item.count <= 0 ? 1 : item.count;
    return sum + unit * count + plate;
  }, 0);

  const grandTotal = Math.max(0, subtotal + deliveryPrice + serviceFee - orderDiscount);

  // Calculate price for single item via Epic 4 Pricing Engine
  const handleCalculateItemPrice = async (itemId: string) => {
    setCalculatingItemId(itemId);
    try {
      const res = await api.post(`/admin/orders/${order.id}/items/${itemId}/calculate-price`);
      const updated = res.data;
      if (updated && updated.unitPrice !== undefined) {
        setItemPrices((prev) => ({ ...prev, [itemId]: updated.unitPrice }));
        if (updated.plateCost !== undefined) {
          setItemPlateCosts((prev) => ({ ...prev, [itemId]: updated.plateCost }));
        }
        notifySuccess("Item price calculated via 3D Pricing Engine");
        await onRefresh();
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to calculate item price";
      notifyError(errMsg);
    } finally {
      setCalculatingItemId(null);
    }
  };

  // Calculate price for all items via Epic 4 Pricing Engine
  const handleCalculateAllPrices = async () => {
    setCalculatingAll(true);
    try {
      await api.post(`/admin/orders/${order.id}/calculate-price`);
      notifySuccess("All items priced via 3D Pricing Engine");
      await onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to calculate all prices";
      notifyError(errMsg);
    } finally {
      setCalculatingAll(false);
    }
  };

  // Finalize quote & request payment CTA
  const handleFinalizeQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quoteMessage.trim()) {
      notifyError("A quote message is required to confirm customer notes were reviewed.");
      return;
    }

    if (grandTotal <= 0) {
      notifyError("Quoted total must be greater than zero.");
      return;
    }

    setIsFinalizing(true);
    try {
      await api.post(`/admin/orders/${order.id}/process-quote`, {
        itemPrices,
        itemPlateCosts,
        deliveryPrice,
        serviceFeePrice: serviceFee,
        orderDiscountAmount: orderDiscount,
        quoteMessage: quoteMessage.trim(),
        paymentFlow,
      });

      notifySuccess("Quote finalized! Customer has been notified and requested for payment.");
      await onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to finalize quote.";
      notifyError(errMsg);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-200 text-amber-900 uppercase tracking-wide">
              Action Required
            </span>
            <h2 className="text-base font-bold text-slate-900">
              3D Pricing Engine & Quote Review
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Review uploaded 3D geometries, adjust slicer pricing overrides, set delivery and setup fees, and finalize quote for customer payment.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCalculateAllPrices}
          disabled={calculatingAll}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-900 bg-amber-200 hover:bg-amber-300 transition-colors shadow-2xs disabled:opacity-50"
        >
          <Sparkles size={14} className={calculatingAll ? "animate-spin" : ""} />
          <span>{calculatingAll ? "Calculating All..." : "Run Auto-Pricer on All Items"}</span>
        </button>
      </div>

      {/* Item List & Item Pricing Overrides */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Layers size={16} className="text-teal-600" />
            <span>Order Line Items ({order.items?.length || 0})</span>
          </h3>
          <span className="text-xs text-slate-500">
            Set unit prices and plate setup fees per item
          </span>
        </div>

        <div className="space-y-4">
          {(order.items || []).map((item, index) => {
            const fallbackPrice = item.unitPrice > 0 ? item.unitPrice : item.price || 0;
            const unitPrice = itemPrices[item.id] ?? fallbackPrice;
            const plateCost = itemPlateCosts[item.id] ?? item.plateCost ?? 2.0;
            const count = item.count <= 0 ? 1 : item.count;
            const itemTotal = unitPrice * count + plateCost;
            const isCalculating = calculatingItemId === item.id;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3"
              >
                {/* Item Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {item.fileName || "3D Model Item"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {item.material} • {item.color}
                        </span>
                        {item.size && (
                          <span className="text-slate-600">Size: {item.size}</span>
                        )}
                        <span>Qty: <strong>{count}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const glbFile =
                        (item.attachments || []).find((a: any) =>
                          (a.url || a.fileName || "").toLowerCase().endsWith(".glb") ||
                          (a.url || a.fileName || "").toLowerCase().endsWith(".gltf"),
                        ) ||
                        (item.files || []).find((f: any) =>
                          (f.url || f.name || "").toLowerCase().endsWith(".glb") ||
                          (f.url || f.name || "").toLowerCase().endsWith(".gltf"),
                        );
                      const has3D =
                        !!item.fileUrl ||
                        !!glbFile ||
                        (item.attachments || []).some((a: any) => a.kind === "model") ||
                        [".stl", ".obj", ".3mf", ".glb", ".gltf"].some((ext) =>
                          (item.fileName || "").toLowerCase().endsWith(ext),
                        );

                      if (!has3D) return null;

                      return (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewItem(
                              glbFile
                                ? {
                                    ...item,
                                    fileUrl:
                                      (glbFile as any).url ||
                                      (glbFile as any).fileUrl,
                                    fileName:
                                      (glbFile as any).fileName ||
                                      (glbFile as any).name ||
                                      item.fileName ||
                                      "relief.glb",
                                  }
                                : item,
                            )
                          }
                          className="p-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                        >
                          <Eye size={13} />
                          <span>3D Preview</span>
                        </button>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => handleCalculateItemPrice(item.id)}
                      disabled={isCalculating}
                      className="p-1.5 px-2.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Calculate price using geometry analyzer"
                    >
                      <Calculator size={13} className={isCalculating ? "animate-spin" : ""} />
                      <span>{isCalculating ? "Calculating..." : "Auto-Price"}</span>
                    </button>
                  </div>
                </div>

                {/* Slicing Manufacturing Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/60 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Layers size={13} className="text-slate-400" />
                    <span>Infill: <strong>{item.infillPercent}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wrench size={13} className="text-slate-400" />
                    <span>Quality: <strong>{item.printQuality || "Standard"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>Time: <strong>{item.estimatedPrintTime || "N/A"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Weight size={13} className="text-slate-400" />
                    <span>Filament: <strong>{item.filamentUsedGrams ? `${item.filamentUsedGrams}g` : "N/A"}</strong></span>
                  </div>
                </div>

                {/* Pricing Inputs */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200/60">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Unit Price */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Unit Price (€)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">€</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={unitPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItemPrices((prev) => ({ ...prev, [item.id]: val }));
                          }}
                          className="w-28 text-xs pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Plate Setup Cost */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        Plate Cost (€)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">€</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={plateCost}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItemPlateCosts((prev) => ({ ...prev, [item.id]: val }));
                          }}
                          className="w-28 text-xs pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Line Total</span>
                    <strong className="text-sm font-mono text-slate-900">
                      {formatCurrencyAmount(itemTotal)}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Fee Controls & Grand Total */}
      <form onSubmit={handleFinalizeQuote} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
        <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <DollarSign size={16} className="text-emerald-600" />
          <span>Fees, Discounts & Final Quote Message</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Setup Fee */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Wrench size={13} className="text-slate-400" />
              <span>Setup / Service Fee (€)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={serviceFee}
                onChange={(e) => setServiceFee(parseFloat(e.target.value) || 0)}
                className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Delivery Price */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Truck size={13} className="text-slate-400" />
              <span>Delivery Price (€)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Order Discount */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400" />
              <span>Order Discount (€)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Payment Flow */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Payment Flow
            </label>
            <select
              value={paymentFlow}
              onChange={(e) => setPaymentFlow(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="bank_transfer">Bank Transfer (Manual)</option>
            </select>
          </div>
        </div>

        {/* Quote Message (Gate for State Machine) */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
            <span>Customer Quote Message (Confirms notes reviewed) *</span>
            <span className="text-[10px] text-amber-700 font-medium">Required by State Machine</span>
          </label>
          <textarea
            value={quoteMessage}
            onChange={(e) => setQuoteMessage(e.target.value)}
            rows={3}
            required
            placeholder="Enter the quote review message for the customer..."
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none leading-relaxed"
          />
        </div>

        {/* Pricing Summary Calculation */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal (Items + Plate setup):</span>
            <span className="font-mono">{formatCurrencyAmount(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Setup / Service Fee:</span>
            <span className="font-mono">+{formatCurrencyAmount(serviceFee)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee:</span>
            <span className="font-mono">+{formatCurrencyAmount(deliveryPrice)}</span>
          </div>
          {orderDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Discount Amount:</span>
              <span className="font-mono">-{formatCurrencyAmount(orderDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
            <span>Final Quoted Total:</span>
            <span className="text-base font-mono text-teal-800">
              {formatCurrencyAmount(grandTotal)}
            </span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isFinalizing || grandTotal <= 0 || !quoteMessage.trim()}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send size={16} />
            <span>{isFinalizing ? "Processing Quote..." : "Finalize Quote & Request Payment"}</span>
          </button>
        </div>
      </form>

      {/* 3D Preview Inspector Modal */}
      {previewItem && (
        <ModelInspectorModal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          fileName={previewItem.fileName || "Model"}
          fileUrl={previewItem.fileUrl}
          material={previewItem.material}
          color={previewItem.color}
          size={previewItem.size}
          infillPercent={previewItem.infillPercent}
          printQuality={previewItem.printQuality}
        />
      )}
    </div>
  );
}
