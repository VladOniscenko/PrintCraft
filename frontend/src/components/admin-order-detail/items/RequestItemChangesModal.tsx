import { useState } from "react";
import {
  X,
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";
import api from "../../../services/api";
import { useNotify } from "../../../context/NotifyContext";

interface RequestItemChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  itemId: string;
  itemFileName?: string;
  onSuccess: () => void | Promise<void>;
}

const REASON_CATEGORIES = [
  {
    id: "broken_geometry",
    label: "Broken Geometry / Non-Manifold Mesh",
    hint: "Holes, inverted normals, self-intersections, or non-watertight surfaces.",
  },
  {
    id: "wall_thickness",
    label: "Wall Thickness Below Minimum Threshold (< 0.8mm)",
    hint: "Feature walls or details are too thin to be reliably printed without collapsing.",
  },
  {
    id: "scale_or_size",
    label: "Incorrect Scale or Dimensions",
    hint: "Model dimensions appear exported in wrong units (e.g. meters instead of mm) or exceed print bed.",
  },
  {
    id: "orientation",
    label: "Orientation or Support Redesign Needed",
    hint: "Overhangs or delicate cantilevers need manual orientation, split, or support adjustment.",
  },
  {
    id: "unsupported_format",
    label: "Unsupported or Corrupted File",
    hint: "The 3D model could not be opened or parsed properly.",
  },
  {
    id: "other",
    label: "Custom / Other Adjustments",
    hint: "Any other engineering or design change requested from the customer.",
  },
];

export default function RequestItemChangesModal({
  isOpen,
  onClose,
  orderId,
  itemId,
  itemFileName,
  onSuccess,
}: RequestItemChangesModalProps) {
  const { notifySuccess, notifyError } = useNotify();

  const [reasonCategory, setReasonCategory] = useState("broken_geometry");
  const [adminNotes, setAdminNotes] = useState("");
  const [requiresNewFile, setRequiresNewFile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNotes.trim()) {
      setValidationError("Please describe what needs to be changed and give the customer clear instructions.");
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      await api.post(`/admin/orders/${orderId}/items/${itemId}/change-requests`, {
        reasonCategory,
        adminNotes: adminNotes.trim(),
        requiresNewFile,
      });

      notifySuccess("Change request sent to customer and notification dispatched!");
      setAdminNotes("");
      onClose();
      await onSuccess();
    } catch (err: unknown) {
      console.error("Failed to create change request", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create change request";
      notifyError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-request-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <h3
                id="change-request-modal-title"
                className="text-base font-extrabold text-slate-900"
              >
                Request Changes from Customer
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-sm">
                Target Item: <strong>{itemFileName || "3D Model"}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Reason Category Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Issue Category <span className="text-red-500">*</span>
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {REASON_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 italic">
              {REASON_CATEGORIES.find((c) => c.id === reasonCategory)?.hint}
            </p>
          </div>

          {/* Admin Instructions / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Detailed Instructions for Customer <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => {
                setAdminNotes(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g. Non-manifold geometry detected at the base mount. Please repair holes and normals in Blender or Netfabb, and re-upload the fixed STL..."
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-normal leading-relaxed"
            />
            {validationError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1">
                <AlertTriangle size={13} className="shrink-0" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          {/* Requires New File Checkbox */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <label className="flex items-center gap-2.5 text-xs text-slate-800 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requiresNewFile}
                onChange={(e) => setRequiresNewFile(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
              />
              <span>Require customer to upload a replacement 3D model file</span>
            </label>
            <p className="text-[11px] text-slate-500 ml-6.5 mt-0.5">
              When checked, customer must upload a new STL, OBJ, or 3MF before submitting their revision.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Change Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
