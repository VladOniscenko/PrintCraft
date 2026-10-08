import { lazy, Suspense, useEffect } from "react";
import {
  X,
  Loader2,
  Download,
  Info,
} from "lucide-react";
import { resolveAssetUrl } from "../utils/assetUrl";
import { getFilamentHexColor } from "./Interactive3DViewer";
import { useI18n } from "../i18n/I18nContext";

const Interactive3DViewer = lazy(() => import("./Interactive3DViewer"));

export interface ModelInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  zIndexClassName?: string;
}

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

export default function ModelInspectorModal({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  material = "PLA",
  color = "Default",
  printQuality,
  infillPercent,
  size,
  count = 1,
  scaleFactor = 1.0,
  itemIndex,
  zIndexClassName = "z-[110]",
}: ModelInspectorModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const ext = getFileExtension(fileUrl || fileName);
  const canRender3D = is3DModelExtension(ext);
  const isImage = isImageExtension(ext);

  const hexColorNumber = getFilamentHexColor(color);
  const colorHex = `#${hexColorNumber.toString(16).padStart(6, "0")}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            {itemIndex != null && (
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                #{String(itemIndex + 1).padStart(2, "0")}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                {fileName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block"
                  style={{ backgroundColor: colorHex }}
                />
                <span className="text-slate-200 font-medium">{color}</span>
                <span>•</span>
                <span className="text-slate-300">{material}</span>
                {printQuality && (
                  <>
                    <span>•</span>
                    <span className="text-slate-300">{printQuality}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3D Viewport Body */}
        <div className="flex-1 min-h-[380px] sm:min-h-[460px] overflow-hidden bg-slate-950 flex flex-col">
          {canRender3D && fileUrl ? (
            <Suspense
              fallback={
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2
                    className="animate-spin text-emerald-400"
                    size={32}
                  />
                  <span className="text-sm font-semibold">
                    {t("orderDetail.loadingModel") || "Rendering 3D model..."}
                  </span>
                </div>
              }
            >
              <Interactive3DViewer
                compact={false}
                fileUrl={resolveAssetUrl(fileUrl)}
                fileName={fileName}
                colorName={color}
                materialName={material}
                scaleFactor={scaleFactor}
                count={count}
              />
            </Suspense>
          ) : isImage && fileUrl ? (
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
              <img
                src={resolveAssetUrl(fileUrl)}
                alt={fileName}
                className="max-h-[70vh] max-w-full object-contain rounded-xl"
              />
            </div>
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

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-400">
            {size && (
              <span>
                <strong className="text-slate-200">
                  {t("orderDetail.sizeLabel") || "Dimensions"}:
                </strong>{" "}
                <span className="font-mono text-slate-300">{size}</span>
              </span>
            )}
            {infillPercent != null && (
              <span>
                <strong className="text-slate-200">
                  {t("orderDetail.infillLabel") || "Infill"}:
                </strong>{" "}
                <span className="text-slate-300">{infillPercent}%</span>
              </span>
            )}
            <span>
              <strong className="text-slate-200">
                {t("orderDetail.qtyLabel") || "Quantity"}:
              </strong>{" "}
              <span className="text-slate-300">x{count}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {fileUrl && (
              <a
                href={resolveAssetUrl(fileUrl)}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all border border-slate-700"
              >
                <Download size={13} />
                {t("modelViewer.download") || "Download File"}
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm"
            >
              {t("orderDetail.closeModal") || "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
