import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Edit2,
  Eye,
  FileCode,
  Laptop,
  Loader2,
  Mail,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import {
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplates,
  previewRawEmailTemplate,
  resetDefaultEmailTemplates,
  sendTestEmailTemplate,
  updateEmailTemplate,
} from "../../services/api";
import type { EmailTemplate } from "../../types";
import { useNotify } from "../../context/NotifyContext";
import { useI18n } from "../../i18n/I18nContext";

const COMMON_PLACEHOLDERS = [
  "CustomerName",
  "ShortOrderId",
  "OrderId",
  "OrderUrl",
  "QuoteMessage",
  "PaymentReference",
  "TrackingCode",
  "TrackingUrl",
  "RenderedImageUrl",
  "LogoUrl",
  "ResetLink",
] as const;

export default function AdminEmailTemplates() {
  const { t } = useI18n();
  const { notifyError, notifySuccess } = useNotify();

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "system" | "custom">(
    "all",
  );

  // Edit / Create modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [editorTab, setEditorTab] = useState<"code" | "preview" | "split">(
    "split",
  );
  const [livePreviewHtml, setLivePreviewHtml] = useState("");
  const [livePreviewLoading, setLivePreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Standalone Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [modalPreviewLoading, setModalPreviewLoading] = useState(false);

  // Send Test Email Modal state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testTemplate, setTestTemplate] = useState<EmailTemplate | null>(null);
  const [testRecipient, setTestRecipient] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  // Delete & Reset Confirm Modals
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] =
    useState<EmailTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(
    null,
  );
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const lastFocusedInputRef = useRef<"subject" | "body">("body");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch {
      notifyError(t("admin.emailTemplates.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTemplates();
  }, []);

  // Filtered list
  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (filterType === "system" && !t.isSystemTemplate) return false;
      if (filterType === "custom" && t.isSystemTemplate) return false;

      if (!q) return true;
      return (
        t.templateName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q)
      );
    });
  }, [templates, search, filterType]);

  const counts = useMemo(() => {
    const system = templates.filter((t) => t.isSystemTemplate).length;
    const custom = templates.length - system;
    return { all: templates.length, system, custom };
  }, [templates]);

  // Live preview inside editor modal with debounce
  useEffect(() => {
    if (!isEditorOpen || (editorTab !== "preview" && editorTab !== "split")) {
      return;
    }

    setLivePreviewLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await previewRawEmailTemplate({
          subject: formSubject,
          body: formBody,
        });
        setLivePreviewHtml(res.htmlBody || "");
      } catch {
        setLivePreviewHtml(formBody);
      } finally {
        setLivePreviewLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [formSubject, formBody, isEditorOpen, editorTab]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormName("");
    setFormSubject("");
    setFormBody(
      '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n</head>\n<body style="font-family: sans-serif; background-color: #f8fafc; padding: 24px;">\n  <table width="100%" cellpadding="0" cellspacing="0">\n    <tr>\n      <td align="center">\n        <table width="600" style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">\n          <tr>\n            <td>\n              <h1 style="color: #133827; margin: 0 0 16px;">Hello {{CustomerName}},</h1>\n              <p style="color: #475569; font-size: 15px; line-height: 24px;">Your order #<strong>{{ShortOrderId}}</strong> update...</p>\n            </td>\n          </tr>\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>',
    );
    setEditorTab("split");
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormName(template.templateName);
    setFormSubject(template.subject);
    setFormBody(template.body);
    setEditorTab("split");
    setIsEditorOpen(true);
  };

  const handleInsertPlaceholder = (key: string) => {
    const placeholder = `{{${key}}}`;

    if (lastFocusedInputRef.current === "subject" && subjectInputRef.current) {
      const el = subjectInputRef.current;
      const start = el.selectionStart ?? formSubject.length;
      const end = el.selectionEnd ?? formSubject.length;
      const next =
        formSubject.substring(0, start) +
        placeholder +
        formSubject.substring(end);
      setFormSubject(next);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(
          start + placeholder.length,
          start + placeholder.length,
        );
      }, 50);
    } else if (bodyTextareaRef.current) {
      const el = bodyTextareaRef.current;
      const start = el.selectionStart ?? formBody.length;
      const end = el.selectionEnd ?? formBody.length;
      const next =
        formBody.substring(0, start) + placeholder + formBody.substring(end);
      setFormBody(next);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(
          start + placeholder.length,
          start + placeholder.length,
        );
      }, 50);
    }

    void navigator.clipboard?.writeText(placeholder);
    setCopiedPlaceholder(key);
    setTimeout(() => setCopiedPlaceholder(null), 1500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSubject.trim() || !formBody.trim()) {
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        await updateEmailTemplate(editingTemplate.id, {
          templateName: formName.trim(),
          subject: formSubject.trim(),
          body: formBody.trim(),
        });
        notifySuccess(t("admin.emailTemplates.updated"));
      } else {
        await createEmailTemplate({
          templateName: formName.trim(),
          subject: formSubject.trim(),
          body: formBody.trim(),
        });
        notifySuccess(t("admin.emailTemplates.created"));
      }
      setIsEditorOpen(false);
      await fetchTemplates();
    } catch {
      notifyError(
        editingTemplate
          ? t("admin.emailTemplates.updateFailed")
          : t("admin.emailTemplates.createFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPreview = async (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setPreviewViewport("desktop");
    setPreviewModalOpen(true);
    setModalPreviewLoading(true);

    try {
      const res = await previewRawEmailTemplate({
        subject: template.subject,
        body: template.body,
      });
      setPreviewSubject(res.subject || template.subject);
      setPreviewHtml(res.htmlBody || template.body);
    } catch {
      setPreviewSubject(template.subject);
      setPreviewHtml(template.body);
    } finally {
      setModalPreviewLoading(false);
    }
  };

  const handleOpenTest = (template: EmailTemplate) => {
    setTestTemplate(template);
    const storedUser = localStorage.getItem("user");
    let initialEmail = "";
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.email) initialEmail = parsed.email;
      } catch {
        // ignore
      }
    }
    setTestRecipient(initialEmail);
    setTestModalOpen(true);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTemplate || !testRecipient.trim()) return;

    setSendingTest(true);
    try {
      await sendTestEmailTemplate(testTemplate.id, testRecipient.trim());
      notifySuccess(
        t("admin.emailTemplates.testSuccess", { email: testRecipient.trim() }),
      );
      setTestModalOpen(false);
    } catch {
      notifyError(t("admin.emailTemplates.testFailed"));
    } finally {
      setSendingTest(false);
    }
  };

  const handleOpenDelete = (template: EmailTemplate) => {
    setDeletingTemplate(template);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    setDeleting(true);
    try {
      await deleteEmailTemplate(deletingTemplate.id);
      notifySuccess(t("admin.emailTemplates.deleted"));
      setDeleteConfirmOpen(false);
      await fetchTemplates();
    } catch {
      notifyError(t("admin.emailTemplates.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  const handleResetDefaults = async () => {
    setResetting(true);
    try {
      await resetDefaultEmailTemplates();
      notifySuccess(t("admin.emailTemplates.resetSuccess"));
      setResetConfirmOpen(false);
      await fetchTemplates();
    } catch {
      notifyError(t("admin.emailTemplates.resetFailed"));
    } finally {
      setResetting(false);
    }
  };

  return (
    <AdminLayout wide>
      <AdminBreadcrumb
        title={t("admin.emailTemplates.title")}
        items={[
          { label: t("admin.common.home"), to: "/admin" },
          { label: t("admin.emailTemplates.title") },
        ]}
        rightSlot={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
            >
              <RotateCcw size={15} />
              <span>{t("admin.emailTemplates.resetDefaults")}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-teal-800 active:scale-95"
            >
              <Plus size={16} />
              <span>{t("admin.emailTemplates.addTemplate")}</span>
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Subtitle & Search / Filter Bar */}
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">
                {t("admin.emailTemplates.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  filterType === "all"
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t("admin.emailTemplates.allFilter", { count: counts.all })}
              </button>
              <button
                type="button"
                onClick={() => setFilterType("system")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  filterType === "system"
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t("admin.emailTemplates.systemFilter", {
                  count: counts.system,
                })}
              </button>
              <button
                type="button"
                onClick={() => setFilterType("custom")}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  filterType === "custom"
                    ? "bg-blue-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t("admin.emailTemplates.customFilter", {
                  count: counts.custom,
                })}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.emailTemplates.searchPlaceholder")}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-10 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 transition"
            />
          </div>
        </div>

        {/* Templates Cards Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center gap-3 text-teal-700">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm font-semibold">
                {t("common.loading")}
              </span>
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 mb-4">
              <Mail size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {t("admin.emailTemplates.emptyTitle")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              {t("admin.emailTemplates.emptyDesc")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <Mail size={18} />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm tracking-tight truncate max-w-[190px]">
                        {item.templateName}
                      </h3>
                    </div>
                    {item.isSystemTemplate ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-800">
                        {t("admin.emailTemplates.systemBadge")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-blue-800">
                        {t("admin.emailTemplates.customBadge")}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      {t("admin.emailTemplates.subjectLabel")}
                    </span>
                    <p className="text-xs text-gray-700 line-clamp-2 bg-gray-50 rounded-lg p-2 border border-gray-100 font-medium">
                      {item.subject}
                    </p>
                  </div>

                  {item.detectedPlaceholders &&
                    item.detectedPlaceholders.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                          {t("admin.emailTemplates.availablePlaceholders")}
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                          {item.detectedPlaceholders.map((ph) => (
                            <span
                              key={ph}
                              className="inline-block rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-600 border border-gray-200"
                            >
                              {`{{${ph}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(item)}
                      title={t("admin.emailTemplates.previewButton")}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                    >
                      <Eye size={14} />
                      <span>{t("admin.emailTemplates.previewButton")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenTest(item)}
                      title={t("admin.emailTemplates.sendTestButton")}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition"
                    >
                      <Send size={14} />
                      <span>{t("admin.emailTemplates.sendTestButton")}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title={t("admin.emailTemplates.editButton")}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                    >
                      <Edit2 size={15} />
                    </button>

                    {!item.isSystemTemplate && (
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(item)}
                        title={t("admin.emailTemplates.deleteButton")}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal (Full-featured with Split-view & Live Preview) */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50/70">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                  <FileCode size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {editingTemplate
                      ? t("admin.emailTemplates.modalEditTitle", {
                          name: editingTemplate.templateName,
                        })
                      : t("admin.emailTemplates.modalCreateTitle")}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingTemplate?.isSystemTemplate
                      ? t("admin.emailTemplates.systemBadge")
                      : t("admin.emailTemplates.customBadge")}
                  </p>
                </div>
              </div>

              {/* View Toggle Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setEditorTab("code")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      editorTab === "code"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t("admin.emailTemplates.tabEditor")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("split")}
                    className={`hidden lg:block px-3 py-1.5 rounded-lg transition ${
                      editorTab === "split"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t("admin.emailTemplates.tabSplit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("preview")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      editorTab === "preview"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {t("admin.emailTemplates.tabPreview")}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSave}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 space-y-4 border-b bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Template Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      {t("admin.emailTemplates.nameLabel")}
                    </label>
                    <input
                      type="text"
                      value={formName}
                      disabled={editingTemplate?.isSystemTemplate}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t("admin.emailTemplates.namePlaceholder")}
                      required
                      className={`w-full rounded-xl border px-3.5 py-2 text-sm font-mono focus:outline-none ${
                        editingTemplate?.isSystemTemplate
                          ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                          : "border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      }`}
                    />
                    <p className="mt-1 text-[11px] text-gray-400">
                      {t("admin.emailTemplates.nameHelp")}
                    </p>
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      {t("admin.emailTemplates.subjectLabel")}
                    </label>
                    <input
                      ref={subjectInputRef}
                      type="text"
                      value={formSubject}
                      onFocus={() => {
                        lastFocusedInputRef.current = "subject";
                      }}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder={t("admin.emailTemplates.subjectPlaceholder")}
                      required
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                </div>

                {/* Insertable Placeholders Pill Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {t("admin.emailTemplates.availablePlaceholders")}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {t("admin.emailTemplates.insertPlaceholderTip")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_PLACEHOLDERS.map((ph) => {
                      const isCopied = copiedPlaceholder === ph;
                      return (
                        <button
                          key={ph}
                          type="button"
                          onClick={() => handleInsertPlaceholder(ph)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-mono transition border ${
                            isCopied
                              ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800"
                          }`}
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={11} />}
                          <span>{`{{${ph}}}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Code vs Live Preview Container */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 min-h-[380px]">
                {/* Code Editor Column */}
                {(editorTab === "code" || editorTab === "split") && (
                  <div
                    className={`flex flex-col h-full bg-[#1e293b] text-slate-100 ${
                      editorTab === "code" ? "lg:col-span-2" : ""
                    }`}
                  >
                    <div className="px-4 py-2 bg-slate-900 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono">
                        {t("admin.emailTemplates.codeEditorHeader")}
                      </span>
                      <span className="text-[11px]">
                        {t("admin.emailTemplates.codeEditorHint")}
                      </span>
                    </div>
                    <textarea
                      ref={bodyTextareaRef}
                      value={formBody}
                      onFocus={() => {
                        lastFocusedInputRef.current = "body";
                      }}
                      onChange={(e) => setFormBody(e.target.value)}
                      placeholder={t("admin.emailTemplates.bodyPlaceholder")}
                      spellCheck={false}
                      required
                      className="flex-1 w-full bg-[#1e293b] p-4 text-xs font-mono leading-relaxed text-slate-100 placeholder-slate-500 focus:outline-none resize-none selection:bg-teal-600/50"
                    />
                  </div>
                )}

                {/* Live Preview Column */}
                {(editorTab === "preview" || editorTab === "split") && (
                  <div
                    className={`flex flex-col h-full bg-gray-100 ${
                      editorTab === "preview" ? "lg:col-span-2" : ""
                    }`}
                  >
                    <div className="px-4 py-2 bg-gray-200 border-b border-gray-300 flex items-center justify-between text-xs text-gray-700">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold">
                          {t("admin.emailTemplates.previewSubjectPrefix")}
                        </span>
                        <span className="truncate max-w-sm text-gray-900 font-semibold">
                          {formSubject}
                        </span>
                      </div>
                      {livePreviewLoading && (
                        <div className="flex items-center gap-1.5 text-teal-700 text-[11px]">
                          <Loader2 size={12} className="animate-spin" />
                          <span>
                            {t("admin.emailTemplates.loadingPreview")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
                      <iframe
                        title={t("admin.emailTemplates.livePreviewTitle")}
                        srcDoc={livePreviewHtml}
                        sandbox="allow-same-origin"
                        className="w-full h-full max-w-[620px] bg-white rounded-xl shadow border border-gray-300"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-teal-800 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>{t("admin.emailTemplates.saving")}</span>
                    </>
                  ) : (
                    <span>{t("common.save")}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standalone Full Live Preview Modal */}
      {previewModalOpen && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-[88vh] overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {t("admin.emailTemplates.modalPreviewTitle")}:{" "}
                    {previewTemplate.templateName}
                  </h3>
                  <p className="text-xs text-gray-500">{previewSubject}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-200 p-0.5 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("desktop")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                      previewViewport === "desktop"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Laptop size={14} />
                    <span>{t("admin.emailTemplates.viewDesktop")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("mobile")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                      previewViewport === "mobile"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>{t("admin.emailTemplates.viewMobile")}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-200/60 p-4 md:p-6 overflow-auto flex items-center justify-center">
              {modalPreviewLoading ? (
                <div className="flex items-center gap-2 text-teal-700 text-sm font-semibold">
                  <Loader2 size={20} className="animate-spin" />
                  <span>{t("admin.emailTemplates.loadingPreview")}</span>
                </div>
              ) : (
                <iframe
                  title={t("admin.emailTemplates.renderedEmailAria")}
                  srcDoc={previewHtml}
                  sandbox="allow-same-origin"
                  className={`bg-white rounded-2xl shadow-xl border border-gray-300 transition-all duration-300 h-full ${
                    previewViewport === "desktop"
                      ? "w-full max-w-[640px]"
                      : "w-[360px]"
                  }`}
                />
              )}
            </div>

            <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <span>
                {t("admin.emailTemplates.previewToPrefix")}{" "}
                {t("admin.emailTemplates.previewToMock")}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                {t("common.closeDialog")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Email Modal */}
      {testModalOpen && testTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                  <Send size={18} />
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {t("admin.emailTemplates.modalTestTitle", {
                    name: testTemplate.templateName,
                  })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendTest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  {t("admin.emailTemplates.testRecipientLabel")}
                </label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder={t(
                    "admin.emailTemplates.testRecipientPlaceholder",
                  )}
                  required
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-teal-800 disabled:opacity-60"
                >
                  {sendingTest ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{t("admin.emailTemplates.testSending")}</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>{t("admin.emailTemplates.testSend")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && deletingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <Trash2 size={20} />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {t("admin.emailTemplates.deleteButton")}
              </h3>
            </div>

            <p className="text-sm text-gray-600">
              {t("admin.emailTemplates.deleteConfirm", {
                name: deletingTemplate.templateName,
              })}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>{t("admin.emailTemplates.deleteButton")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Defaults Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <RotateCcw size={20} />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {t("admin.emailTemplates.resetDefaults")}
              </h3>
            </div>

            <p className="text-sm text-gray-600">
              {t("admin.emailTemplates.resetConfirm")}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={resetting}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-amber-700 disabled:opacity-60"
              >
                {resetting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCcw size={14} />
                )}
                <span>{t("admin.emailTemplates.resetDefaults")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
