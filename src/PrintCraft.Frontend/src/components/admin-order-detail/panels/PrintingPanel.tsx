import { useState } from "react";
import {
  CheckCircle,
  Layers,
  Eye,
} from "lucide-react";
import type { StatusPanelProps } from "../types";
import { useI18n } from "../../../i18n/I18nContext";
import ModelInspectorModal from "../../ModelInspectorModal";

export default function PrintingPanel({
  order,
  onStatusTransition,
  isProcessing,
}: StatusPanelProps) {
  const { t } = useI18n();
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  const handleFinishPrinting = async () => {
    if (
      window.confirm(
        t("admin.orderDetail.panels.printing.confirmCompletePrompt"),
      )
    ) {
      await onStatusTransition("post_processing");
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-200 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              {t("admin.orderDetail.panels.printing.badge")}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t("admin.orderDetail.panels.printing.title")}
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-gray-300 mt-1">
            {t("admin.orderDetail.panels.printing.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleFinishPrinting}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle size={16} />
          <span>{isProcessing ? t("admin.orderDetail.panels.printing.updating") : t("admin.orderDetail.panels.printing.printCompleteMoveToQC")}</span>
        </button>
      </div>

      {/* Sliced Items on Plate */}
      <div className="bg-white dark:bg-[#0e1512] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-2">
          <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
          <span>{t("admin.orderDetail.panels.printing.itemsHeading", { count: order.items?.length || 0 })}</span>
        </h3>

        <div className="space-y-3">
          {(order.items || []).map((item, index) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-200 text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {item.fileName || t("admin.orderDetail.panels.printing.modelItemFallback")}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-gray-400">
                      {item.material} • {item.color}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-gray-200">
                    {t("admin.orderDetail.panels.printing.qty")} {item.count}
                  </span>
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
                        className="p-1.5 text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/10 rounded-lg border border-slate-200 dark:border-white/15 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>{t("admin.orderDetail.panels.printing.preview3d")}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-black/30 p-2.5 rounded-lg border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-gray-300">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400 block">{t("admin.orderDetail.panels.printing.estPrintTime")}</span>
                  <strong className="text-slate-800 dark:text-gray-100">{item.estimatedPrintTime || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400 block">{t("admin.orderDetail.panels.printing.filamentWeight")}</span>
                  <strong className="text-slate-800 dark:text-gray-100">{item.filamentUsedGrams ? `${item.filamentUsedGrams}g` : "N/A"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400 block">{t("admin.orderDetail.panels.printing.infill")}</span>
                  <strong className="text-slate-800 dark:text-gray-100">{item.infillPercent}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400 block">{t("admin.orderDetail.panels.printing.layerHeight")}</span>
                  <strong className="text-slate-800 dark:text-gray-100">{item.printQuality || "0.20mm"}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewItem && (
        <ModelInspectorModal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          fileName={previewItem.fileName || t("orderDetail.model")}
          fileUrl={previewItem.fileUrl}
          material={previewItem.material}
          color={previewItem.color}
          size={previewItem.size}
        />
      )}
    </div>
  );
}
