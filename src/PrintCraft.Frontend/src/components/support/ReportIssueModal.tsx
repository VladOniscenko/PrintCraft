import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import { X, Upload, CheckCircle2, AlertCircle, FileText, Trash2, HelpCircle } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import { useNotify } from "../../context/NotifyContext";
import { createSupportTicket, uploadSupportAttachment } from "../../services/api";
import type { SupportTicketCategory } from "../../types";

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string | null;
  defaultCategory?: SupportTicketCategory;
}

export default function ReportIssueModal({
  isOpen,
  onClose,
  orderId = null,
  defaultCategory = "General",
}: ReportIssueModalProps) {
  const { t } = useI18n();
  const { notifySuccess, notifyError } = useNotify();

  const [category, setCategory] = useState<SupportTicketCategory>(() =>
    orderId ? "OrderIssue" : defaultCategory,
  );
  const [email, setEmail] = useState("");
  const [customOrderId, setCustomOrderId] = useState(orderId || "");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or orderId changes
  useEffect(() => {
    if (isOpen) {
      if (orderId) {
        setCustomOrderId(orderId);
        setCategory("OrderIssue");
      } else {
        setCustomOrderId("");
        setCategory(defaultCategory);
      }
      setSubject("");
      setDescription("");
      setAttachments([]);
      setFormError(null);

      // Pre-fill user email if authenticated
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const user = JSON.parse(stored);
          if (user?.email) {
            setEmail(user.email);
          }
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }, [isOpen, orderId, defaultCategory]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxBytes = 50 * 1024 * 1024; // 50MB
    if (file.size > maxBytes) {
      notifyError(t("common.support.fileTooLarge"));
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadSupportAttachment(file);
      if (res?.url) {
        setAttachments((prev) => [...prev, res.url]);
        notifySuccess(t("common.support.uploadSuccess"));
      }
    } catch {
      notifyError(t("common.support.uploadFailed"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      const msg = t("common.support.emailRequired");
      setFormError(msg);
      notifyError(msg);
      return;
    }

    const cleanSubject = subject.trim();
    if (!cleanSubject) {
      const msg = t("common.support.subjectRequired");
      setFormError(msg);
      notifyError(msg);
      return;
    }

    const cleanDescription = description.trim();
    if (!cleanDescription) {
      const msg = t("common.support.descriptionRequired");
      setFormError(msg);
      notifyError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      await createSupportTicket({
        category,
        userEmail: cleanEmail,
        orderId: customOrderId.trim() ? customOrderId.trim() : null,
        subject: cleanSubject,
        description: cleanDescription,
        attachmentUrls: attachments,
      });

      notifySuccess(t("common.support.submitSuccess"));
      onClose();
    } catch {
      const msg = t("common.support.submitError");
      setFormError(msg);
      notifyError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-issue-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !isUploading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0e1512] rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-8 my-8 text-gray-900 dark:text-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3
                id="report-issue-modal-title"
                className="text-lg font-bold text-gray-900 dark:text-white"
              >
                {t("common.support.modalTitle")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("common.support.modalSubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isUploading}
            aria-label={t("common.closeDialog")}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Category & Order ID Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ticket-category"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("common.support.category")} *
              </label>
              <select
                id="ticket-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16211c] px-3.5 py-2.5 text-xs font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-500 cursor-pointer"
              >
                <option value="OrderIssue">{t("common.support.categoryOrderIssue")}</option>
                <option value="Bug">{t("common.support.categoryBug")}</option>
                <option value="Payment">{t("common.support.categoryPayment")}</option>
                <option value="General">{t("common.support.categoryGeneral")}</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="ticket-order-id"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >
                {t("common.support.orderId")}
              </label>
              <input
                id="ticket-order-id"
                type="text"
                value={customOrderId}
                onChange={(e) => setCustomOrderId(e.target.value)}
                placeholder={t("common.support.orderIdPlaceholder")}
                className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16211c] px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="ticket-email"
              className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("common.support.email")} *
            </label>
            <input
              id="ticket-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("common.support.emailPlaceholder")}
              required
              className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16211c] px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-500"
            />
          </div>

          {/* Subject */}
          <div>
            <label
              htmlFor="ticket-subject"
              className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("common.support.subject")} *
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("common.support.subjectPlaceholder")}
              required
              className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16211c] px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-500"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="ticket-description"
              className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("common.support.description")} *
            </label>
            <textarea
              id="ticket-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("common.support.descriptionPlaceholder")}
              required
              className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16211c] px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600 dark:focus:ring-teal-500 resize-y"
            />
          </div>

          {/* Attachments Section */}
          <div>
            <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t("common.support.attachments")}
            </span>

            {attachments.length > 0 && (
              <ul className="mb-2 space-y-1.5">
                {attachments.map((url, idx) => (
                  <li
                    key={`${url}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-teal-700 dark:text-teal-400 shrink-0" />
                      <span className="truncate font-mono text-[11px] text-gray-700 dark:text-gray-300">
                        {url.split("/").pop()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      aria-label={t("common.support.removeAttachment")}
                      className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="ticket-file-input"
            />

            <button
              type="button"
              disabled={isUploading || isSubmitting}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-dashed border-gray-300 dark:border-white/20 hover:border-teal-600 dark:hover:border-teal-400 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-teal-700 dark:hover:text-teal-400 bg-gray-50/50 dark:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload size={14} />
              <span>
                {isUploading
                  ? t("common.support.uploading")
                  : t("common.support.uploadAttachment")}
              </span>
            </button>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isUploading}
              className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t("common.support.submitting")}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>{t("common.support.submit")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
