import { useState } from "react";
import {
  Printer,
  Layers,
  Play,
  Save,
  Eye,
} from "lucide-react";
import type { StatusPanelProps } from "../types";
import api from "../../../services/api";
import { useNotify } from "../../../context/NotifyContext";
import ModelInspectorModal from "../../ModelInspectorModal";

const PRINTER_OPTIONS = [
  "Prusa MK4 #1 (0.4mm Nozzle)",
  "Prusa MK4 #2 (0.4mm Nozzle)",
  "Bambu Lab X1-Carbon #1",
  "Bambu Lab X1-Carbon #2",
  "Bambu Lab P1S #1",
  "Voron 2.4 (350mm)",
  "Creality Ender 3 S1 Pro",
  "Custom / External Farm",
];

const MATERIAL_OPTIONS = [
  "PLA - Basic Black",
  "PLA - Basic White",
  "PLA - Galaxy Silver",
  "PETG - Jet Black",
  "PETG - Signal White",
  "PETG - Transparent",
  "ABS - Anthracite Grey",
  "TPU 95A - Flexible Black",
  "ASA - Galaxy Black",
  "Customer Specified Filament",
];

export default function ReadyToPrintPanel({
  order,
  onRefresh,
  onStatusTransition,
  isProcessing,
}: StatusPanelProps) {
  const { notifySuccess, notifyError } = useNotify();

  // Production assignments
  const [assignedPrinter, setAssignedPrinter] = useState<string>(
    order.assignedPrinter || PRINTER_OPTIONS[0],
  );
  const [assignedMaterial, setAssignedMaterial] = useState<string>(
    order.assignedMaterial ||
      (order.items?.[0] ? `${order.items[0].material} - ${order.items[0].color}` : MATERIAL_OPTIONS[0]),
  );
  const [gCodeFinalized, setGCodeFinalized] = useState<boolean>(
    order.gCodeFinalized ?? false,
  );
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  // Save printer/material assignment without advancing status
  const handleSaveAssignment = async () => {
    setIsSavingAssignment(true);
    try {
      await api.patch(`/admin/orders/${order.id}/production`, {
        assignedPrinter,
        assignedMaterial,
        gCodeFinalized,
      });
      notifySuccess("Production assignment saved");
      await onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save production assignment";
      notifyError(errMsg);
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // Primary CTA: Start printing
  const handleStartPrint = async () => {
    if (!assignedPrinter.trim()) {
      notifyError("Please select a printer before starting print job.");
      return;
    }

    if (!assignedMaterial.trim()) {
      notifyError("Please select a material before starting print job.");
      return;
    }

    if (!gCodeFinalized) {
      if (!window.confirm("G-code is not marked as finalized. Proceed to start printing anyway?")) {
        return;
      }
    }

    await onStatusTransition("printing", {
      assignedPrinter,
      assignedMaterial,
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
              Production Gate
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Ready to Print (Payment Confirmed)
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Payment has been confirmed. Assign the physical 3D printer and spool, review sliced G-code, and begin the print job.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartPrint}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          <Play size={16} />
          <span>{isProcessing ? "Starting Job..." : "Start Print Job"}</span>
        </button>
      </div>

      {/* Production Assignment Card (Hardware & Material) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Printer size={16} className="text-teal-600" />
            <span>Hardware & Material Assignment</span>
          </h3>
          <button
            type="button"
            onClick={handleSaveAssignment}
            disabled={isSavingAssignment}
            className="text-xs font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors disabled:opacity-50"
          >
            <Save size={13} />
            <span>{isSavingAssignment ? "Saving..." : "Save Assignment"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Physical Printer Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Physical Printer *
            </label>
            <select
              value={assignedPrinter}
              onChange={(e) => setAssignedPrinter(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
            >
              {PRINTER_OPTIONS.map((printer) => (
                <option key={printer} value={printer}>
                  {printer}
                </option>
              ))}
            </select>
          </div>

          {/* Physical Material Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Physical Loaded Material / Filament *
            </label>
            <select
              value={assignedMaterial}
              onChange={(e) => setAssignedMaterial(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-800"
            >
              {MATERIAL_OPTIONS.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* G-code Finalization Checkbox */}
        <div className="pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
            <input
              type="checkbox"
              checked={gCodeFinalized}
              onChange={(e) => setGCodeFinalized(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
            />
            <span className="font-medium">
              G-code has been sliced, previewed, and loaded on printer.
            </span>
          </label>
        </div>
      </div>

      {/* Manufacturing Line Items (PRICING IS HIDDEN) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Layers size={16} className="text-teal-600" />
            <span>Manufacturing Specifications ({order.items?.length || 0} items)</span>
          </h3>
          <span className="text-xs text-slate-500">
            Pricing hidden for print operator
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
                      {item.fileName || "Model Item"}
                    </h4>
                    <span className="text-[11px] text-teal-700 font-medium">
                      {item.material} • {item.color}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    Quantity: {item.count}
                  </span>
                  {(item.fileUrl || item.fileName?.endsWith(".stl")) && (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="p-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors"
                    >
                      <Eye size={13} />
                      <span>3D Preview</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Slicing specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200/70 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block">Dimensions</span>
                  <strong>{item.size || "Standard"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Infill</span>
                  <strong>{item.infillPercent}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Layer Height</span>
                  <strong>{item.printQuality || "0.20mm"}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Supports</span>
                  <strong>{item.supportsNeeded ? "Required" : "None"}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3D Preview Inspector Modal */}
      {previewItem && (
        <ModelInspectorModal
          isOpen={true}
          onClose={() => setPreviewItem(null)}
          fileName={previewItem.fileName || "Model"}
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
