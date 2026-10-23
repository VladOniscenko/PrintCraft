import { lazy, Suspense, useState } from "react";
import {
  Box,
  Layers,
  Sparkles,
  Grid3X3,
  Hash,
  MessageSquare,
  FileText,
  Loader2,
  AlertCircle,
  Eye,
  Palette,
} from "lucide-react";
import type { OrderSectionProps } from "./types";
import { resolveAssetUrl } from "../../utils/assetUrl";
import { getFilamentHexColor } from "../Interactive3DViewer";
import ModelInspectorModal from "../ModelInspectorModal";
import CustomerItemChangeRequestBanner from "./CustomerItemChangeRequestBanner";

const Interactive3DViewer = lazy(() => import("../Interactive3DViewer"));

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

  // 1. Prefer GLB / GLTF rich visual preview (holds full vertex colors and texture)
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

  // 2. Any other model file
  const modelFile = itemFiles.find((f) => f.kind === "model");
  if (modelFile) return modelFile;

  // 3. Image file
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
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {t("orderDetail.modelsInProject")}
            </h2>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              {order.items.length}{" "}
              {order.items.length === 1
                ? t("orderDetail.model")
                : t("orderDetail.models")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t("orderDetail.modelsSubtitle")}
          </p>
        </div>

        {isCancelledOrder && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 self-start sm:self-auto">
            <AlertCircle size={14} />
            {t("orderDetail.filesRemovedDueCancellation")}
          </span>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-6">
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
              className="rounded-3xl border border-gray-200/80 bg-[#fbfbfd] p-5 sm:p-7 shadow-xs hover:border-gray-300 transition-all duration-200"
            >
              {/* Responsive 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Item Specifications & Info */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Item Header */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#133827] text-white tracking-wider shrink-0">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                    {previewExt && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                        .{previewExt}
                      </span>
                    )}
                    <h3
                      className="text-base sm:text-lg font-bold text-gray-900 break-words tracking-tight"
                      title={item.fileName}
                    >
                      {item.fileName}
                    </h3>
                    {item.activeChangeRequest?.status === "pending_customer" && (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white tracking-wide uppercase shadow-2xs animate-pulse">
                        <AlertCircle size={12} />
                        {t("orderDetail.changeRequest.actionRequired")}
                      </span>
                    )}
                    {item.activeChangeRequest?.status === "revision_submitted" && (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
                        {t("orderDetail.changeRequest.revisionUnderReview")}
                      </span>
                    )}
                    {previewFile &&
                      (previewFile.url === item.activeChangeRequest?.submittedFileUrl ||
                        item.changeRequests?.some((cr) => cr.submittedFileUrl === previewFile.url)) && (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {t("orderDetail.changeRequest.revised3dModel")}
                        </span>
                      )}
                  </div>

                  {/* Specifications Container */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 space-y-3 shadow-2xs">
                    {/* 2-Column Grid for Standard Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {/* Material */}
                      <div className="flex items-center justify-between gap-2.5 bg-[#fbfbfd] px-3.5 py-2.5 rounded-xl border border-gray-200/70">
                        <span className="flex items-center gap-1.5 font-semibold text-gray-600 shrink-0">
                          <Layers size={14} className="text-emerald-700" />
                          {t("orderDetail.materialLabel")}
                        </span>
                        <span className="font-bold text-gray-900 text-right">
                          {item.material || "PLA"}
                        </span>
                      </div>

                      {/* Color */}
                      <div className="flex items-center justify-between gap-2.5 bg-[#fbfbfd] px-3.5 py-2.5 rounded-xl border border-gray-200/70">
                        <span className="flex items-center gap-1.5 font-semibold text-gray-600 shrink-0">
                          <Palette size={14} className="text-emerald-700" />
                          {t("orderDetail.colorLabel")}
                        </span>
                        <span className="font-bold text-gray-900 flex items-center gap-1.5 text-right">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-inner shrink-0 inline-block"
                            style={{ backgroundColor: colorHex }}
                            title={item.color}
                          />
                          <span>{item.color || t("orderDetail.defaultColor")}</span>
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center justify-between gap-2.5 bg-[#fbfbfd] px-3.5 py-2.5 rounded-xl border border-gray-200/70">
                        <span className="flex items-center gap-1.5 font-semibold text-gray-600 shrink-0">
                          <Hash size={14} className="text-emerald-700" />
                          {t("orderDetail.qtyLabel")}
                        </span>
                        <span className="font-bold text-gray-900 text-right">
                          x{item.count || 1}
                        </span>
                      </div>

                      {/* Print Quality */}
                      {item.printQuality && (
                        <div className="flex items-center justify-between gap-2.5 bg-[#fbfbfd] px-3.5 py-2.5 rounded-xl border border-gray-200/70">
                          <span className="flex items-center gap-1.5 font-semibold text-gray-600 shrink-0">
                            <Sparkles size={14} className="text-emerald-700" />
                            {t("orderDetail.qualityLabel")}
                          </span>
                          <span className="font-bold text-gray-900 text-right">
                            {item.printQuality}
                          </span>
                        </div>
                      )}

                      {/* Infill Density */}
                      {item.infillPercent != null && (
                        <div className="flex items-center justify-between gap-2.5 bg-[#fbfbfd] px-3.5 py-2.5 rounded-xl border border-gray-200/70">
                          <span className="flex items-center gap-1.5 font-semibold text-gray-600 shrink-0">
                            <Grid3X3 size={14} className="text-emerald-700" />
                            {t("orderDetail.infillLabel")}
                          </span>
                          <span className="font-bold text-gray-900 text-right">
                            {item.infillPercent}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dimensions / Size */}
                    {item.size && (
                      <div className="flex items-center justify-between gap-3 bg-[#fbfbfd] px-3.5 py-2.5 rounded-xl border border-gray-200/70 text-xs">
                        <span className="flex items-center gap-1.5 font-semibold text-gray-600 shrink-0">
                          <Box size={14} className="text-emerald-700" />
                          {t("orderDetail.sizeLabel")}
                        </span>
                        <span className="font-mono font-bold text-gray-900 text-right break-words">
                          {item.size}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Customer / Item Notes */}
                  {item.notes && (
                    <div className="flex items-start gap-2.5 text-xs text-gray-700 bg-white border border-gray-200/80 p-3.5 rounded-2xl shadow-2xs">
                      <MessageSquare
                        size={14}
                        className="mt-0.5 shrink-0 text-gray-400"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 mr-1.5">
                          {t("orderDetail.instructionsLabel")}:
                        </span>
                        <span className="italic text-gray-600">"{item.notes}"</span>
                      </div>
                    </div>
                  )}

                  {/* Customer Item Change Request & Revision Loop Banner */}
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

                {/* Right Column: Clean 3D Dialog Box (Self-start, Natural Height) */}
                <div className="lg:col-span-5 self-start w-full">
                  {isCancelledOrder ? (
                    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 shadow-md p-6 text-center text-slate-400 space-y-2">
                      <Box size={32} className="mx-auto text-slate-600" />
                      <p className="text-xs font-medium">
                        {t("orderDetail.filesRemovedDueCancellation")}
                      </p>
                    </div>
                  ) : canRender3D && previewFile ? (
                    <Suspense
                      fallback={
                        <div className="w-full h-64 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400">
                          <Loader2
                            className="animate-spin text-emerald-400"
                            size={24}
                          />
                          <span className="text-xs font-medium">
                            {t("orderDetail.loadingModel")}
                          </span>
                        </div>
                      }
                    >
                      <Interactive3DViewer
                        compact={true}
                        fileUrl={resolveAssetUrl(previewFile.url)}
                        fileName={previewFile.name}
                        colorName={item.color}
                        materialName={item.material}
                        scaleFactor={item.scaleFactor || 1.0}
                        count={item.count || 1}
                        onExpand={() => setActiveModalItemIndex(idx)}
                        className="w-full shadow-md"
                      />
                    </Suspense>
                  ) : isImage && previewFile ? (
                    <div className="w-full rounded-2xl overflow-hidden border border-gray-200/80 bg-white shadow-2xs flex flex-col">
                      <div className="bg-gray-50 border-b border-gray-200/80 px-3.5 py-2.5 flex items-center justify-between text-xs text-gray-900">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0 inline-block"
                            style={{ backgroundColor: colorHex }}
                          />
                          <span>{item.color}</span>
                          <span className="text-gray-400 font-normal">
                            • {item.material}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveModalItemIndex(idx)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white hover:bg-gray-100 text-gray-800 text-[11px] font-semibold border border-gray-200 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>{t("orderDetail.viewImage")}</span>
                        </button>
                      </div>
                      <div className="w-full h-56 bg-gray-50/50 flex items-center justify-center p-3">
                        <img
                          src={resolveAssetUrl(previewFile.url)}
                          alt={previewFile.name}
                          loading="lazy"
                          decoding="async"
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full rounded-2xl border border-gray-200/80 bg-white shadow-2xs p-6 text-center text-gray-400 space-y-2">
                      <FileText size={32} className="mx-auto text-gray-300" />
                      <p className="text-xs font-medium">
                        {t("orderDetail.no3dPreview")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
