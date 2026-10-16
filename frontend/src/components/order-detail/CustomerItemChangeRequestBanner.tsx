import { useState, useRef } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Upload,
  FileCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  MessageSquareQuote,
  X,
  Eye,
  Download,
} from "lucide-react";
import api from "../../services/api";
import { useNotify } from "../../context/NotifyContext";
import { useI18n } from "../../i18n/I18nContext";
import type { OrderItemChangeRequestDto } from "../../types/order";
import { resolveAssetUrl } from "../../utils/assetUrl";
import ModelInspectorModal from "../ModelInspectorModal";

interface CustomerItemChangeRequestBannerProps {
  orderId: string;
  itemId: string;
  itemFileName?: string;
  material?: string;
  color?: string;
  changeRequest?: OrderItemChangeRequestDto | null;
  history?: OrderItemChangeRequestDto[];
  onRefresh?: () => void | Promise<void>;
}

export default function CustomerItemChangeRequestBanner({
  orderId,
  itemId,
  itemFileName,
  material,
  color,
  changeRequest,
  history = [],
  onRefresh,
}: CustomerItemChangeRequestBannerProps) {
  const { t } = useI18n();
  const { notifySuccess, notifyError } = useNotify();

  const [isExpanded, setIsExpanded] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [inspectingModel, setInspectingModel] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // Form states
  const [customerNotes, setCustomerNotes] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    size?: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!changeRequest && (!history || history.length === 0)) {
    return null;
  }

  const isPendingCustomer = changeRequest?.status === "pending_customer";
  const isRevisionSubmitted = changeRequest?.status === "revision_submitted";


  const getReasonLabel = (reason?: string) => {
    if (!reason) return t("orderDetail.changeRequest.reasons.other") || "Changes Required";
    const mapped = t(`orderDetail.changeRequest.reasons.${reason}`);
    return mapped || reason.replace(/_/g, " ").toUpperCase();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const allowed = [".stl", ".obj", ".3mf", ".step", ".stp", ".glb", ".gltf"];

    if (!allowed.includes(ext)) {
      setFileError("Only 3D model files (.stl, .obj, .3mf, .step, .stp, .glb) are accepted.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setFileError("File is too large. Maximum size is 50 MB.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post<{ url: string }>("/upload", formData);
      if (res.data?.url) {
        setUploadedFile({
          url: res.data.url,
          name: file.name,
          size: file.size,
        });
        notifySuccess("File uploaded successfully");
      }
    } catch (err: unknown) {
      console.error("Upload failed", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to upload file";
      setFileError(errMsg);
      notifyError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeRequest) return;

    if (changeRequest.requiresNewFile && !uploadedFile) {
      setFileError("Please upload a replacement 3D model file to complete this revision.");
      return;
    }

    setIsSubmitting(true);
    setFileError(null);

    try {
      await api.post(
        `/orders/${orderId}/items/${itemId}/change-requests/${changeRequest.id}/submit`,
        {
          newFileUrl: uploadedFile?.url,
          newFileName: uploadedFile?.name,
          customerNotes: customerNotes.trim(),
        },
      );

      notifySuccess("Revision submitted to PrintCraft engineering team!");
      setCustomerNotes("");
      setUploadedFile(null);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: unknown) {
      console.error("Failed to submit revision", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to submit revision";
      notifyError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full my-3 space-y-3">
      {/* ── Active Request: Pending Customer Submission ── */}
      {isPendingCustomer && (
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-orange-50/50 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle size={22} className="text-amber-600" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white tracking-wide uppercase">
                    {t("orderDetail.changeRequest.badgeActionRequired") || "Action Required"}
                  </span>
                  <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-md">
                    {getReasonLabel(changeRequest.reasonCategory)}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                  {itemFileName
                    ? `Changes requested for "${itemFileName}"`
                    : t("orderDetail.changeRequest.requestedByTeam") ||
                      "Changes requested by PrintCraft engineering"}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {changeRequest.requestedAt
                    ? new Date(changeRequest.requestedAt).toLocaleString()
                    : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-amber-100/60 transition-colors"
              aria-label="Toggle change request details"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {/* Admin instructions quote block */}
          <div className="bg-white/90 rounded-xl p-3.5 border border-amber-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wide">
              <MessageSquareQuote size={15} className="text-amber-600" />
              <span>{t("orderDetail.changeRequest.notesLabel") || "Engineer Instructions"}:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed pl-1">
              "{changeRequest.adminNotes}"
            </p>
            {changeRequest.requiresNewFile && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg mt-2 inline-flex">
                <Info size={13} className="shrink-0 text-amber-700" />
                <span>
                  {t("orderDetail.changeRequest.requiresFileNotice") ||
                    "A replacement 3D model file (.stl, .obj, .3mf) is required."}
                </span>
              </div>
            )}
          </div>

          {/* Expandable Customer Submission Form */}
          {isExpanded && (
            <form onSubmit={handleSubmitRevision} className="space-y-4 pt-1">
              {/* File Uploader */}
              {changeRequest.requiresNewFile && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    {t("orderDetail.changeRequest.uploadLabel") ||
                      "Upload Replacement 3D Model (.stl, .obj, .3mf, .step)"}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>

                  {uploadedFile ? (
                    <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCheck size={20} className="text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {uploadedFile.name}
                          </p>
                          {uploadedFile.size && (
                            <p className="text-[11px] text-slate-500">
                              {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setInspectingModel({
                              url: uploadedFile.url,
                              name: uploadedFile.name,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                          title="Preview 3D model before submitting"
                        >
                          <Eye size={13} />
                          <span>Preview 3D</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadedFile(null)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove uploaded file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl p-5 text-center cursor-pointer bg-white/70 hover:bg-white transition-all space-y-2"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".stl,.obj,.3mf,.step,.stp,.glb,.gltf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {isUploading ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-700">
                          <Loader2 size={18} className="animate-spin text-amber-600" />
                          <span>
                            {t("orderDetail.changeRequest.uploading") || "Uploading model..."}
                          </span>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="mx-auto text-amber-600" />
                          <div className="text-xs font-bold text-slate-800">
                            Click to select your corrected 3D model
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Supports STL, OBJ, 3MF, STEP up to 50 MB
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {fileError && (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>{fileError}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Customer Explanation Notes */}
              <div className="space-y-1.5">
                <label
                  htmlFor={`notes-${itemId}`}
                  className="block text-xs font-bold text-slate-800"
                >
                  {t("orderDetail.changeRequest.customerNotesLabel") || "Your Notes / Explanation"}
                </label>
                <textarea
                  id={`notes-${itemId}`}
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder={
                    t("orderDetail.changeRequest.notesPlaceholder") ||
                    "Describe what you updated (e.g. fixed holes in mesh, thickened walls)..."
                  }
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-amber-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-normal transition-all"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading || (changeRequest.requiresNewFile && !uploadedFile)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t("orderDetail.changeRequest.submitting") || "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{t("orderDetail.changeRequest.submitBtn") || "Submit Revision"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Active Request: Revision Submitted by Customer ── */}
      {isRevisionSubmitted && (
        <div className="rounded-2xl border border-sky-300 bg-gradient-to-b from-sky-50 to-blue-50/40 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-800 shrink-0 mt-0.5">
              <Clock size={20} className="text-sky-600" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-600 text-white tracking-wide uppercase">
                  {t("orderDetail.changeRequest.badgeRevisionSubmitted") || "Revision Under Review"}
                </span>
                <span className="text-xs text-sky-800 font-medium">
                  {changeRequest.submittedAt
                    ? new Date(changeRequest.submittedAt).toLocaleString()
                    : ""}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                {t("orderDetail.changeRequest.submittedBannerTitle") ||
                  "Revision Submitted to PrintCraft"}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("orderDetail.changeRequest.submittedBannerDesc") ||
                  "Your updated 3D model and notes have been received and are pending engineer review."}
              </p>

              {changeRequest.customerNotes && (
                <div className="mt-2 p-2.5 bg-white/80 border border-sky-200 rounded-lg text-xs text-slate-700 italic">
                  "{changeRequest.customerNotes}"
                </div>
              )}

              {changeRequest.submittedFileUrl && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900 bg-white/90 border border-sky-200 px-3 py-1.5 rounded-lg">
                    <FileCheck size={14} className="text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-xs">
                      {changeRequest.submittedFileName || "Updated Model"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setInspectingModel({
                        url: changeRequest.submittedFileUrl!,
                        name: changeRequest.submittedFileName || "Revised Model",
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Preview 3D</span>
                  </button>

                  <a
                    href={resolveAssetUrl(changeRequest.submittedFileUrl)}
                    download={changeRequest.submittedFileName || "revised-model"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Revision History Accordion ── */}
      {history.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
          >
            <History size={14} className="text-slate-500" />
            <span>
              {showHistory
                ? t("orderDetail.changeRequest.hideHistoryBtn") || "Hide Revision History"
                : `${t("orderDetail.changeRequest.viewHistoryBtn") || "Revision History"} (${history.length})`}
            </span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showHistory && (
            <div className="mt-2.5 space-y-2.5 pl-2 border-l-2 border-slate-200">
              {history.map((req, idx) => {
                const roundNum = history.length - idx;
                const isItemResolved = req.status === "resolved";
                const isItemSuperseded = req.status === "superseded";

                return (
                  <div
                    key={req.id || idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        Round #{roundNum}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide ${
                          isItemResolved
                            ? "bg-emerald-100 text-emerald-800"
                            : isItemSuperseded
                              ? "bg-slate-100 text-slate-600"
                              : req.status === "revision_submitted"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {req.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-700">
                      <p>
                        <strong>Engineer Request:</strong> [{getReasonLabel(req.reasonCategory)}] "{req.adminNotes}"
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(req.requestedAt).toLocaleString()}
                      </p>
                    </div>

                    {req.customerNotes && (
                      <div className="p-2 bg-slate-50 rounded border border-slate-100 space-y-0.5">
                        <p className="text-slate-700">
                          <strong>Customer Note:</strong> "{req.customerNotes}"
                        </p>
                        {req.submittedFileName && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="text-slate-600 text-[11px] font-medium">
                              File: <strong>{req.submittedFileName}</strong>
                            </span>
                            {req.submittedFileUrl && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInspectingModel({
                                      url: req.submittedFileUrl!,
                                      name: req.submittedFileName || "Revised Model",
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Preview this revised model"
                                >
                                  <Eye size={11} />
                                  <span>Preview 3D</span>
                                </button>
                                <a
                                  href={resolveAssetUrl(req.submittedFileUrl)}
                                  download={req.submittedFileName || "revised-model"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Download revised file"
                                >
                                  <Download size={11} />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                        {req.submittedAt && (
                          <p className="text-[10px] text-slate-400">
                            {new Date(req.submittedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {req.resolutionNotes && (
                      <div className="p-2 bg-emerald-50 rounded border border-emerald-100 text-emerald-900 space-y-0.5">
                        <p>
                          <strong>Resolution:</strong> {req.resolutionNotes}
                        </p>
                        {req.resolvedAt && (
                          <p className="text-[10px] text-emerald-700">
                            {new Date(req.resolvedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 3D Model Inspector Modal for Revised Models ── */}
      {inspectingModel && (
        <ModelInspectorModal
          isOpen={!!inspectingModel}
          onClose={() => setInspectingModel(null)}
          fileName={inspectingModel.name}
          fileUrl={inspectingModel.url}
          material={material}
          color={color}
        />
      )}
    </div>
  );
}
