import type { Dispatch, SetStateAction } from "react";
import { Link } from "react-router-dom";
import type { Order } from "../../types";
import { resolveAssetUrl } from "../../utils/assetUrl";
import { CURRENCY_CODE, formatCurrencyAmount } from "../../utils/currency";

interface OrderPricingPanelProps {
  order: Order;
  t: (key: string) => string;
  itemPrices: Record<string, number>;
  setItemPrices: Dispatch<SetStateAction<Record<string, number>>>;
  savingItemId: string | null;
  updateItemPrice: (itemId: string, price: number) => Promise<void>;
  calculateItemPrice: (itemId: string) => Promise<void>;
  calculatingPriceId: string | null;
  deliveryPrice: number;
  setDeliveryPrice: Dispatch<SetStateAction<number>>;
  savingDelivery: boolean;
  updateDeliveryPrice: (price: number) => Promise<void>;
  serviceFee: number;
  setServiceFee: Dispatch<SetStateAction<number>>;
  savingServiceFee: boolean;
  updateServiceFee: (fee: number) => Promise<void>;
  orderDiscountAmount: number;
  setOrderDiscountAmount: Dispatch<SetStateAction<number>>;
  savingOrderDiscount: boolean;
  updateOrderDiscount: (discount: number) => Promise<void>;
  subtotal: number;
  totalPrice: number;
  pricingLocked: boolean;
}

type ItemFile = {
  url: string;
  name: string;
  kind: "model" | "image" | "other";
};

function getFileKindFromName(name?: string): "model" | "image" | "other" {
  const value = (name || "").toLowerCase();
  if (
    value.endsWith(".stl") ||
    value.endsWith(".obj") ||
    value.endsWith(".3mf") ||
    value.endsWith(".step") ||
    value.endsWith(".stp")
  ) {
    return "model";
  }

  if (
    value.endsWith(".png") ||
    value.endsWith(".jpg") ||
    value.endsWith(".jpeg") ||
    value.endsWith(".webp") ||
    value.endsWith(".gif")
  ) {
    return "image";
  }

  return "other";
}

function getItemFiles(item: {
  files?: Array<{
    url: string;
    name: string;
    kind?: "model" | "image" | "other";
  }>;
  attachments?: Array<{
    url: string;
    fileName?: string;
    kind?: "model" | "image" | "other";
  }>;
  fileUrl?: string;
  fileName?: string;
  imageUrl?: string;
}): ItemFile[] {
  const entries: ItemFile[] = [];

  for (const file of item.files || []) {
    if (!file?.url) continue;
    entries.push({
      url: file.url,
      name: file.name || "file",
      kind: file.kind || getFileKindFromName(file.name),
    });
  }

  for (const file of item.attachments || []) {
    if (!file?.url) continue;
    const name = file.fileName || "file";
    const exists = entries.some((entry) => entry.url === file.url);
    if (exists) continue;
    entries.push({
      url: file.url,
      name,
      kind: file.kind || getFileKindFromName(name),
    });
  }

  if (item.fileUrl) {
    const exists = entries.some((file) => file.url === item.fileUrl);
    if (!exists) {
      entries.push({
        url: item.fileUrl,
        name: item.fileName || "model",
        kind: "model",
      });
    }
  }

  if (item.imageUrl) {
    const exists = entries.some((file) => file.url === item.imageUrl);
    if (!exists) {
      entries.push({
        url: item.imageUrl,
        name: "image",
        kind: "image",
      });
    }
  }

  return entries;
}

function getFileTypeBadgeClass(kind: ItemFile["kind"]): string {
  if (kind === "model") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (kind === "image")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function getFileTypeBadgeLabel(
  kind: ItemFile["kind"],
  t: (key: string) => string,
): string {
  if (kind === "model") return t("admin.orderDetail.fileTypeModel");
  if (kind === "image") return t("admin.orderDetail.fileTypeImage");
  return t("admin.orderDetail.fileTypeFile");
}

export default function OrderPricingPanel({
  order,
  t,
  itemPrices,
  setItemPrices,
  savingItemId,
  updateItemPrice,
  calculateItemPrice,
  calculatingPriceId,
  deliveryPrice,
  setDeliveryPrice,
  savingDelivery,
  updateDeliveryPrice,
  serviceFee,
  setServiceFee,
  savingServiceFee,
  updateServiceFee,
  orderDiscountAmount,
  setOrderDiscountAmount,
  savingOrderDiscount,
  updateOrderDiscount,
  subtotal,
  totalPrice,
  pricingLocked,
}: OrderPricingPanelProps) {
  const isCancelledOrder = (order.status || "").toLowerCase() === "cancelled";

  return (
    <article className="admin-panel p-4">
      <h2 className="font-bold mb-2 text-[#1b2b25]">
        {t("admin.orderDetail.modelFilesTitle")}
      </h2>
      {order.items.length === 0 ? (
        <p className="admin-note">{t("admin.orderDetail.noItemsMessage")}</p>
      ) : (
        <div className="space-y-5">
          {order.items.map((item, idx) => {
            const itemFiles = getItemFiles(item);
            const hasModel = itemFiles.some((f) => f.kind === "model");
            return (
              <div
                key={item.id || item.fileName}
                className="rounded-xl border border-[#d9e4df] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header with item number */}
                <div className="bg-gradient-to-r from-[#eef4f1] to-[#f7fcf9] px-5 py-3 border-b border-[#d9e4df]">
                  <h3 className="font-bold text-[#1b2b25] text-sm">
                    {t("admin.orderDetail.itemLabel")} #{idx + 1}
                  </h3>
                </div>

                {/* Content area */}
                <div className="p-5">
                  {/* File info */}
                  <div className="mb-4">
                    <p className="text-xs uppercase text-[#6c817a] font-semibold mb-1">
                      {t("admin.orderDetail.fileLabel")}
                    </p>
                    <p className="text-sm font-medium text-[#1b2b25] break-all">
                      {item.fileName ?? item.fileUrl ?? "—"}
                    </p>
                    {itemFiles.length > 0 &&
                      (isCancelledOrder ? (
                        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                          {t("admin.orderDetail.filesRemovedDueCancellation")}
                        </p>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {itemFiles.map((file, fileIndex) => {
                            const lowerUrl = file.url.toLowerCase();
                            const canOpenInViewer =
                              lowerUrl.includes(".stl") ||
                              lowerUrl.includes(".png") ||
                              lowerUrl.includes(".jpg") ||
                              lowerUrl.includes(".jpeg") ||
                              lowerUrl.includes(".webp") ||
                              lowerUrl.includes(".gif");
                            return (
                              <div
                                key={`${file.url}-${fileIndex}`}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#d9e4df] bg-[#fbfefd] px-2 py-1"
                              >
                                <span
                                  className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getFileTypeBadgeClass(file.kind)}`}
                                >
                                  {getFileTypeBadgeLabel(file.kind, t)}
                                </span>
                                <span className="max-w-[180px] truncate text-xs text-[#2f4a42]">
                                  {file.name}
                                </span>
                                <a
                                  href={resolveAssetUrl(file.url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                                >
                                  ↓ {t("admin.orderDetail.downloadFile")}
                                </a>
                                {canOpenInViewer && (
                                  <Link
                                    to={`/admin/orders/${order.id}/models/${idx}?file=${fileIndex}`}
                                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                                  >
                                    {file.kind === "image"
                                      ? t("admin.orderDetail.viewImage")
                                      : t("admin.orderDetail.viewModel")}
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                  </div>

                  {/* Specs grid */}
                  <div className="grid grid-cols-5 gap-4 mb-4 pb-4 border-b border-[#eef4f1]">
                    <div>
                      <p className="text-xs uppercase text-[#6c817a] font-semibold mb-2">
                        {t("admin.orderDetail.materialLabel")}
                      </p>
                      <p className="text-sm font-medium text-[#22342f]">
                        {item.material}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[#6c817a] font-semibold mb-2">
                        {t("admin.orderDetail.colorLabel")}
                      </p>
                      <p className="text-sm font-medium text-[#22342f]">
                        {item.color}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[#6c817a] font-semibold mb-2">
                        {t("admin.orderDetail.sizeLabel")}
                      </p>
                      <p className="text-sm font-medium text-[#22342f]">
                        {item.size || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[#6c817a] font-semibold mb-2">
                        {t("admin.orderDetail.qtyLabel")}
                      </p>
                      <p className="text-sm font-bold text-[#1b2b25]">
                        {item.count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-[#6c817a] font-semibold mb-2">
                        {t("admin.orderDetail.priceLabel")}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#6c817a]">
                          {CURRENCY_CODE}
                        </span>
                        <input
                          type="number"
                          value={item.id ? itemPrices[item.id] || 0 : 0}
                          disabled={!item.id || pricingLocked}
                          onChange={(e) => {
                            if (!item.id) return;
                            const newPrice = parseFloat(e.target.value) || 0;
                            setItemPrices((prev) => ({
                              ...prev,
                              [item.id!]: newPrice,
                            }));
                          }}
                          className="admin-field w-20 h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slicing info & Print parameters */}
                  <div className="mb-4 bg-indigo-50/70 border border-indigo-100 p-4 rounded-xl flex flex-wrap gap-6 items-center">
                    {hasModel && item.scaleFactor != null && (
                      <div>
                        <p className="text-[10px] uppercase text-indigo-900 font-semibold">Scale</p>
                        <p className="text-sm font-semibold text-indigo-950">{item.scaleFactor.toFixed(2)}x</p>
                      </div>
                    )}
                    {item.infillPercent != null && (
                      <div>
                        <p className="text-[10px] uppercase text-indigo-900 font-semibold">Infill</p>
                        <p className="text-sm font-semibold text-indigo-950">{item.infillPercent}%</p>
                      </div>
                    )}
                    {item.printQuality && (
                      <div>
                        <p className="text-[10px] uppercase text-indigo-900 font-semibold">Quality</p>
                        <p className="text-sm font-semibold text-indigo-950">{item.printQuality}</p>
                      </div>
                    )}
                    {item.supportsNeeded && (
                      <div>
                        <p className="text-[10px] uppercase text-indigo-900 font-semibold">Supports</p>
                        <span className="inline-block text-xs font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded">
                          Required
                        </span>
                      </div>
                    )}
                    {item.estimatedPrintTime && (
                      <div className="border-l border-indigo-200 pl-4">
                        <p className="text-[10px] uppercase text-indigo-900 font-semibold">Print Time</p>
                        <p className="text-sm font-bold text-indigo-700">{item.estimatedPrintTime}</p>
                      </div>
                    )}
                    {item.filamentUsedGrams != null && (
                      <div>
                        <p className="text-[10px] uppercase text-indigo-900 font-semibold">Filament Used</p>
                        <p className="text-sm font-bold text-indigo-700">{item.filamentUsedGrams}g</p>
                      </div>
                    )}
                  </div>

                  {/* Instructions section */}
                  {item.notes && (
                    <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
                      <p className="text-xs font-bold uppercase text-amber-900 mb-2">
                        {t("admin.orderDetail.instructionsLabel")}
                      </p>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {item.notes}
                      </p>
                    </div>
                  )}

                  {/* Save button for price */}
                  <div className="flex justify-end gap-2">
                    { hasModel && (!item.price || !item.estimatedPrintTime) && (
                      <button
                        type="button"
                        disabled={!item.id || calculatingPriceId === item.id || pricingLocked}
                        onClick={() => item.id && calculateItemPrice(item.id)}
                        className="admin-btn admin-btn-secondary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        {calculatingPriceId === item.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Calculating...
                          </>
                        ) : (
                          "Calculate Price Now"
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={
                        !item.id || savingItemId === item.id || pricingLocked
                      }
                      onClick={() =>
                        item.id &&
                        updateItemPrice(item.id, itemPrices[item.id] || 0)
                      }
                      className="admin-btn admin-btn-primary text-sm px-4 py-2"
                    >
                      {savingItemId === item.id
                        ? t("admin.orderDetail.savingButton")
                        : t("admin.orderDetail.saveButton")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery Cost Section */}
      <div className="mt-6 rounded-xl border border-[#d9e4df] bg-white overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-[#eef4f1] to-[#f7fcf9] px-5 py-3 border-b border-[#d9e4df]">
          <h3 className="font-bold text-[#1b2b25] text-sm">
            {t("admin.orderDetail.deliveryLabel")}
          </h3>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs uppercase text-[#6c817a] font-semibold mb-3">
                {`${t("admin.orderDetail.deliveryLabel")} (${CURRENCY_CODE})`}
              </label>
              <input
                type="number"
                value={deliveryPrice}
                disabled={pricingLocked}
                onChange={(e) => {
                  const newPrice = parseFloat(e.target.value) || 0;
                  setDeliveryPrice(newPrice);
                }}
                className="admin-field w-full"
              />
            </div>
            <button
              type="button"
              disabled={savingDelivery || pricingLocked}
              onClick={() => updateDeliveryPrice(deliveryPrice)}
              className="admin-btn admin-btn-primary mt-6"
            >
              {savingDelivery
                ? t("admin.orderDetail.savingButton")
                : t("admin.orderDetail.saveButton")}
            </button>
          </div>
        </div>
      </div>

      {/* Service Fee Section */}
      <div className="mt-4 rounded-xl border border-[#d9e4df] bg-white overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-[#eef4f1] to-[#f7fcf9] px-5 py-3 border-b border-[#d9e4df]">
          <h3 className="font-bold text-[#1b2b25] text-sm">
            {t("admin.orderDetail.serviceFeeLabel") || "Service Fee"}
          </h3>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs uppercase text-[#6c817a] font-semibold mb-3">
                {`${t("admin.orderDetail.serviceFeeLabel") || "Service Fee"} (${CURRENCY_CODE})`}
              </label>
              <input
                type="number"
                min="0"
                value={serviceFee}
                disabled={pricingLocked}
                onChange={(e) => {
                  const newFee = parseFloat(e.target.value) || 0;
                  setServiceFee(newFee);
                }}
                className="admin-field w-full"
              />
            </div>
            <button
              type="button"
              disabled={savingServiceFee || pricingLocked}
              onClick={() => updateServiceFee(serviceFee)}
              className="admin-btn admin-btn-primary mt-6"
            >
              {savingServiceFee
                ? t("admin.orderDetail.savingButton")
                : t("admin.orderDetail.saveButton")}
            </button>
          </div>
        </div>
      </div>

      {/* Order Discount Section */}
      <div className="mt-4 rounded-xl border border-[#d9e4df] bg-white overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-[#eef4f1] to-[#f7fcf9] px-5 py-3 border-b border-[#d9e4df]">
          <h3 className="font-bold text-[#1b2b25] text-sm">
            {t("admin.orderDetail.orderDiscountLabel")}
          </h3>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs uppercase text-[#6c817a] font-semibold mb-3">
                {`${t("admin.orderDetail.orderDiscountLabel")} (${CURRENCY_CODE})`}
              </label>
              <input
                type="number"
                min="0"
                value={orderDiscountAmount}
                disabled={pricingLocked}
                onChange={(e) => {
                  const newDiscount = parseFloat(e.target.value) || 0;
                  setOrderDiscountAmount(newDiscount);
                }}
                className="admin-field w-full"
              />
            </div>
            <button
              type="button"
              disabled={savingOrderDiscount || pricingLocked}
              onClick={() => updateOrderDiscount(orderDiscountAmount)}
              className="admin-btn admin-btn-primary mt-6"
            >
              {savingOrderDiscount
                ? t("admin.orderDetail.savingButton")
                : t("admin.orderDetail.saveButton")}
            </button>
          </div>
        </div>
      </div>

      {/* Order Summary Section */}
      <div className="mt-5 rounded-xl border border-[#1b2b25] bg-gradient-to-b from-[#1b2b25] to-[#2a3d37] overflow-hidden shadow-md">
        <div className="px-5 py-4">
          {pricingLocked && (
            <p className="text-xs text-amber-300 mb-3 font-semibold">
              ⚠ {t("admin.orderDetail.pricingLockedMessage")}
            </p>
          )}
          <div className="space-y-2 text-white">
            <div className="flex justify-between items-center">
              <span className="text-sm">
                {t("admin.orderDetail.subtotalLabel")}:
              </span>
              <span className="font-semibold">
                {formatCurrencyAmount(subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">
                {t("admin.orderDetail.deliveryLabel")}:
              </span>
              <span className="font-semibold">
                {formatCurrencyAmount(deliveryPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">
                {t("admin.orderDetail.serviceFeeLabel") || "Service Fee"}:
              </span>
              <span className="font-semibold">
                {formatCurrencyAmount(serviceFee)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">
                {t("admin.orderDetail.orderDiscountLabel")}:
              </span>
              <span className="font-semibold">
                {formatCurrencyAmount(orderDiscountAmount)}
              </span>
            </div>
            <div className="border-t border-white/20 my-3 pt-3 flex justify-between items-center">
              <span className="text-base font-bold">
                {t("admin.orderDetail.totalIncludingDeliveryLabel")}:
              </span>
              <span className="text-lg font-bold text-teal-300">
                {formatCurrencyAmount(totalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
