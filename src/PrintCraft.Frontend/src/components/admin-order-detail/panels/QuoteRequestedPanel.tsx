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
import { useI18n } from "../../../i18n/I18nContext";
import ModelInspectorModal from "../../ModelInspectorModal";
import AdminItemChangeRequestControl from "../items/AdminItemChangeRequestControl";

export default function QuoteRequestedPanel({
  order,
  onRefresh,
}: StatusPanelProps) {
  const { notifySuccess, notifyError } = useNotify();
  const { t } = useI18n();

  // Pricing engine states
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [itemPlateCosts, setItemPlateCosts] = useState<Record<string, number>>({});
  const [deliveryPrice, setDeliveryPrice] = useState<number>(order.deliveryPrice ?? 4.95);
  const [serviceFee, setServiceFee] = useState<number>(order.serviceFeePrice ?? 5.00);
  const [orderDiscount, setOrderDiscount] = useState<number>(order.orderDiscountAmount ?? 0);
  const [quoteMessage, setQuoteMessage] = useState<string>(
    order.quoteMessage ||
      t("admin.orderDetail.panels.quoteRequested.defaultQuoteMessage"),
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
        notifySuccess(t("admin.orderDetail.panels.quoteRequested.itemPricedSuccess"));
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
      notifySuccess(t("admin.orderDetail.panels.quoteRequested.allPricedSuccess"));
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
      notifyError(t("admin.orderDetail.panels.quoteRequested.quoteMessageRequired"));
      return;
    }

    if (grandTotal <= 0) {
      notifyError(t("admin.orderDetail.panels.quoteRequested.totalMustBePositive"));
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

      notifySuccess(t("admin.orderDetail.panels.quoteRequested.quoteFinalizedSuccess"));
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
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 uppercase tracking-wide">
              {t("admin.orderDetail.panels.quoteRequested.badge")}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t("admin.orderDetail.panels.quoteRequested.title")}
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
            {t("admin.orderDetail.panels.quoteRequested.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCalculateAllPrices}
          disabled={calculatingAll}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-200 dark:bg-amber-900/50 hover:bg-amber-300 dark:hover:bg-amber-900/80 transition-colors shadow-2xs disabled:opacity-50"
        >
          <Sparkles size={14} className={calculatingAll ? "animate-spin" : ""} />
          <span>
            {calculatingAll
              ? t("admin.orderDetail.panels.quoteRequested.calculatingAll")
              : t("admin.orderDetail.panels.quoteRequested.recalculateAll")}
          </span>
        </button>
      </div>

      {/* Item List & Item Pricing Overrides */}
      <div className="bg-white dark:bg-[#0e1512] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={16} className="text-teal-600 dark:text-teal-400" />
            <span>{t("admin.orderDetail.panels.quoteRequested.itemsHeading", { count: order.items?.length || 0 })}</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-gray-400">
            {t("admin.orderDetail.panels.quoteRequested.itemsSubtitle")}
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
                className="p-4 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3"
              >
                {/* Item Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {item.fileName || t("admin.orderDetail.panels.quoteRequested.modelItemFallback")}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {item.material} • {item.color}
                        </span>
                        {item.size && (
                          <span className="text-slate-600">{t("admin.orderDetail.panels.quoteRequested.size")} {item.size}</span>
                        )}
                        <span>{t("admin.orderDetail.panels.quoteRequested.qty")} <strong>{count}</strong></span>
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
                          <span>{t("admin.orderDetail.panels.quoteRequested.preview3d")}</span>
                        </button>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => handleCalculateItemPrice(item.id)}
                      disabled={isCalculating}
                      className="p-1.5 px-2.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                      title={t("admin.orderDetail.panels.quoteRequested.calcPriceTooltip")}
                    >
                      <Calculator size={13} className={isCalculating ? "animate-spin" : ""} />
                      <span>{isCalculating ? t("admin.orderDetail.panels.quoteRequested.calculatingItem") : t("admin.orderDetail.panels.quoteRequested.autoPrice")}</span>
                    </button>
                  </div>
                </div>

                {/* Slicing Manufacturing Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/60 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Layers size={13} className="text-slate-400" />
                    <span>{t("admin.orderDetail.panels.quoteRequested.infill")} <strong>{item.infillPercent}%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wrench size={13} className="text-slate-400" />
                    <span>{t("admin.orderDetail.panels.quoteRequested.quality")} <strong>{item.printQuality || t("admin.orderDetail.panels.quoteRequested.standardQuality")}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>{t("admin.orderDetail.panels.quoteRequested.time")} <strong>{item.estimatedPrintTime || "N/A"}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Weight size={13} className="text-slate-400" />
                    <span>{t("admin.orderDetail.panels.quoteRequested.filament")} <strong>{item.filamentUsedGrams ? `${item.filamentUsedGrams}g` : "N/A"}</strong></span>
                  </div>
                </div>

                {/* Pricing Inputs */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200/60">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Unit Price */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                        {t("admin.orderDetail.panels.quoteRequested.unitPrice")}
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
                        {t("admin.orderDetail.panels.quoteRequested.plateCost")}
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
                    <span className="text-[11px] text-slate-500 block">{t("admin.orderDetail.panels.quoteRequested.lineTotal")}</span>
                    <strong className="text-sm font-mono text-slate-900">
                      {formatCurrencyAmount(itemTotal)}
                    </strong>
                  </div>
                </div>

                {/* Change Request & Revision Loop Control */}
                <AdminItemChangeRequestControl
                  orderId={order.id}
                  itemId={item.id}
                  itemFileName={item.fileName}
                  activeChangeRequest={item.activeChangeRequest}
                  changeRequests={item.changeRequests}
                  onRefresh={onRefresh}
                  onPreviewModel={(fileUrl, fileName) =>
                    setPreviewItem({
                      ...item,
                      fileUrl,
                      fileName: fileName || item.fileName || "model",
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Fee Controls & Grand Total */}
      <form onSubmit={handleFinalizeQuote} className="bg-white dark:bg-[#0e1512] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-2">
          <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
          <span>{t("admin.orderDetail.panels.quoteRequested.feesHeading")}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Setup Fee */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <Wrench size={13} className="text-slate-400 dark:text-gray-400" />
              <span>{t("admin.orderDetail.panels.quoteRequested.setupServiceFee")}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 dark:text-gray-400">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={serviceFee}
                onChange={(e) => setServiceFee(parseFloat(e.target.value) || 0)}
                className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#141e1a] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Delivery Price */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <Truck size={13} className="text-slate-400 dark:text-gray-400" />
              <span>{t("admin.orderDetail.panels.quoteRequested.deliveryPrice")}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 dark:text-gray-400">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#141e1a] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Order Discount */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <Tag size={13} className="text-slate-400 dark:text-gray-400" />
              <span>{t("admin.orderDetail.panels.quoteRequested.orderDiscount")}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 dark:text-gray-400">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                className="w-full text-xs pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#141e1a] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Payment Flow */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
              {t("admin.orderDetail.panels.quoteRequested.paymentFlow")}
            </label>
            <select
              value={paymentFlow}
              onChange={(e) => setPaymentFlow(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#141e1a] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="bank_transfer">{t("admin.orderDetail.panels.quoteRequested.bankTransferManual")}</option>
            </select>
          </div>
        </div>

        {/* Quote Message (Gate for State Machine) */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1 flex items-center justify-between">
            <span>{t("admin.orderDetail.panels.quoteRequested.customerQuoteMessageLabel")}</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">{t("admin.orderDetail.panels.quoteRequested.requiredByStateMachine")}</span>
          </label>
          <textarea
            value={quoteMessage}
            onChange={(e) => setQuoteMessage(e.target.value)}
            rows={3}
            required
            placeholder={t("admin.orderDetail.panels.quoteRequested.messagePlaceholder")}
            className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-[#141e1a] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none leading-relaxed"
          />
        </div>

        {/* Pricing Summary Calculation */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-gray-300">
            <span>{t("admin.orderDetail.panels.quoteRequested.subtotalSummary")}</span>
            <span className="font-mono">{formatCurrencyAmount(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-gray-300">
            <span>{t("admin.orderDetail.panels.quoteRequested.setupFeeSummary")}</span>
            <span className="font-mono">+{formatCurrencyAmount(serviceFee)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-gray-300">
            <span>{t("admin.orderDetail.panels.quoteRequested.deliveryFeeSummary")}</span>
            <span className="font-mono">+{formatCurrencyAmount(deliveryPrice)}</span>
          </div>
          {orderDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
              <span>{t("admin.orderDetail.panels.quoteRequested.discountSummary")}</span>
              <span className="font-mono">-{formatCurrencyAmount(orderDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/10 text-sm font-bold text-slate-900 dark:text-white">
            <span>{t("admin.orderDetail.panels.quoteRequested.finalTotalSummary")}</span>
            <span className="text-base font-mono text-teal-800 dark:text-teal-300">
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
            <span>
              {isFinalizing
                ? t("admin.orderDetail.panels.quoteRequested.processingQuote")
                : t("admin.orderDetail.panels.quoteRequested.finalizeAndSend")}
            </span>
          </button>
        </div>
      </form>

      {/* 3D Preview Inspector Modal */}
      {previewItem && (
        <ModelInspectorModal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          fileName={previewItem.fileName || t("orderDetail.model")}
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
