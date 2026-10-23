import { useState } from "react";
import {
  Layers,
  Play,
  Eye,
} from "lucide-react";
import type { StatusPanelProps } from "../types";
import { useI18n } from "../../../i18n/I18nContext";
import ModelInspectorModal from "../../ModelInspectorModal";
import AdminItemChangeRequestControl from "../items/AdminItemChangeRequestControl";

export default function ReadyToPrintPanel({
  order,
  onRefresh,
  onStatusTransition,
  isProcessing,
}: StatusPanelProps) {
  const { t } = useI18n();

  const [previewItem, setPreviewItem] = useState<any | null>(null);

  // Primary CTA: Start printing
  const handleStartPrint = async () => {
    await onStatusTransition("printing");
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-200 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200 uppercase tracking-wide">
              {t("admin.orderDetail.panels.readyToPrint.gateBadge")}
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t("admin.orderDetail.panels.readyToPrint.title")}
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-gray-300 mt-1">
            {t("admin.orderDetail.panels.readyToPrint.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartPrint}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Play size={16} />
          <span>{isProcessing ? t("admin.orderDetail.panels.readyToPrint.startingJob") : t("admin.orderDetail.panels.readyToPrint.startPrintJob")}</span>
        </button>
      </div>
      <div className="bg-white dark:bg-[#0e1512] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={16} className="text-teal-600 dark:text-teal-400" />
            <span>{t("admin.orderDetail.panels.readyToPrint.specsHeading", { count: order.items?.length || 0 })}</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-gray-400">
            {t("admin.orderDetail.panels.readyToPrint.pricingHidden")}
          </span>
        </div>

        <div className="space-y-3">
          {(order.items || []).map((item, index) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-200 text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.fileName || t("admin.orderDetail.panels.readyToPrint.modelItemFallback")}
                    </h4>
                    <span className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">
                      {item.material} • {item.color}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-gray-200">
                    {t("admin.orderDetail.panels.readyToPrint.quantity")} {item.count}
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
                        className="p-1.5 text-xs text-slate-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/10 rounded-lg border border-slate-200 dark:border-white/15 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>{t("admin.orderDetail.panels.readyToPrint.preview3d")}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Slicing specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white dark:bg-black/30 p-2.5 rounded-lg border border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-gray-300">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400 block">{t("admin.orderDetail.panels.readyToPrint.dimensions")}</span>
                  <strong className="text-slate-800 dark:text-gray-100">{item.size || t("common.standard")}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400 block">{t("admin.orderDetail.panels.readyToPrint.infill")}</span>
                  <strong className="text-slate-800 dark:text-gray-100">{item.infillPercent}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400 block">{t("admin.orderDetail.panels.readyToPrint.layerHeight")}</span>
                  <strong className="text-slate-800 dark:text-gray-100">{item.printQuality || "0.20mm"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-gray-400 block">{t("admin.orderDetail.panels.readyToPrint.supports")}</span>
                  <strong className="text-slate-800 dark:text-gray-100">{item.supportsNeeded ? t("admin.orderDetail.panels.readyToPrint.supportsRequired") : t("admin.orderDetail.panels.readyToPrint.supportsNone")}</strong>
                </div>
              </div>

              {/* Order Item Change Request & Revision Loop Control */}
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
          ))}
        </div>
      </div>

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
