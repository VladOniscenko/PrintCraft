import { useState } from "react";
import {
  Box,
  Layers,
  Sparkles,
  Grid3X3,
  Hash,
  MessageSquare,
  AlertCircle,
  Eye,
} from "lucide-react";
import type { OrderSectionProps } from "./types";
import { resolveAssetUrl } from "../../utils/assetUrl";
import { getFilamentHexColor } from "../../utils/filamentColors";
import ModelInspectorModal from "../ModelInspectorModal";
import CustomerItemChangeRequestBanner from "./CustomerItemChangeRequestBanner";

interface OrderItemsCardProps extends OrderSectionProps {}

export type ItemFile = {
  url: string;
  name: string;
  kind: "model" | "image" | "other";
};

function getFileExtension(nameOrUrl?: string): string {
  if (!nameOrUrl) return "";
  const clean = nameOrUrl.split("?")[0] || "";
  const parts = clean.split(".");
  return (parts[parts.length - 1] || "").toLowerCase();
}

function is3DModelExtension(ext: string): boolean {
  return ["stl", "obj", "3mf", "glb", "gltf"].includes(ext);
}

function isImageExtension(ext: string): boolean {
  return ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
}

function getFileKindFromName(name?: string): "model" | "image" | "other" {
  const ext = getFileExtension(name);
  if (is3DModelExtension(ext) || ext === "step" || ext === "stp") {
    return "model";
  }
  if (isImageExtension(ext)) {
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
  activeChangeRequest?: {
    submittedFileUrl?: string | null;
    submittedFileName?: string | null;
  } | null;
  changeRequests?: Array<{
    submittedFileUrl?: string | null;
    submittedFileName?: string | null;
  }>;
}): ItemFile[] {
  const entries: ItemFile[] = [];

  const revisedFileUrl =
    item.activeChangeRequest?.submittedFileUrl ||
    item.changeRequests?.find((cr) => cr.submittedFileUrl)?.submittedFileUrl;
  const revisedFileName =
    item.activeChangeRequest?.submittedFileName ||
    item.changeRequests?.find((cr) => cr.submittedFileUrl)?.submittedFileName;

  if (revisedFileUrl) {
    entries.push({
      url: revisedFileUrl,
      name: revisedFileName || "revised-model",
      kind: getFileKindFromName(revisedFileName || revisedFileUrl),
    });
  }

  for (const file of item.files || []) {
    if (!file?.url) continue;
    if (entries.some((entry) => entry.url === file.url)) continue;
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

function getPrimaryPreviewFile(itemFiles: ItemFile[]): ItemFile | null {
  if (itemFiles.length === 0) return null;

  // 1. Prefer GLB / GLTF rich visual preview
  const glbFile = itemFiles.find((f) => {
    const ext = getFileExtension(f.url) || getFileExtension(f.name);
    return ext === "glb" || ext === "gltf";
  });
  if (glbFile) return glbFile;

  // 2. Directly renderable 3D formats (.stl, .obj, .3mf)
  const threeDFile = itemFiles.find((f) => {
    const ext = getFileExtension(f.url) || getFileExtension(f.name);
    return is3DModelExtension(ext);
  });
  if (threeDFile) return threeDFile;

  // 3. Any other model file
  const modelFile = itemFiles.find((f) => f.kind === "model");
  if (modelFile) return modelFile;

  // 4. Image file
  const imgFile = itemFiles.find((f) => {
    const ext = getFileExtension(f.url) || getFileExtension(f.name);
    return isImageExtension(ext) || f.kind === "image";
  });
  if (imgFile) return imgFile;

  return itemFiles[0] || null;
}

export default function OrderItemsCard({
  order,
  t,
  onRefresh,
}: OrderItemsCardProps) {
  const isCancelledOrder = (order.status || "").toLowerCase() === "cancelled";
  const [activeModalItemIndex, setActiveModalItemIndex] = useState<number | null>(
    null,
  );

  const modalItem =
    activeModalItemIndex !== null ? order.items[activeModalItemIndex] : null;
  const modalItemFiles = modalItem ? getItemFiles(modalItem) : [];
  const modalPreviewFile = modalItem ? getPrimaryPreviewFile(modalItemFiles) : null;

  return (
    <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0e1512] p-5 sm:p-7 shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            {t("orderDetail.modelsInProject")}
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
            {order.items.length}{" "}
            {order.items.length === 1
              ? t("orderDetail.model")
              : t("orderDetail.models")}
          </span>
        </div>

        {isCancelledOrder && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/60">
            <AlertCircle size={13} />
            {t("orderDetail.filesRemovedDueCancellation")}
          </span>
        )}
      </div>

      {/* Items List as Clean Rows */}
      <div className="divide-y divide-gray-100 dark:divide-white/10">
        {order.items.map((item, idx) => {
          const itemFiles = getItemFiles(item);
          const previewFile = getPrimaryPreviewFile(itemFiles);
          const previewExt = previewFile
            ? getFileExtension(previewFile.url) ||
              getFileExtension(previewFile.name)
            : "";
          const canRender3D = is3DModelExtension(previewExt);
          const isImage = isImageExtension(previewExt);

          const hexColorNumber = getFilamentHexColor(item.color);
          const colorHex = `#${hexColorNumber.toString(16).padStart(6, "0")}`;

          return (
            <div
              key={item.id || idx}
              className="py-4 sm:py-5 first:pt-1 last:pb-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                {/* Compact Thumbnail Box */}
                {!isCancelledOrder && (canRender3D || isImage) ? (
                  <button
                    type="button"
                    onClick={() => setActiveModalItemIndex(idx)}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-[#fbfbfd] dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 flex flex-col items-center justify-center shrink-0 relative overflow-hidden group cursor-pointer shadow-2xs transition-all hover:border-[#133827] dark:hover:border-emerald-500"
                    title={t("orderDetail.inspectModel")}
                  >
                    {item.imageUrl || (isImage && previewFile) ? (
                      <img
                        src={resolveAssetUrl(item.imageUrl || previewFile?.url || "")}
                        alt={item.fileName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain p-1 rounded-xl"
                      />
                    ) : (
                      <>
                        <Box size={20} className="text-[#133827] dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-mono font-bold text-gray-500 dark:text-gray-400 uppercase mt-0.5">
                          .{previewExt || "3D"}
                        </span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-[#133827]/80 dark:bg-emerald-700/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye size={16} />
                    </div>
                  </button>
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-center shrink-0 text-gray-400 dark:text-gray-500">
                    <Box size={20} />
                  </div>
                )}

                {/* Details & Badges */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#133827] dark:bg-emerald-600 text-white shrink-0">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                    {previewExt && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 shrink-0">
                        .{previewExt}
                      </span>
                    )}
                    <h3
                      className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate"
                      title={item.fileName}
                    >
                      {item.fileName}
                    </h3>

                    {item.activeChangeRequest?.status === "pending_customer" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white tracking-wide uppercase shrink-0">
                        <AlertCircle size={11} />
                        {t("orderDetail.changeRequest.actionRequired")}
                      </span>
                    )}
                    {item.activeChangeRequest?.status === "revision_submitted" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800/60 shrink-0">
                        {t("orderDetail.changeRequest.revisionUnderReview")}
                      </span>
                    )}
                    {previewFile &&
                      (previewFile.url === item.activeChangeRequest?.submittedFileUrl ||
                        item.changeRequests?.some((cr) => cr.submittedFileUrl === previewFile.url)) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 shrink-0">
                          {t("orderDetail.changeRequest.revised3dModel")}
                        </span>
                      )}
                  </div>

                  {/* Compact Specification Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Material */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200">
                      <Layers size={11} className="text-emerald-700 dark:text-emerald-400" />
                      <span>{item.material || "PLA"}</span>
                    </span>

                    {/* Color */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0 inline-block"
                        style={{ backgroundColor: colorHex }}
                        title={item.color}
                      />
                      <span>{item.color || t("orderDetail.defaultColor")}</span>
                    </span>

                    {/* Quantity */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200">
                      <Hash size={11} className="text-emerald-700 dark:text-emerald-400" />
                      <span>x{item.count || 1}</span>
                    </span>

                    {/* Print Quality */}
                    {item.printQuality && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200">
                        <Sparkles size={11} className="text-emerald-700 dark:text-emerald-400" />
                        <span>{item.printQuality}</span>
                      </span>
                    )}

                    {/* Infill Density */}
                    {item.infillPercent != null && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200">
                        <Grid3X3 size={11} className="text-emerald-700 dark:text-emerald-400" />
                        <span>{item.infillPercent}%</span>
                      </span>
                    )}

                    {/* Dimensions / Size */}
                    {item.size && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10">
                        <Box size={11} className="text-emerald-700 dark:text-emerald-400" />
                        <span>{item.size}</span>
                      </span>
                    )}
                  </div>

                  {/* Customer / Item Notes */}
                  {item.notes && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400 italic pt-0.5">
                      <MessageSquare size={12} className="shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
                      <span>"{item.notes}"</span>
                    </div>
                  )}

                  {/* Customer Item Change Request Banner */}
                  {item.id && (
                    <CustomerItemChangeRequestBanner
                      orderId={order.id}
                      itemId={item.id}
                      itemFileName={item.fileName}
                      material={item.material}
                      color={item.color}
                      changeRequest={item.activeChangeRequest}
                      history={item.changeRequests}
                      onRefresh={onRefresh}
                    />
                  )}
                </div>
              </div>

              {/* Action Button: Inspect in 3D */}
              {!isCancelledOrder && canRender3D && previewFile && (
                <button
                  type="button"
                  onClick={() => setActiveModalItemIndex(idx)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-[#133827] dark:hover:bg-emerald-600 text-gray-700 dark:text-gray-200 hover:text-white dark:hover:text-white text-xs font-semibold shadow-2xs transition-all shrink-0 cursor-pointer self-start sm:self-center"
                >
                  <Eye size={13} />
                  <span>{t("orderDetail.inspectModel")}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Shared High-Fidelity 3D Inspector Modal Dialog */}
      {activeModalItemIndex !== null && modalItem && (
        <ModelInspectorModal
          isOpen={true}
          onClose={() => setActiveModalItemIndex(null)}
          fileName={modalPreviewFile?.name || modalItem.fileName}
          fileUrl={modalPreviewFile?.url}
          color={modalItem.color}
          material={modalItem.material}
          printQuality={modalItem.printQuality}
          infillPercent={modalItem.infillPercent}
          size={modalItem.size}
          count={modalItem.count || 1}
          scaleFactor={modalItem.scaleFactor || 1.0}
          itemIndex={activeModalItemIndex}
        />
      )}
    </div>
  );
}
