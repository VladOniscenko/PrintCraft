import { useState } from "react";
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  History,
  Eye,
  Download,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Wrench,
} from "lucide-react";
import type { OrderItemChangeRequestDto } from "../../../types/order";
import api from "../../../services/api";
import { useNotify } from "../../../context/NotifyContext";
import { useI18n } from "../../../i18n/I18nContext";
import { resolveAssetUrl } from "../../../utils/assetUrl";
import RequestItemChangesModal from "./RequestItemChangesModal";

interface AdminItemChangeRequestControlProps {
  orderId: string;
  itemId: string;
  itemFileName?: string | null;
  activeChangeRequest?: OrderItemChangeRequestDto | null;
  changeRequests?: OrderItemChangeRequestDto[];
  onRefresh: () => void | Promise<void>;
  onPreviewModel?: (fileUrl: string, fileName?: string) => void;
}

export default function AdminItemChangeRequestControl({
  orderId,
  itemId,
  itemFileName,
  activeChangeRequest,
  changeRequests = [],
  onRefresh,
  onPreviewModel,
}: AdminItemChangeRequestControlProps) {
  const { notifySuccess, notifyError } = useNotify();
  const { t } = useI18n();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [showResolveInput, setShowResolveInput] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState(
    t("admin.orderDetail.changeRequests.defaultResolutionNotes"),
  );

  const isPendingCustomer = activeChangeRequest?.status === "pending_customer";
  const isRevisionSubmitted = activeChangeRequest?.status === "revision_submitted";

  const handleResolve = async () => {
    if (!activeChangeRequest) return;
    setIsResolving(true);
    try {
      await api.post(
        `/admin/orders/${orderId}/items/${itemId}/change-requests/${activeChangeRequest.id}/resolve`,
        {
          resolutionNotes: resolutionNotes.trim(),
        },
      );
      notifySuccess(t("admin.orderDetail.changeRequests.acceptedSuccess"));
      setShowResolveInput(false);
      await onRefresh();
    } catch (err: unknown) {
      console.error("Failed to resolve change request", err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to resolve change request";
      notifyError(errMsg);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="w-full pt-2 border-t border-slate-200/80 space-y-2.5">
      {/* ── Case 1: Active Change Request Pending Customer ── */}
      {isPendingCustomer && (
        <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                <Clock size={12} className="text-amber-700 animate-spin" />
                {t("admin.orderDetail.changeRequests.awaitingRevision")}
              </span>
              <span className="text-xs font-semibold text-slate-700">
                [{activeChangeRequest.reasonCategory.replace(/_/g, " ").toUpperCase()}]
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              {t("admin.orderDetail.changeRequests.updateRerequest")}
            </button>
          </div>

          <p className="text-xs text-slate-700 italic bg-white/70 p-2.5 rounded-lg border border-amber-200/60 whitespace-pre-wrap">
            "{activeChangeRequest.adminNotes}"
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{t("admin.orderDetail.changeRequests.requested")} {new Date(activeChangeRequest.requestedAt).toLocaleString()}</span>
            <span>{t("admin.orderDetail.changeRequests.by")} {activeChangeRequest.requestedBy || t("breadcrumb.admin")}</span>
          </div>
        </div>
      )}

      {/* ── Case 2: Customer Submitted Revision (Review Needed!) ── */}
      {isRevisionSubmitted && (
        <div className="p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50/70 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white tracking-wide uppercase shadow-2xs">
              <CheckCircle2 size={13} />
              {t("admin.orderDetail.changeRequests.newRevisionSubmitted")}
            </span>

            <span className="text-xs text-emerald-800 font-semibold">
              {activeChangeRequest.submittedAt
                ? new Date(activeChangeRequest.submittedAt).toLocaleString()
                : ""}
            </span>
          </div>

          {/* Customer Explanation */}
          {activeChangeRequest.customerNotes && (
            <div className="p-3 bg-white/90 border border-emerald-200 rounded-lg text-xs text-slate-800 space-y-1">
              <span className="font-bold text-emerald-950 block">{t("admin.orderDetail.changeRequests.customerExplanation")}</span>
              <p className="italic whitespace-pre-wrap">"{activeChangeRequest.customerNotes}"</p>
            </div>
          )}

          {/* Submitted File Details & 3D Preview CTA */}
          {activeChangeRequest.submittedFileUrl && (
            <div className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-lg border border-emerald-200 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck size={18} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900 truncate max-w-xs">
                  {activeChangeRequest.submittedFileName || t("admin.orderDetail.changeRequests.replacementModelFallback")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onPreviewModel && (
                  <button
                    type="button"
                    onClick={() =>
                      onPreviewModel(
                        activeChangeRequest.submittedFileUrl!,
                        activeChangeRequest.submittedFileName || itemFileName || "model",
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>{t("admin.orderDetail.changeRequests.preview3d")}</span>
                  </button>
                )}

                <a
                  href={resolveAssetUrl(activeChangeRequest.submittedFileUrl)}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>{t("admin.orderDetail.changeRequests.download")}</span>
                </a>
              </div>
            </div>
          )}

          {/* Resolution Controls */}
          {showResolveInput ? (
            <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                {t("admin.orderDetail.changeRequests.acceptanceNote")}
              </label>
              <input
                type="text"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder={t("admin.orderDetail.changeRequests.acceptancePlaceholder")}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResolveInput(false)}
                  disabled={isResolving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t("admin.orderDetail.changeRequests.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={isResolving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs disabled:opacity-50"
                >
                  {isResolving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  <span>{t("admin.orderDetail.changeRequests.confirmAccept")}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>{t("admin.orderDetail.changeRequests.requestFurtherChanges")}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowResolveInput(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{t("admin.orderDetail.changeRequests.acceptRevision")}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Case 3: No Active Request (Idle or Previously Resolved) ── */}
      {!isPendingCustomer && !isRevisionSubmitted && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Wrench size={13} className="text-amber-700" />
            <span>{t("admin.orderDetail.changeRequests.requestChangesFromCustomer")}</span>
          </button>

          {changeRequests.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
            >
              <History size={12} />
              <span>
                {showHistory
                  ? t("admin.orderDetail.changeRequests.hideHistory")
                  : t("admin.orderDetail.changeRequests.pastRevisions", { count: changeRequests.length })}
              </span>
              {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      )}

      {/* ── Expandable History Timeline for Admin ── */}
      {showHistory && changeRequests.length > 0 && (
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
            <History size={13} />
            <span>{t("admin.orderDetail.changeRequests.auditTrail")}</span>
          </div>

          <div className="space-y-2 border-l-2 border-slate-200 pl-3">
            {changeRequests.map((cr, idx) => {
              const roundNum = changeRequests.length - idx;
              return (
                <div key={cr.id || idx} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                      {t("admin.orderDetail.changeRequests.round")}{roundNum}
                    </span>
                    <span className="font-bold text-[10px] uppercase tracking-wide text-slate-600">
                      {cr.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(cr.requestedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-slate-700">
                    <strong>{t("admin.orderDetail.changeRequests.reason")}</strong> [{cr.reasonCategory}] "{cr.adminNotes}"
                  </p>

                  {cr.customerNotes && (
                    <p className="text-slate-600 italic">
                      {t("admin.orderDetail.changeRequests.customerResponse")} "{cr.customerNotes}"
                    </p>
                  )}

                  {cr.submittedFileUrl && (
                    <div className="flex items-center gap-2 text-[11px] text-teal-700">
                      <span>
                        {t("admin.orderDetail.changeRequests.file")}{" "}
                        {cr.submittedFileName || t("admin.orderDetail.changeRequests.updatedModelFallback")}
                      </span>
                      <a
                        href={resolveAssetUrl(cr.submittedFileUrl)}
                        download
                        className="underline font-bold"
                      >
                        {t("admin.orderDetail.changeRequests.download")}
                      </a>
                    </div>
                  )}

                  {cr.resolutionNotes && (
                    <p className="text-emerald-700 font-medium">
                      {t("admin.orderDetail.changeRequests.resolved")} {cr.resolutionNotes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Request Modal ── */}
      <RequestItemChangesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={orderId}
        itemId={itemId}
        itemFileName={itemFileName || t("admin.orderDetail.panels.readyToPrint.modelItemFallback")}
        onSuccess={onRefresh}
      />
    </div>
  );
}
