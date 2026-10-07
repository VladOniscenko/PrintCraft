import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Layers,
  Sparkles,
  Grid3X3,
  Hash,
  MessageSquare,
  Maximize2,
  ExternalLink,
  Download,
  X,
  FileCode,
  FileText,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Info,
} from "lucide-react";
import type { OrderSectionProps } from "./types";
import { resolveAssetUrl } from "../../utils/assetUrl";
import { getFilamentHexColor } from "../Interactive3DViewer";

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
  return ["stl", "obj", "3mf"].includes(ext);
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

function getPrimaryPreviewFile(itemFiles: ItemFile[]): ItemFile | null {
  if (itemFiles.length === 0) return null;

  // 1. Look for directly renderable 3D formats (.stl, .obj, .3mf)
  const threeDFile = itemFiles.find((f) => {
    const ext = getFileExtension(f.url) || getFileExtension(f.name);
    return is3DModelExtension(ext);
  });
  if (threeDFile) return threeDFile;

  // 2. Look for any model file
  const modelFile = itemFiles.find((f) => f.kind === "model");
  if (modelFile) return modelFile;

  // 3. Look for image file
  const imgFile = itemFiles.find((f) => {
    const ext = getFileExtension(f.url) || getFileExtension(f.name);
    return isImageExtension(ext) || f.kind === "image";
  });
  if (imgFile) return imgFile;

  return itemFiles[0] || null;
}

export default function OrderItemsCard({ order, t }: OrderItemsCardProps) {
  const isCancelledOrder = (order.status || "").toLowerCase() === "cancelled";
  const [activeModalItemIndex, setActiveModalItemIndex] = useState<number | null>(
    null,
  );

  // Close modal with Escape key
  useEffect(() => {
    if (activeModalItemIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModalItemIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalItemIndex]);

  // Lock body scroll when modal dialog is active
  useEffect(() => {
    if (activeModalItemIndex !== null) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [activeModalItemIndex]);

  const modalItem =
    activeModalItemIndex !== null ? order.items[activeModalItemIndex] : null;
  const modalItemFiles = modalItem ? getItemFiles(modalItem) : [];
  const modalPreviewFile = modalItem ? getPrimaryPreviewFile(modalItemFiles) : null;
  const modalPreviewExt = modalPreviewFile
    ? getFileExtension(modalPreviewFile.url) ||
      getFileExtension(modalPreviewFile.name)
    : "";
  const modalCanRender3D = is3DModelExtension(modalPreviewExt);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {t("orderDetail.modelsInProject")}
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {order.items.length}{" "}
              {order.items.length === 1 ? "model" : "models"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t("models.subtitle") ||
              "Explore specifications and interactive 3D geometry for this project."}
          </p>
        </div>

        {isCancelledOrder && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 self-start sm:self-auto">
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

          // Format price display
          const isPendingQuote =
            order.status === "pending_quote" || !item.price || item.price <= 0;
          const displayPrice = item.price ? `€${item.price.toFixed(2)}` : null;

          return (
            <div
              key={item.id || idx}
              className="group relative rounded-2xl border border-gray-200/90 bg-gradient-to-b from-white to-slate-50/40 p-5 sm:p-6 shadow-xs hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              {/* Responsive 2-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left Column: Item Specifications & Info */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
                  {/* Item Header */}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-slate-900 text-white tracking-wider">
                          #{String(idx + 1).padStart(2, "0")}
                        </span>
                        {previewExt && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                            .{previewExt}
                          </span>
                        )}
                        {itemFiles.length > 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {itemFiles.length} files
                          </span>
                        )}
                      </div>

                      {/* Pricing badge */}
                      {isPendingQuote ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {t("orderDetail.pendingQuote")}
                        </span>
                      ) : (
                        <div className="text-right">
                          <span className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                            {displayPrice}
                          </span>
                          {item.count > 1 && item.unitPrice && (
                            <span className="block text-[11px] font-medium text-gray-500">
                              (€{item.unitPrice.toFixed(2)} / ea)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <h3
                      className="text-lg font-black text-gray-900 truncate tracking-tight"
                      title={item.fileName}
                    >
                      {item.fileName}
                    </h3>
                  </div>

                  {/* Specifications Badge Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    {/* Material */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs">
                      <div className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
                        <Layers size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-gray-400">
                          {t("orderDetail.materialLabel") || "Material"}
                        </p>
                        <p className="font-bold text-gray-900 truncate">
                          {item.material || "PLA"}
                        </p>
                      </div>
                    </div>

                    {/* Color with Color Swatch Dot */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs">
                      <div
                        className="w-5 h-5 rounded-full border border-gray-300 shadow-inner shrink-0"
                        style={{ backgroundColor: colorHex }}
                        title={item.color}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-gray-400">
                          {t("orderDetail.colorLabel") || "Color"}
                        </p>
                        <p className="font-bold text-gray-900 truncate">
                          {item.color || "Default"}
                        </p>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs">
                      <div className="p-1 rounded-lg bg-sky-50 text-sky-700">
                        <Hash size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-gray-400">
                          {t("orderDetail.qtyLabel") || "Quantity"}
                        </p>
                        <p className="font-bold text-gray-900 truncate">
                          x{item.count || 1}
                        </p>
                      </div>
                    </div>

                    {/* Print Quality */}
                    {item.printQuality && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs">
                        <div className="p-1 rounded-lg bg-indigo-50 text-indigo-700">
                          <Sparkles size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-gray-400">
                            {t("orderDetail.quality") || "Quality"}
                          </p>
                          <p className="font-bold text-gray-900 truncate">
                            {item.printQuality}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Infill Density */}
                    {item.infillPercent != null && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs">
                        <div className="p-1 rounded-lg bg-amber-50 text-amber-700">
                          <Grid3X3 size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-gray-400">
                            {t("orderDetail.infill") || "Infill"}
                          </p>
                          <p className="font-bold text-gray-900 truncate">
                            {item.infillPercent}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Size / Bounding Dimensions */}
                    {item.size && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs">
                        <div className="p-1 rounded-lg bg-violet-50 text-violet-700">
                          <Box size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-gray-400">
                            {t("orderDetail.size") || "Size"}
                          </p>
                          <p className="font-bold text-gray-900 truncate">
                            {item.size}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Plate Cost */}
                    {item.plateCost != null && item.plateCost > 0 && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-gray-200/80 shadow-xs">
                        <div className="p-1 rounded-lg bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold text-gray-400">
                            {t("orderDetail.plateCost") || "Plate Setup"}
                          </p>
                          <p className="font-bold text-emerald-700 truncate">
                            +€{item.plateCost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer / Item Notes */}
                  {item.notes && (
                    <div className="flex items-start gap-2.5 text-xs text-gray-700 bg-amber-50/60 border border-amber-200/60 p-3 rounded-xl italic">
                      <MessageSquare
                        size={15}
                        className="mt-0.5 shrink-0 text-amber-700 not-italic"
                      />
                      <span className="not-italic font-bold text-amber-900 mr-1">
                        Note:
                      </span>
                      <span>"{item.notes}"</span>
                    </div>
                  )}

                  {/* Multiple Attachments / File Downloads list */}
                  {!isCancelledOrder && itemFiles.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Files & Downloads ({itemFiles.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {itemFiles.map((file, fileIdx) => {
                          const fExt = getFileExtension(file.name || file.url);
                          const isFModel =
                            is3DModelExtension(fExt) || file.kind === "model";
                          const isFImage =
                            isImageExtension(fExt) || file.kind === "image";

                          return (
                            <div
                              key={`${file.url}-${fileIdx}`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs shadow-xs"
                            >
                              {isFModel ? (
                                <FileCode size={13} className="text-indigo-600" />
                              ) : isFImage ? (
                                <ImageIcon
                                  size={13}
                                  className="text-emerald-600"
                                />
                              ) : (
                                <FileText size={13} className="text-slate-500" />
                              )}
                              <span className="max-w-[140px] truncate text-slate-700 font-medium">
                                {file.name}
                              </span>
                              <a
                                href={resolveAssetUrl(file.url)}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="text-slate-400 hover:text-slate-800 transition-colors p-0.5"
                                title="Download"
                              >
                                <Download size={12} />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Left Column Bottom Quick Action Strip */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                    {canRender3D && !isCancelledOrder && (
                      <button
                        type="button"
                        onClick={() => setActiveModalItemIndex(idx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <Maximize2 size={13} />
                        {t("orderDetail.open3DModal") || "Inspect 3D Model"}
                      </button>
                    )}

                    {!isCancelledOrder && (
                      <Link
                        to={`/orders/${order.id}/models/${idx}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all"
                      >
                        <ExternalLink size={13} />
                        {t("orderDetail.fullViewerPage") || "Dedicated Viewer"}
                      </Link>
                    )}

                    {previewFile && !isCancelledOrder && (
                      <a
                        href={resolveAssetUrl(previewFile.url)}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold transition-all"
                      >
                        <Download size={13} />
                        {t("modelViewer.download") || "Download"}
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Column: Small 3D Dialog / Viewport */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md flex flex-col h-full min-h-[250px]">
                    {/* Viewport Top Bar */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none gap-2">
                      <div className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white shadow-sm">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: colorHex }}
                        />
                        <span className="truncate max-w-[100px]">
                          {item.color}
                        </span>
                        <span className="text-slate-400 font-normal">
                          • {item.material}
                        </span>
                      </div>

                      {canRender3D && !isCancelledOrder && (
                        <button
                          type="button"
                          onClick={() => setActiveModalItemIndex(idx)}
                          className="pointer-events-auto inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold backdrop-blur-md transition-all shadow-sm"
                          title={t("orderDetail.expand3D") || "Expand 3D Dialog"}
                        >
                          <Maximize2 size={12} />
                          <span>Inspect</span>
                        </button>
                      )}
                    </div>

                    {/* Viewport Body */}
                    <div className="w-full flex-1 flex flex-col justify-center items-center">
                      {isCancelledOrder ? (
                        <div className="p-6 text-center text-slate-400 space-y-2">
                          <Box size={32} className="mx-auto text-slate-600" />
                          <p className="text-xs font-medium">
                            {t("orderDetail.filesRemovedDueCancellation")}
                          </p>
                        </div>
                      ) : canRender3D && previewFile ? (
                        <div className="w-full h-full min-h-[220px]">
                          <Suspense
                            fallback={
                              <div className="w-full h-56 min-h-[220px] bg-slate-950 flex flex-col items-center justify-center gap-2 text-slate-400">
                                <Loader2
                                  className="animate-spin text-emerald-400"
                                  size={24}
                                />
                                <span className="text-xs font-medium">
                                  Loading 3D preview...
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
                            />
                          </Suspense>
                        </div>
                      ) : isImage && previewFile ? (
                        <div className="relative w-full h-56 min-h-[220px] bg-slate-900 flex items-center justify-center p-3 group/img overflow-hidden">
                          <img
                            src={resolveAssetUrl(previewFile.url)}
                            alt={previewFile.name}
                            className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-300 group-hover/img:scale-105"
                          />
                          <a
                            href={resolveAssetUrl(previewFile.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute bottom-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl border border-white/10 backdrop-blur-sm transition-all"
                            title="View Full Image"
                          >
                            <Eye size={14} />
                          </a>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-slate-400 space-y-2">
                          <FileText
                            size={32}
                            className="mx-auto text-slate-600"
                          />
                          <p className="text-xs font-medium">
                            {t("orderDetail.no3dPreview") ||
                              "3D preview not supported for this file"}
                          </p>
                          {previewFile && (
                            <a
                              href={resolveAssetUrl(previewFile.url)}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold mt-1"
                            >
                              <Download size={13} />
                              {t("modelViewer.download") || "Download File"}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* In-Page Interactive 3D Model Dialog / Modal */}
      {activeModalItemIndex !== null && modalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveModalItemIndex(null)}
        >
          <div
            className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Dialog Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  #{String(activeModalItemIndex + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {modalItem.fileName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block"
                      style={{
                        backgroundColor: `#${getFilamentHexColor(modalItem.color).toString(16).padStart(6, "0")}`,
                      }}
                    />
                    <span>{modalItem.color}</span>
                    <span>•</span>
                    <span>{modalItem.material}</span>
                    {modalItem.printQuality && (
                      <>
                        <span>•</span>
                        <span>{modalItem.printQuality}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2">
                <Link
                  to={`/orders/${order.id}/models/${activeModalItemIndex}`}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                  title="Open Dedicated Full Page Viewer"
                >
                  <ExternalLink size={13} />
                  <span>
                    {t("orderDetail.fullViewerPage") || "Dedicated Viewer"}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveModalItemIndex(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Dialog Body: Full Interactive 3D Viewer */}
            <div className="flex-1 min-h-[380px] sm:min-h-[460px] overflow-hidden bg-slate-950 flex flex-col">
              {modalCanRender3D && modalPreviewFile ? (
                <Suspense
                  fallback={
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                      <Loader2
                        className="animate-spin text-emerald-400"
                        size={32}
                      />
                      <span className="text-sm font-semibold">
                        Rendering high-fidelity 3D model...
                      </span>
                    </div>
                  }
                >
                  <Interactive3DViewer
                    compact={false}
                    fileUrl={resolveAssetUrl(modalPreviewFile.url)}
                    fileName={modalPreviewFile.name}
                    colorName={modalItem.color}
                    materialName={modalItem.material}
                    scaleFactor={modalItem.scaleFactor || 1.0}
                    count={modalItem.count || 1}
                  />
                </Suspense>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                  <Info size={36} className="text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-300 font-semibold">
                    {t("orderDetail.no3dPreview") ||
                      "3D preview is not available for this file type."}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Dialog Footer */}
            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-400">
                {modalItem.size && (
                  <span>
                    <strong className="text-slate-200">Size:</strong>{" "}
                    {modalItem.size}
                  </span>
                )}
                {modalItem.infillPercent != null && (
                  <span>
                    <strong className="text-slate-200">Infill:</strong>{" "}
                    {modalItem.infillPercent}%
                  </span>
                )}
                <span>
                  <strong className="text-slate-200">Qty:</strong> x
                  {modalItem.count || 1}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {modalPreviewFile && (
                  <a
                    href={resolveAssetUrl(modalPreviewFile.url)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all border border-slate-700"
                  >
                    <Download size={13} />
                    {t("orderDetail.downloadModel") || "Download"}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveModalItemIndex(null)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm"
                >
                  {t("orderDetail.closeModal") || "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
