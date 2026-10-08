import { useState } from "react";
import {
  CheckCircle,
  Printer,
  Layers,
  Eye,
} from "lucide-react";
import type { StatusPanelProps } from "../types";
import ModelInspectorModal from "../../ModelInspectorModal";

export default function PrintingPanel({
  order,
  onStatusTransition,
  isProcessing,
}: StatusPanelProps) {
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  const handleFinishPrinting = async () => {
    if (
      window.confirm(
        "Confirm that the print job has completed successfully? This will move the order to 'Post-Processing'.",
      )
    ) {
      await onStatusTransition("post_processing");
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-200 text-indigo-900 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              Actively Printing
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Print Job in Progress
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Order is currently running on the build plate. Once completed, clear the build surface and move to QC & post-processing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFinishPrinting}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          <CheckCircle size={16} />
          <span>{isProcessing ? "Updating..." : "Print Complete → Move to Post-Processing"}</span>
        </button>
      </div>

      {/* Hardware Assignment Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Printer size={16} className="text-indigo-600" />
          <span>Active Hardware Assignment</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Assigned Printer</span>
            <strong className="text-sm text-slate-900 font-semibold block">
              {order.assignedPrinter || "Prusa MK4 #1"}
            </strong>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-400 block mb-1">Loaded Filament / Material</span>
            <strong className="text-sm text-slate-900 font-semibold block">
              {order.assignedMaterial || "PLA Basic Black"}
            </strong>
          </div>
        </div>
      </div>

      {/* Sliced Items on Plate */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Layers size={16} className="text-indigo-600" />
          <span>Build Plate Line Items ({order.items?.length || 0})</span>
        </h3>

        <div className="space-y-3">
          {(order.items || []).map((item, index) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">
                      {item.fileName || "Model Item"}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {item.material} • {item.color}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    Qty: {item.count}
                  </span>
                  {(item.fileUrl || item.fileName?.endsWith(".stl")) && (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                    >
                      <Eye size={13} />
                      <span>3D Preview</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-lg border border-slate-200/60 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block">Est. Print Time</span>
                  <strong>{item.estimatedPrintTime || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Filament Weight</span>
                  <strong>{item.filamentUsedGrams ? `${item.filamentUsedGrams}g` : "N/A"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Infill</span>
                  <strong>{item.infillPercent}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Layer Height</span>
                  <strong>{item.printQuality || "0.20mm"}</strong>
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
          fileName={previewItem.fileName || "Model"}
          fileUrl={previewItem.fileUrl}
          material={previewItem.material}
          color={previewItem.color}
          size={previewItem.size}
        />
      )}
    </div>
  );
}
