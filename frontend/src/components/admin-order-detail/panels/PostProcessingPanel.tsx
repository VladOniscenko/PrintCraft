import { useState } from "react";
import {
  Truck,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { StatusPanelProps } from "../types";
import { useNotify } from "../../../context/NotifyContext";
import api from "../../../services/api";

const COURIER_OPTIONS = [
  { name: "PostNL", trackingUrlPattern: "https://postnl.nl/tracktrace/?B=" },
  { name: "DHL Express / Parcel", trackingUrlPattern: "https://www.dhl.com/nl-en/home/tracking/tracking-express.html?submit=1&tracking-id=" },
  { name: "DPD", trackingUrlPattern: "https://www.dpd.com/nl/nl/ontvangen/volgen/?parcel=" },
  { name: "UPS", trackingUrlPattern: "https://www.ups.com/track?tracknum=" },
  { name: "FedEx", trackingUrlPattern: "https://www.fedex.com/fedextrack/?trknbr=" },
  { name: "Local Pickup / Other", trackingUrlPattern: "" },
];

export default function PostProcessingPanel({
  order,
  onRefresh,
  onStatusTransition,
  isProcessing,
}: StatusPanelProps) {
  const { notifyError, notifySuccess } = useNotify();

  // Track & Trace inputs
  const [courier, setCourier] = useState<string>("PostNL");
  const [trackingNumber, setTrackingNumber] = useState<string>(
    order.trackingCode || "",
  );
  const [trackingUrl, setTrackingUrl] = useState<string>(
    order.trackingUrl || "",
  );
  const [qualityCheckPassed, setQualityCheckPassed] = useState<boolean>(false);
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  // Auto-generate tracking URL when courier or tracking number changes
  const handleTrackingNumberChange = (num: string) => {
    setTrackingNumber(num);
    const selected = COURIER_OPTIONS.find((c) => c.name === courier);
    if (selected && selected.trackingUrlPattern && num.trim()) {
      setTrackingUrl(`${selected.trackingUrlPattern}${encodeURIComponent(num.trim())}`);
    }
  };

  const handleCourierChange = (cName: string) => {
    setCourier(cName);
    const selected = COURIER_OPTIONS.find((c) => c.name === cName);
    if (selected && selected.trackingUrlPattern && trackingNumber.trim()) {
      setTrackingUrl(`${selected.trackingUrlPattern}${encodeURIComponent(trackingNumber.trim())}`);
    }
  };

  const handleSaveTrackingDraft = async () => {
    if (!trackingNumber.trim()) return;
    setIsSavingTracking(true);
    try {
      await api.patch(`/admin/orders/${order.id}/tracking`, {
        trackingCode: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || null,
      });
      notifySuccess("Tracking details saved as draft");
      await onRefresh();
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save tracking details";
      notifyError(errMsg);
    } finally {
      setIsSavingTracking(false);
    }
  };

  // Primary CTA: Mark as Shipped
  const handleMarkAsShipped = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qualityCheckPassed) {
      notifyError("Quality check must be confirmed before marking order as shipped.");
      return;
    }

    if (!trackingNumber.trim()) {
      notifyError("A tracking number is required to mark the order as shipped.");
      return;
    }

    // Gate: state machine requires QualityCheckPassed and TrackingNumber
    await onStatusTransition("shipped", {
      qualityCheckPassed: true,
      trackingNumber: trackingNumber.trim(),
      trackingUrl: trackingUrl.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-200 text-purple-900 uppercase tracking-wide">
              QC & Fulfillment Gate
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Post-Processing & Packaging
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Perform dimensional and cosmetic quality inspection, package securely, and enter courier tracking information to dispatch.
          </p>
        </div>
      </div>

      <form onSubmit={handleMarkAsShipped} className="space-y-6">
        {/* Quality Check Inspection Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck size={16} className="text-purple-600" />
            <span>Quality Inspection Gate</span>
          </h3>

          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-150 text-xs space-y-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={qualityCheckPassed}
                onChange={(e) => setQualityCheckPassed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">
                  Quality check passed (Dimensions, surfaces, and support removal verified) *
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Required by state machine before transitioning order to Shipped.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Track & Trace Fields */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Truck size={16} className="text-purple-600" />
              <span>Track & Trace Courier Information</span>
            </h3>

            {trackingNumber.trim() && (
              <button
                type="button"
                onClick={handleSaveTrackingDraft}
                disabled={isSavingTracking}
                className="text-xs text-purple-700 hover:text-purple-900 underline disabled:opacity-50"
              >
                {isSavingTracking ? "Saving..." : "Save Draft"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Courier Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Courier / Shipping Carrier *
              </label>
              <select
                value={courier}
                onChange={(e) => handleCourierChange(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium text-slate-800"
              >
                {COURIER_OPTIONS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tracking Number Input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tracking Number (Barcode / Code) *
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => handleTrackingNumberChange(e.target.value)}
                placeholder="e.g. 3SABCD123456789"
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Optional Tracking URL */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tracking URL (Direct link for customer)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-slate-700"
              />
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-500 hover:text-purple-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                  title="Test Tracking Link"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Primary CTA: Mark as Shipped */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isProcessing || !qualityCheckPassed || !trackingNumber.trim()}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle size={16} />
            <span>{isProcessing ? "Marking as Shipped..." : "Mark as Shipped"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
