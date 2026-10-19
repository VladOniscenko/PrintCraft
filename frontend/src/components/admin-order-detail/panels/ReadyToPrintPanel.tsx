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

  const [gCodeFinalized, setGCodeFinalized] = useState<boolean>(
    order.gCodeFinalized ?? false,
  );
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  // Primary CTA: Start printing
  const handleStartPrint = async () => {
    if (!gCodeFinalized) {
      if (!window.confirm(t("admin.orderDetail.panels.readyToPrint.gcodeWarning"))) {
        return;
      }
    }

    await onStatusTransition("printing", {
      gCodeFinalized: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-200 text-teal-900 uppercase tracking-wide">
              {t("admin.orderDetail.panels.readyToPrint.gateBadge")}
            </span>
            <h2 className="text-base font-bold text-slate-900">
              {t("admin.orderDetail.panels.readyToPrint.title")}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {t("admin.orderDetail.panels.readyToPrint.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartPrint}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          <Play size={16} />
          <span>{isProcessing ? t("admin.orderDetail.panels.readyToPrint.startingJob") : t("admin.orderDetail.panels.readyToPrint.startPrintJob")}</span>
        </button>
      </div>

      {/* G-code Finalization Checkbox */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
          <input
            type="checkbox"
            checked={gCodeFinalized}
            onChange={(e) => setGCodeFinalized(e.target.checked)}
            className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
          />
          <span className="font-medium">
            {t("admin.orderDetail.panels.readyToPrint.gcodeCheckbox")}
          </span>
        </label>
      </div>

      {/* Manufacturing Line Items (PRICING IS HIDDEN) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Layers size={16} className="text-teal-600" />
            <span>{t("admin.orderDetail.panels.readyToPrint.specsHeading", { count: order.items?.length || 0 })}</span>
          </h3>
          <span className="text-xs text-slate-500">
            {t("admin.orderDetail.panels.readyToPrint.pricingHidden")}
          </span>
        </div>

        <div className="space-y-3">
          {(order.items || []).map((item, index) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {item.fileName || t("admin.orderDetail.panels.readyToPrint.modelItemFallback")}
                    </h4>
                    <span className="text-[11px] text-teal-700 font-medium">
                      {item.material} • {item.color}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
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
                        className="p-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                      >
                        <Eye size={13} />
                        <span>{t("admin.orderDetail.panels.readyToPrint.preview3d")}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Slicing specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/70 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block">{t("admin.orderDetail.panels.readyToPrint.dimensions")}</span>
                  <strong>{item.size || t("common.standard")}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t("admin.orderDetail.panels.readyToPrint.infill")}</span>
                  <strong>{item.infillPercent}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t("admin.orderDetail.panels.readyToPrint.layerHeight")}</span>
                  <strong>{item.printQuality || "0.20mm"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t("admin.orderDetail.panels.readyToPrint.supports")}</span>
                  <strong>{item.supportsNeeded ? t("admin.orderDetail.panels.readyToPrint.supportsRequired") : t("admin.orderDetail.panels.readyToPrint.supportsNone")}</strong>
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
