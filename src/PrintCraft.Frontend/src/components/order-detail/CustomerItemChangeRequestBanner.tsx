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
import type { TranslationKey } from "../../i18n/translations";
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
    if (!reason) return t("orderDetail.changeRequest.reasons.other");
    const mapped = t(`orderDetail.changeRequest.reasons.${reason}` as TranslationKey);
    return mapped || reason.replace(/_/g, " ").toUpperCase();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const allowed = [".stl", ".obj", ".3mf", ".step", ".stp", ".glb", ".gltf"];

    if (!allowed.includes(ext)) {
      setFileError(t("orderDetail.changeRequest.only3dFilesAccepted"));
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setFileError(t("orderDetail.changeRequest.fileTooLarge"));
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
        notifySuccess(t("orderDetail.changeRequest.uploadSuccess"));
      }
    } catch (err: unknown) {
      console.error("Upload failed", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("orderDetail.changeRequest.uploadFailed");
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
      setFileError(t("orderDetail.changeRequest.uploadFileRequired"));
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

      notifySuccess(t("orderDetail.changeRequest.submitSuccess"));
      setCustomerNotes("");
      setUploadedFile(null);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: unknown) {
      console.error("Failed to submit revision", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || t("orderDetail.changeRequest.submitFailed");
      notifyError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full my-3 space-y-3">
      {/* ── Active Request: Pending Customer Submission ── */}
      {isPendingCustomer && (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle size={20} className="text-amber-700" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500 text-white tracking-wide uppercase">
                    {t("orderDetail.changeRequest.badgeActionRequired")}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-900 bg-amber-100/90 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                    {getReasonLabel(changeRequest.reasonCategory)}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-gray-900 mt-1.5">
                  {itemFileName
                    ? t("orderDetail.changeRequest.changesRequestedFor", {
                        fileName: itemFileName,
                      })
                    : t("orderDetail.changeRequest.requestedByTeam")}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {changeRequest.requestedAt
                    ? new Date(changeRequest.requestedAt).toLocaleString()
                    : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-800 p-1.5 rounded-full hover:bg-amber-100/60 transition-colors cursor-pointer"
              aria-label={t("orderDetail.changeRequest.toggleDetails")}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* Admin instructions quote block */}
          <div className="bg-white/95 rounded-2xl p-4 border border-amber-200/80 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-950 uppercase tracking-wide">
              <MessageSquareQuote size={15} className="text-amber-700" />
              <span>{t("orderDetail.changeRequest.notesLabel")}:</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-800 font-medium whitespace-pre-wrap leading-relaxed pl-1">
              "{changeRequest.adminNotes}"
            </p>
            {changeRequest.requiresNewFile && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200/70 px-3 py-1.5 rounded-xl mt-2 inline-flex">
                <Info size={14} className="shrink-0 text-amber-700" />
                <span>{t("orderDetail.changeRequest.requiresFileNotice")}</span>
              </div>
            )}
          </div>

          {/* Expandable Customer Submission Form */}
          {isExpanded && (
            <form onSubmit={handleSubmitRevision} className="space-y-4 pt-1">
              {/* File Uploader */}
              {changeRequest.requiresNewFile && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-800">
                    {t("orderDetail.changeRequest.uploadLabel")}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>

                  {uploadedFile ? (
                    <div className="flex items-center justify-between gap-3 p-3.5 bg-white border border-emerald-200 rounded-2xl shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileCheck size={20} className="text-emerald-700 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {uploadedFile.name}
                          </p>
                          {uploadedFile.size && (
                            <p className="text-[11px] text-gray-500">
                              {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                              {t("orderDetail.changeRequest.ready")}
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          title={t("orderDetail.changeRequest.previewBeforeSubmit")}
                        >
                          <Eye size={13} />
                          <span>{t("orderDetail.changeRequest.preview3d")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadedFile(null)}
                          className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title={t("orderDetail.changeRequest.removeFile")}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-amber-200 hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer bg-white/70 hover:bg-white transition-all space-y-2"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".stl,.obj,.3mf,.step,.stp,.glb,.gltf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {isUploading ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-700">
                          <Loader2 size={18} className="animate-spin text-amber-600" />
                          <span>{t("orderDetail.changeRequest.uploading")}</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                            <Upload size={18} />
                          </div>
                          <div className="text-xs font-semibold text-gray-800">
                            {t("orderDetail.changeRequest.clickToSelect")}
                          </div>
                          <p className="text-[11px] text-gray-500">
                            {t("orderDetail.changeRequest.fileSupportHint")}
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
                  className="block text-xs font-semibold text-gray-800"
                >
                  {t("orderDetail.changeRequest.customerNotesLabel")}
                </label>
                <textarea
                  id={`notes-${itemId}`}
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder={t("orderDetail.changeRequest.notesPlaceholder")}
                  className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-amber-200/80 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#133827] focus:border-transparent font-normal transition-all"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isUploading ||
                    (changeRequest.requiresNewFile && !uploadedFile)
                  }
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t("orderDetail.changeRequest.submitting")}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{t("orderDetail.changeRequest.submitBtn")}</span>
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
        <div className="rounded-2xl border border-sky-200/90 bg-sky-50/60 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-800 shrink-0 mt-0.5">
              <Clock size={18} className="text-sky-700" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-600 text-white tracking-wide uppercase">
                  {t("orderDetail.changeRequest.badgeRevisionSubmitted")}
                </span>
                <span className="text-xs text-sky-800 font-medium">
                  {changeRequest.submittedAt
                    ? new Date(changeRequest.submittedAt).toLocaleString()
                    : ""}
                </span>
              </div>
              <h4 className="text-sm font-bold text-gray-900">
                {t("orderDetail.changeRequest.submittedBannerTitle")}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t("orderDetail.changeRequest.submittedBannerDesc")}
              </p>

              {changeRequest.customerNotes && (
                <div className="mt-2 p-3 bg-white/90 border border-sky-200/80 rounded-xl text-xs text-gray-700 italic">
                  "{changeRequest.customerNotes}"
                </div>
              )}

              {changeRequest.submittedFileUrl && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-950 bg-white border border-sky-200 px-3 py-1.5 rounded-full">
                    <FileCheck size={14} className="text-emerald-700 shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-xs font-semibold">
                      {changeRequest.submittedFileName ||
                        t("orderDetail.changeRequest.revisedModelFallback")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setInspectingModel({
                        url: changeRequest.submittedFileUrl!,
                        name:
                          changeRequest.submittedFileName ||
                          t("orderDetail.changeRequest.revisedModelFallback"),
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>{t("orderDetail.changeRequest.preview3d")}</span>
                  </button>

                  <a
                    href={resolveAssetUrl(changeRequest.submittedFileUrl)}
                    download={
                      changeRequest.submittedFileName ||
                      t("orderDetail.changeRequest.revisedModelFallback")
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>{t("orderDetail.changeRequest.download")}</span>
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 px-4 py-2 rounded-full border border-gray-200/80 shadow-2xs transition-colors cursor-pointer"
          >
            <History size={14} className="text-gray-500" />
            <span>
              {showHistory
                ? t("orderDetail.changeRequest.hideHistoryBtn")
                : `${t("orderDetail.changeRequest.viewHistoryBtn")} (${history.length})`}
            </span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-3 pl-3 border-l-2 border-gray-200">
              {history.map((req, idx) => {
                const roundNum = history.length - idx;
                const isItemResolved = req.status === "resolved";
                const isItemSuperseded = req.status === "superseded";

                return (
                  <div
                    key={req.id || idx}
                    className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono font-semibold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-md text-[11px]">
                        {t("orderDetail.changeRequest.round")}{roundNum}
                      </span>
                      <span
                        className={`font-semibold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${
                          isItemResolved
                            ? "bg-emerald-100 text-emerald-800"
                            : isItemSuperseded
                              ? "bg-gray-100 text-gray-600"
                              : req.status === "revision_submitted"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isItemResolved
                          ? t("orderDetail.changeRequest.badgeResolved")
                          : isItemSuperseded
                            ? t("orderDetail.changeRequest.badgeSuperseded")
                            : req.status === "revision_submitted"
                              ? t("orderDetail.changeRequest.badgeRevisionSubmitted")
                              : t("orderDetail.changeRequest.badgeActionRequired")}
                      </span>
                    </div>

                    <div className="space-y-1 text-gray-700">
                      <p>
                        <strong className="text-gray-900">{t("orderDetail.changeRequest.engineerRequest")}</strong>{" "}
                        [{getReasonLabel(req.reasonCategory)}] "{req.adminNotes}"
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(req.requestedAt).toLocaleString()}
                      </p>
                    </div>

                    {req.customerNotes && (
                      <div className="p-3 bg-[#fbfbfd] rounded-xl border border-gray-200/60 space-y-0.5">
                        <p className="text-gray-700">
                          <strong className="text-gray-900">{t("orderDetail.changeRequest.customerNote")}</strong> "{req.customerNotes}"
                        </p>
                        {req.submittedFileName && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-gray-600 text-[11px] font-medium">
                              {t("orderDetail.changeRequest.file")}{" "}
                              <strong>{req.submittedFileName}</strong>
                            </span>
                            {req.submittedFileUrl && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setInspectingModel({
                                      url: req.submittedFileUrl!,
                                      name:
                                        req.submittedFileName ||
                                        t("orderDetail.changeRequest.revisedModelFallback"),
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px] font-medium transition-colors cursor-pointer"
                                  title={t("orderDetail.changeRequest.previewRevised")}
                                >
                                  <Eye size={11} />
                                  <span>{t("orderDetail.changeRequest.preview3d")}</span>
                                </button>
                                <a
                                  href={resolveAssetUrl(req.submittedFileUrl)}
                                  download={
                                    req.submittedFileName ||
                                    t("orderDetail.changeRequest.revisedModelFallback")
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 text-[11px] font-medium transition-colors cursor-pointer"
                                  title={t("orderDetail.changeRequest.downloadRevised")}
                                >
                                  <Download size={11} />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                        {req.submittedAt && (
                          <p className="text-[10px] text-gray-400">
                            {new Date(req.submittedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {req.resolutionNotes && (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 space-y-0.5">
                        <p>
                          <strong className="text-emerald-950">{t("orderDetail.changeRequest.resolution")}</strong> {req.resolutionNotes}
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
