import { useState, useRef, Suspense, lazy } from "react";
import { Upload, RotateCw, Loader2, Sparkles, Box } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import type { Filament } from "../../types";

const Interactive3DViewer = lazy(() => import("../Interactive3DViewer"));

interface Checkout3DViewerCardProps {
  fileUrl?: string;
  fileName?: string;
  isDemo?: boolean;
  material?: string;
  color?: string;
  scaleFactor?: number;
  count?: number;
  filaments?: Filament[];
  dimensionX?: number;
  dimensionY?: number;
  dimensionZ?: number;
  onDimensionsDetected?: (dims: { x: number; y: number; z: number }) => void;
  onChooseFile: () => void;
  onDropFiles: (files: File[]) => void;
  onLoadSampleModel: () => void;
  isUploading?: boolean;
  isProcessing?: boolean;
}

export default function Checkout3DViewerCard({
  fileUrl,
  fileName,
  isDemo = false,
  material = "PLA",
  color = "Black",
  scaleFactor = 1.0,
  count = 1,
  filaments,
  dimensionX,
  dimensionY,
  dimensionZ,
  onDimensionsDetected,
  onChooseFile,
  onDropFiles,
  onLoadSampleModel,
  isUploading = false,
  isProcessing = false,
}: Checkout3DViewerCardProps) {
  const { t } = useI18n();
  const [isDragOver, setIsDragOver] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const hasDimensions =
    typeof dimensionX === "number" &&
    typeof dimensionY === "number" &&
    typeof dimensionZ === "number" &&
    dimensionX > 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length > 0) {
      onDropFiles(files);
    }
  };

  return (
    <div className="space-y-4">
      {/* 3D Viewport Main Stage */}
      <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-gradient-to-b from-[#e8f4f8] via-[#eef8fc] to-[#f4fafd] dark:from-[#0b1411] dark:via-[#0e1814] dark:to-[#11201a] h-[460px] sm:h-[500px] relative overflow-hidden flex flex-col justify-between p-4 shadow-xs select-none">
        {/* Top Badges Overlay */}
        <div className="relative z-10 flex items-center justify-between gap-3 pointer-events-none">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-xs text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-2xs border border-gray-200/50 dark:border-white/10 max-w-[240px] truncate">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isDemo
                  ? "bg-amber-500 animate-pulse"
                  : fileUrl
                    ? "bg-emerald-500"
                    : "bg-[#133827] dark:bg-emerald-400"
              }`}
            />
            <span className="truncate">
              {isDemo
                ? t("quote.viewerDemoBadge")
                : fileName || t("quote.viewerModelLoaded")}
            </span>
          </div>

          {/* Coordinates / Dimensions Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-xs text-xs font-mono font-medium text-gray-700 dark:text-gray-300 shadow-2xs border border-gray-200/50 dark:border-white/10">
            {hasDimensions ? (
              <span>
                {dimensionX} × {dimensionY} × {dimensionZ} mm
              </span>
            ) : (
              <span className="text-gray-400">
                {t("quote.viewerDimensionsPlaceholder")}
              </span>
            )}
          </div>
        </div>

        {/* Center: Interactive 3D Model Canvas */}
        <div className="absolute inset-0 z-0">
          {fileUrl ? (
            <Suspense
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#133827] dark:text-emerald-400" />
                  <span className="text-xs font-semibold">
                    {t("quote.loading3dViewer")}
                  </span>
                </div>
              }
            >
              <Interactive3DViewer
                key={fileUrl}
                fileUrl={fileUrl}
                fileName={fileName || "model.stl"}
                colorName={color}
                materialName={material}
                scaleFactor={scaleFactor}
                count={count}
                filaments={filaments}
                className="w-full h-full"
                showHelp={false}
                autoRotate={false}
                showGround={true}
                onDimensionsDetected={onDimensionsDetected}
              />
            </Suspense>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-gray-500">
              <div className="w-16 h-16 rounded-3xl bg-white/80 dark:bg-white/5 border border-emerald-200/60 dark:border-white/10 flex items-center justify-center mb-3 text-[#133827] dark:text-emerald-400 shadow-xs">
                <Box size={32} />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("quote.uploadModelForCalc")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
                {t("quote.allowedFilesInline")}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Helper Overlay */}
        <div className="relative z-10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-xs shadow-2xs border border-gray-200/40 dark:border-white/10">
            <RotateCw size={13} className="text-[#133827] dark:text-emerald-400" />
            <span>{t("quote.viewerRotateTip")}</span>
          </div>
        </div>
      </div>

      {/* Upload Dropzone Card */}
      <div
        ref={dropzoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-2xl sm:rounded-3xl border bg-white dark:bg-[#0e1512] p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs transition-all ${
          isDragOver
            ? "border-[#133827] dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[0.99]"
            : "border-gray-200/90 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-600/50"
        } ${isUploading || isProcessing ? "opacity-60 pointer-events-none" : ""}`}
      >
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-center justify-center shrink-0 text-gray-700 dark:text-gray-300">
            {isUploading || isProcessing ? (
              <Loader2 size={20} className="animate-spin text-[#133827] dark:text-emerald-400" />
            ) : (
              <Upload size={20} />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {t("quote.dropzoneTitle")}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {t("quote.dropzoneSubtitle")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onChooseFile}
          disabled={isUploading || isProcessing}
          className="shrink-0 px-4 sm:px-5 py-2.5 rounded-full border border-gray-300 dark:border-white/20 hover:border-[#133827] dark:hover:border-emerald-400 hover:text-[#133827] dark:hover:text-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 bg-white dark:bg-white/5 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
        >
          {t("quote.dropzoneChooseBtn")}
        </button>
      </div>

      {/* Try with Example Demo Link */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onLoadSampleModel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-[#133827] dark:hover:text-emerald-400 transition-colors cursor-pointer group"
        >
          <Sparkles
            size={13}
            className="text-amber-500 group-hover:scale-110 transition-transform"
          />
          <span>{t("quote.dropzoneTryExample")}</span>
        </button>
      </div>
    </div>
  );
}

