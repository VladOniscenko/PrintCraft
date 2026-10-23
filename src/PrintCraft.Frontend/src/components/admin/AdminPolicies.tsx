import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import {
  createPolicy,
  deletePolicy,
  getPolicies,
  seedPolicies,
  updatePolicy,
} from "../../services/api";
import type { PolicySection, PolicyTemplate } from "../../types";
import { useNotify } from "../../context/NotifyContext";
import { useI18n } from "../../i18n/I18nContext";
import {
  supportedLanguages,
  type SupportedLanguage,
  defaultLanguage,
} from "../../i18n/translations";
import { getLocalizedText } from "../../utils/i18nHelpers";

const SYSTEM_POLICY_SLUGS = new Set(["privacy", "terms", "refunds", "shipping"]);

export default function AdminPolicies() {
  const { t, language, localizePath } = useI18n();
  const { notifyError, notifySuccess } = useNotify();

  const [policies, setPolicies] = useState<PolicyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State (Create or Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyTemplate | null>(null);
  const [slugInput, setSlugInput] = useState("");
  const [activeLangTab, setActiveLangTab] = useState<SupportedLanguage>(defaultLanguage);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const [titleDict, setTitleDict] = useState<Record<string, string>>({});
  const [lastUpdatedDict, setLastUpdatedDict] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [contactTitleDict, setContactTitleDict] = useState<Record<string, string>>({});
  const [contactBodyDict, setContactBodyDict] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<PolicyTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reset Modal State (single policy or all policies)
  const [resetTarget, setResetTarget] = useState<PolicyTemplate | null>(null);
  const [resetAllConfirmOpen, setResetAllConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadPoliciesList = async () => {
    setLoading(true);
    try {
      const data = await getPolicies(true, true);
      setPolicies(data);
    } catch {
      notifyError(t("admin.policies.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPoliciesList();
  }, []);

  const filteredPolicies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return policies;

    return policies.filter((p) => {
      const title = getLocalizedText(p.title, language).toLowerCase();
      const slug = (p.slug || "").toLowerCase();
      return title.includes(q) || slug.includes(q);
    });
  }, [policies, search, language]);

  const openCreateModal = () => {
    setEditingPolicy(null);
    setSlugInput("");
    setTitleDict({});
    setLastUpdatedDict({});
    setSections([]);
    setContactTitleDict({});
    setContactBodyDict({});
    setIsActive(true);
    setActiveLangTab(defaultLanguage);
    setActiveTab("editor");
    setIsModalOpen(true);
  };

  const openEditModal = (policy: PolicyTemplate) => {
    setEditingPolicy(policy);
    setSlugInput(policy.slug);
    setTitleDict(policy.title ? { ...policy.title } : {});
    setLastUpdatedDict(policy.lastUpdated ? { ...policy.lastUpdated } : {});
    setSections(
      Array.isArray(policy.sections)
        ? policy.sections.map((s) => ({
            id: s.id || Math.random().toString(36).substring(2, 9),
            title: s.title ? { ...s.title } : {},
            body: s.body ? { ...s.body } : {},
            sortOrder: s.sortOrder ?? 0,
          }))
        : [],
    );
    setContactTitleDict(policy.contactTitle ? { ...policy.contactTitle } : {});
    setContactBodyDict(policy.contactBody ? { ...policy.contactBody } : {});
    setIsActive(policy.isActive);
    setActiveLangTab(defaultLanguage);
    setActiveTab("editor");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const trimmedSlug = slugInput.trim().toLowerCase();
    const isCreating = !editingPolicy;
    const isSystem = editingPolicy ? SYSTEM_POLICY_SLUGS.has(editingPolicy.slug) : false;

    if (isCreating || !isSystem) {
      if (!trimmedSlug) {
        notifyError(t("admin.policies.slugRequired"));
        return;
      }
      if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
        notifyError(t("admin.policies.slugInvalid"));
        return;
      }
    }

    if (!titleDict[activeLangTab]?.trim()) {
      notifyError(t("admin.policies.titleRequired"));
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<PolicyTemplate> = {
        title: titleDict,
        lastUpdated: lastUpdatedDict,
        sections,
        contactTitle: contactTitleDict,
        contactBody: contactBodyDict,
        isActive,
      };

      if (isCreating) {
        payload.slug = trimmedSlug;
        await createPolicy(payload);
        notifySuccess(t("admin.policies.createSuccess"));
      } else {
        if (!isSystem) {
          payload.slug = trimmedSlug;
        }
        await updatePolicy(editingPolicy.id, payload);
        notifySuccess(t("admin.policies.saveSuccess"));
      }

      setIsModalOpen(false);
      await loadPoliciesList();
    } catch {
      notifyError(
        isCreating
          ? t("admin.policies.createFailed")
          : t("admin.policies.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await deletePolicy(deleteTarget.id);
      notifySuccess(t("admin.policies.deleteSuccess"));
      setDeleteTarget(null);
      await loadPoliciesList();
    } catch {
      notifyError(t("admin.policies.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyLink = async (slug: string) => {
    try {
      const path = getPublicPath(slug);
      const fullUrl = `${window.location.origin}${localizePath(path)}`;
      await navigator.clipboard.writeText(fullUrl);
      notifySuccess(t("admin.policies.linkCopied"));
    } catch {
      // Fallback
    }
  };

  const handleToggleActive = async (policy: PolicyTemplate) => {
    try {
      await updatePolicy(policy.id, { isActive: !policy.isActive });
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, isActive: !p.isActive } : p)),
      );
      notifySuccess(t("admin.policies.saveSuccess"));
    } catch {
      notifyError(t("admin.policies.saveFailed"));
    }
  };

  const handleResetSingle = async () => {
    if (!resetTarget) return;

    setResetting(true);
    try {
      await seedPolicies(true);
      notifySuccess(t("admin.policies.resetSuccess"));
      setResetTarget(null);
      await loadPoliciesList();
    } catch {
      notifyError(t("admin.policies.resetFailed"));
    } finally {
      setResetting(false);
    }
  };

  const handleResetAll = async () => {
    setResetting(true);
    try {
      await seedPolicies(true);
      notifySuccess(t("admin.policies.seedSuccess"));
      setResetAllConfirmOpen(false);
      await loadPoliciesList();
    } catch {
      notifyError(t("admin.policies.seedFailed"));
    } finally {
      setResetting(false);
    }
  };

  const handleSetToday = () => {
    const formatted = new Date().toLocaleDateString(activeLangTab, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setLastUpdatedDict((prev) => ({ ...prev, [activeLangTab]: formatted }));
  };

  // Section manipulation helpers
  const handleAddSection = () => {
    const newSection: PolicySection = {
      id: Math.random().toString(36).substring(2, 9),
      title: {},
      body: {},
      sortOrder: sections.length + 1,
    };
    setSections([...sections, newSection]);
  };

  const handleDeleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const copy = [...sections];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setSections(copy);
  };

  const handleUpdateSectionTitle = (index: number, text: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, title: { ...s.title, [activeLangTab]: text } } : s,
      ),
    );
  };

  const handleUpdateSectionBody = (index: number, text: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, body: { ...s.body, [activeLangTab]: text } } : s,
      ),
    );
  };

  const getPublicPath = (slug: string) => {
    if (slug === "shipping") return "/shipping-policy";
    if (SYSTEM_POLICY_SLUGS.has(slug)) return `/${slug}`;
    return `/policies/${slug}`;
  };

  return (
    <AdminLayout>
      <AdminBreadcrumb
        title={t("admin.policies.title")}
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: t("admin.policies.title") },
        ]}
        rightSlot={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className="site-btn-primary inline-flex items-center gap-1.5 text-xs font-bold"
            >
              <Plus size={14} />
              <span>{t("admin.policies.addPolicy")}</span>
            </button>
            <button
              type="button"
              onClick={() => setResetAllConfirmOpen(true)}
              className="site-btn-soft inline-flex items-center gap-1.5 text-xs text-rose-800 border-rose-200 hover:bg-rose-50"
              title={t("admin.policies.seedDefaults")}
            >
              <RotateCcw size={14} />
              <span>{t("admin.policies.seedDefaults")}</span>
            </button>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Search header panel */}
        <div className="admin-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.policies.searchPlaceholder")}
              className="site-input pl-9 pr-4 py-2 w-full text-sm rounded-xl"
            />
          </div>
          <div className="text-xs text-[#526a63]">
            {filteredPolicies.length} / {policies.length} {t("admin.policies.title")}
          </div>
        </div>

        {/* Policies Table */}
        <div className="admin-panel overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
              <span className="text-xs">{t("admin.loadingDashboard")}</span>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <span>{t("admin.policies.emptyTitle")}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f0f6f3] dark:bg-white/5 text-xs uppercase tracking-wider text-[#355249] dark:text-gray-200 border-b border-[#dde9e3] dark:border-white/10">
                  <tr>
                    <th className="py-3 px-4">{t("admin.policies.colSlug")}</th>
                    <th className="py-3 px-4">{t("admin.policies.colTitle")}</th>
                    <th className="py-3 px-4 text-center">{t("admin.policies.colSections")}</th>
                    <th className="py-3 px-4">{t("admin.policies.colLastUpdated")}</th>
                    <th className="py-3 px-4 text-center">{t("admin.policies.colStatus")}</th>
                    <th className="py-3 px-4 text-right">{t("admin.policies.colActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {filteredPolicies.map((policy) => {
                    const resolvedTitle = getLocalizedText(policy.title, language, policy.slug);
                    const resolvedUpdated = getLocalizedText(policy.lastUpdated, language);
                    const isSystem = SYSTEM_POLICY_SLUGS.has(policy.slug);

                    return (
                      <tr key={policy.id} className="hover:bg-teal-50/40 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40">
                              {policy.slug}
                            </span>
                            {isSystem ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                                {t("admin.policies.coreBadge")}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                                {t("admin.policies.customBadge")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                          {resolvedTitle}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs text-gray-600 dark:text-gray-400">
                          {policy.sections?.length || 0}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">
                          {resolvedUpdated || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(policy)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                              policy.isActive
                                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200"
                                : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                            }`}
                          >
                            {policy.isActive
                              ? t("admin.policies.active")
                              : t("admin.policies.inactive")}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={localizePath(getPublicPath(policy.slug))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                              title={t("admin.policies.viewLive")}
                            >
                              <ExternalLink size={15} />
                            </a>
                            <button
                              type="button"
                              onClick={() => void handleCopyLink(policy.slug)}
                              className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title={t("admin.policies.copyLink")}
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(policy)}
                              className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                              title={t("admin.policies.edit")}
                            >
                              <Edit2 size={15} />
                            </button>
                            {isSystem ? (
                              <button
                                type="button"
                                onClick={() => setResetTarget(policy)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title={t("admin.policies.resetToDefault")}
                              >
                                <RotateCcw size={15} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(policy)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title={t("admin.policies.deletePolicy")}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE OR EDIT POLICY TEMPLATE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingPolicy
                    ? t("admin.policies.modalTitleEdit", { slug: editingPolicy.slug })
                    : t("admin.policies.modalTitleNew")}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("admin.policies.subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Tab Switcher: Editor vs Storefront Preview */}
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <div className="bg-[#edf5f1] p-1 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("editor")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "editor"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-[#4e6b62] hover:text-teal-900"
                  }`}
                >
                  <FileText size={14} className="inline mr-1.5" />
                  <span>{t("admin.policies.tabEditor")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "preview"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-[#4e6b62] hover:text-teal-900"
                  }`}
                >
                  <Eye size={14} className="inline mr-1.5" />
                  <span>{t("admin.policies.tabPreview")}</span>
                </button>
              </div>

              {/* Language Switcher Tabs */}
              <div className="bg-[#f0f7f4] p-1 rounded-xl flex items-center gap-1">
                <span className="text-xs font-semibold text-[#345148] px-2">
                  {t("admin.policies.editingLanguage")}
                </span>
                {supportedLanguages.map((lang) => {
                  const hasTitle = Boolean(titleDict[lang]?.trim());
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveLangTab(lang)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        activeLangTab === lang
                          ? "bg-white text-teal-800 shadow-xs"
                          : "text-[#4e6b62] hover:text-teal-900"
                      }`}
                    >
                      {lang.toUpperCase()}
                      {hasTitle && (
                        <Check size={12} className="inline ml-1 text-emerald-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB 1: EDITOR */}
            {activeTab === "editor" && (
              <div className="space-y-5 overflow-y-auto flex-1 pr-1">
                {/* Slug Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t("admin.policies.slugLabel")}
                  </label>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value.toLowerCase())}
                    disabled={editingPolicy !== null && SYSTEM_POLICY_SLUGS.has(editingPolicy.slug)}
                    placeholder={t("admin.policies.slugPlaceholder")}
                    className="site-input w-full px-3 py-2 text-sm rounded-xl font-mono disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>

                {/* Meta Fields: Title & Last Updated */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t("admin.policies.fieldTitle")} ({activeLangTab.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={titleDict[activeLangTab] || ""}
                      onChange={(e) =>
                        setTitleDict({ ...titleDict, [activeLangTab]: e.target.value })
                      }
                      className="site-input w-full px-3 py-2 text-sm rounded-xl"
                      placeholder={t("admin.policies.fieldTitle")}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-700">
                        {t("admin.policies.fieldLastUpdated")} ({activeLangTab.toUpperCase()})
                      </label>
                      <button
                        type="button"
                        onClick={handleSetToday}
                        className="text-[11px] font-semibold text-teal-700 hover:underline"
                      >
                        {t("admin.policies.btnToday")}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={lastUpdatedDict[activeLangTab] || ""}
                      onChange={(e) =>
                        setLastUpdatedDict({
                          ...lastUpdatedDict,
                          [activeLangTab]: e.target.value,
                        })
                      }
                      className="site-input w-full px-3 py-2 text-sm rounded-xl"
                      placeholder={t("admin.policies.fieldLastUpdated")}
                    />
                  </div>
                </div>

                {/* Sections Builder */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-[#fbfdfc] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      {t("admin.policies.sectionsHeading")} ({sections.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="site-btn-soft px-2.5 py-1 text-xs inline-flex items-center gap-1 font-bold text-teal-800"
                    >
                      <Plus size={13} />
                      <span>{t("admin.policies.addSection")}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {sections.map((sec, idx) => (
                      <div
                        key={sec.id || idx}
                        className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-teal-800">
                            {t("admin.policies.sectionNumber", { num: idx + 1 })}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveSection(idx, "up")}
                              className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-gray-100"
                              title={t("admin.policies.moveUp")}
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === sections.length - 1}
                              onClick={() => handleMoveSection(idx, "down")}
                              className="p-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-gray-100"
                              title={t("admin.policies.moveDown")}
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(idx)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                              title={t("admin.policies.deleteSection")}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={sec.title?.[activeLangTab] || ""}
                            onChange={(e) => handleUpdateSectionTitle(idx, e.target.value)}
                            placeholder={`${t("admin.policies.sectionTitleLabel")} (${activeLangTab.toUpperCase()})`}
                            className="site-input w-full px-3 py-1.5 text-sm font-semibold rounded-lg"
                          />
                        </div>

                        <div>
                          <textarea
                            rows={3}
                            value={sec.body?.[activeLangTab] || ""}
                            onChange={(e) => handleUpdateSectionBody(idx, e.target.value)}
                            placeholder={`${t("admin.policies.sectionBodyLabel")} (${activeLangTab.toUpperCase()})`}
                            className="site-input w-full px-3 py-2 text-xs rounded-lg font-mono leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Callout Box */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-white space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    {t("admin.policies.contactHeading")}
                  </h3>
                  <div>
                    <input
                      type="text"
                      value={contactTitleDict[activeLangTab] || ""}
                      onChange={(e) =>
                        setContactTitleDict({
                          ...contactTitleDict,
                          [activeLangTab]: e.target.value,
                        })
                      }
                      placeholder={`${t("admin.policies.contactTitleLabel")} (${activeLangTab.toUpperCase()})`}
                      className="site-input w-full px-3 py-2 text-sm font-semibold rounded-xl"
                    />
                  </div>
                  <div>
                    <textarea
                      rows={2}
                      value={contactBodyDict[activeLangTab] || ""}
                      onChange={(e) =>
                        setContactBodyDict({
                          ...contactBodyDict,
                          [activeLangTab]: e.target.value,
                        })
                      }
                      placeholder={`${t("admin.policies.contactBodyLabel")} (${activeLangTab.toUpperCase()})`}
                      className="site-input w-full px-3 py-2 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="policyIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md focus:ring-teal-500"
                  />
                  <label htmlFor="policyIsActive" className="text-xs font-semibold text-gray-700">
                    {t("admin.policies.isActiveLabel")}
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE STOREFRONT PREVIEW */}
            {activeTab === "preview" && (
              <div className="border border-gray-200 rounded-2xl p-6 bg-[#f8f9fa] overflow-y-auto flex-1 space-y-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {titleDict[activeLangTab] || (editingPolicy ? editingPolicy.slug : slugInput)}
                    </h1>
                    <p className="text-xs text-gray-500">
                      {lastUpdatedDict[activeLangTab] || ""}
                    </p>
                  </div>

                  <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
                    {sections.map((sec, idx) => (
                      <div key={sec.id || idx}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                          {sec.title?.[activeLangTab] || `${t("admin.policies.sectionNumber", { num: idx + 1 })}`}
                        </h2>
                        <div className="space-y-2 whitespace-pre-line text-xs leading-relaxed text-gray-600">
                          {sec.body?.[activeLangTab] || ""}
                        </div>
                      </div>
                    ))}

                    {(contactTitleDict[activeLangTab] || contactBodyDict[activeLangTab]) && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          {contactTitleDict[activeLangTab] || ""}
                        </h3>
                        <p className="text-xs text-gray-600 whitespace-pre-line">
                          {contactBodyDict[activeLangTab] || ""}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t("admin.policies.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="site-btn-primary px-5 py-2 text-sm rounded-xl font-bold inline-flex items-center gap-1.5"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                <span>{saving ? t("admin.policies.saving") : t("admin.policies.save")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET SINGLE POLICY CONFIRMATION */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("admin.policies.resetConfirmTitle")}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("admin.policies.resetConfirmMessage")}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t("admin.policies.cancel")}
              </button>
              <button
                type="button"
                onClick={handleResetSingle}
                disabled={resetting}
                className="site-btn-soft px-4 py-2 text-sm rounded-xl font-bold text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100 inline-flex items-center gap-1.5"
              >
                {resetting && <Loader2 size={14} className="animate-spin" />}
                <span>{resetting ? t("admin.policies.resetting") : t("admin.policies.resetToDefault")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET ALL POLICIES CONFIRMATION */}
      {resetAllConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("admin.policies.seedConfirmTitle")}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("admin.policies.seedConfirmMessage")}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setResetAllConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t("admin.policies.cancel")}
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                disabled={resetting}
                className="site-btn-soft px-4 py-2 text-sm rounded-xl font-bold text-rose-800 bg-rose-50 border-rose-300 hover:bg-rose-100 inline-flex items-center gap-1.5"
              >
                {resetting && <Loader2 size={14} className="animate-spin" />}
                <span>{resetting ? t("admin.policies.resetting") : t("admin.policies.seedDefaults")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: DELETE CUSTOM POLICY CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("admin.policies.deleteConfirmTitle")}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t("admin.policies.deleteConfirmMessage")}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t("admin.policies.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="site-btn-soft px-4 py-2 text-sm rounded-xl font-bold text-rose-800 bg-rose-50 border-rose-300 hover:bg-rose-100 inline-flex items-center gap-1.5"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                <span>{deleting ? t("admin.policies.deleting") : t("admin.policies.deletePolicy")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
