import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Box,
  Calendar,
  Check,
  Edit2,
  Eye,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api, {
  getHeroAvailableFiles,
  getHeroSlides,
  invalidateHeroSlidesCache,
  seedDefaultHeroSlides,
  uploadHeroMedia,
} from "../../services/api";
import type { HeroMediaType, HeroSlide } from "../../types";
import { resolveAssetUrl } from "../../utils/assetUrl";
import { useNotify } from "../../context/NotifyContext";
import { useI18n } from "../../i18n/I18nContext";
import {
  languageFlagMap,
  supportedLanguages,
  type SupportedLanguage,
} from "../../i18n/translations";
import { loadLanguage } from "../../i18n/loader";
import Hero from "../Hero";
import {
  holidayConfig,
  HOLIDAY_PRIORITY,
  isDateInHoliday,
  getHolidayName,
  getHolidayDateLabel,
  getHolidayTitle,
  getHolidaySubtitle,
  getHolidayCtaText,
  type HolidayKey,
} from "../../config/holidayConfig";

const HeroModelViewer = lazy(() => import("../HeroModelViewer"));

type UploadedFileItem = {
  fileName: string;
  relativePath?: string;
  url: string;
  mediaType?: HeroMediaType;
  extension?: string;
  sizeBytes?: number;
  lastModifiedUtc?: string;
};

function formatBytes(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function detectMediaType(fileNameOrUrl?: string): HeroMediaType {
  if (!fileNameOrUrl) return "image";
  const clean = fileNameOrUrl.split("?")[0].split("#")[0].toLowerCase();
  const ext = clean.split(".").pop() || "";
  if (["stl", "obj", "3mf", "step", "stp"].includes(ext)) {
    return "model3d";
  }
  return "image";
}

// ---------------------------------------------------------------------------
// 3D Model Inspection Modal
// ---------------------------------------------------------------------------
function Model3dPreviewModal({
  isOpen,
  onClose,
  modelUrl,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  modelUrl: string | null;
  title?: string;
}) {
  const { t } = useI18n();
  if (!isOpen || !modelUrl) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0e1512] border border-gray-200 dark:border-white/10 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <Box size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {title || t("admin.heroSlides.preview3d")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-md">
                {modelUrl}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="w-full h-80 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden relative border">
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center text-white gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-sm">{t("admin.heroSlides.loading3dRenderer")}</span>
              </div>
            }
          >
            <HeroModelViewer
              src={resolveAssetUrl(modelUrl)}
              className="w-full h-full"
            />
          </Suspense>
          <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
            <span className="bg-black/50 text-white/90 text-xs px-3 py-1 rounded-full backdrop-blur-xs">
              {t("admin.heroSlides.interactiveInstructions")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-medium"
          >
            {t("admin.heroSlides.closePreview")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Uploaded Files Selector Modal
// ---------------------------------------------------------------------------
function MediaSelectorModal({
  isOpen,
  onClose,
  onSelect,
  currentUrl,
  onPreview3d,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, mediaType: HeroMediaType, fileName: string) => void;
  currentUrl?: string;
  onPreview3d: (url: string, title?: string) => void;
}) {
  const { notifyError, notifySuccess } = useNotify();
  const { t } = useI18n();
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "model3d" | "image">("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await getHeroAvailableFiles();
      setFiles(data);
    } catch (err) {
      console.error(err);
      notifyError(t("admin.heroSlides.failedLoadFiles"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  const handleModalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadHeroMedia(file);
      notifySuccess(
        t("admin.heroSlides.uploadedFileSuccess", { fileName: file.name }),
      );
      await fetchFiles();
      // Auto-select the newly uploaded file
      const inferredType = res.mediaType || detectMediaType(res.url);
      onSelect(res.url, inferredType, res.fileName || file.name);
      onClose();
    } catch (err: any) {
      console.error(err);
      notifyError(err?.response?.data?.message || t("admin.heroSlides.uploadFailed"));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  if (!isOpen) return null;

  const filteredFiles = files.filter((item) => {
    const type = item.mediaType || detectMediaType(item.url || item.fileName);
    if (typeFilter !== "all" && type !== typeFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    return (
      item.fileName.toLowerCase().includes(query) ||
      (item.url && item.url.toLowerCase().includes(query)) ||
      (item.extension && item.extension.toLowerCase().includes(query))
    );
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0e1512] border border-gray-200 dark:border-white/10 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("admin.heroSlides.selectFromUploads")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("admin.heroSlides.selectFromUploadsDesc")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar: Upload, Search, and Type Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          {/* Quick upload button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".stl,.obj,.3mf,.step,.stp,.png,.jpg,.jpeg,.webp,.gif,.svg"
              onChange={handleModalUpload}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              <span>{uploading ? t("admin.heroSlides.uploadingFile") : t("admin.heroSlides.uploadNewFile")}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter pills */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  typeFilter === "all"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t("admin.heroSlides.allFiles")}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("model3d")}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors ${
                  typeFilter === "model3d"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Box size={12} />
                <span>{t("admin.heroSlides.models3d")}</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("image")}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors ${
                  typeFilter === "image"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ImageIcon size={12} />
                <span>{t("admin.heroSlides.images")}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t("admin.heroSlides.searchFilesPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 sm:w-56 pl-8 pr-3 py-1.5 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchFiles}
              className="p-2 border rounded-xl hover:bg-gray-50 text-gray-600"
              title={t("admin.heroSlides.refreshFiles")}
            >
              <RefreshCcw size={14} />
            </button>
          </div>
        </div>

        {/* File Grid */}
        <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-2xl p-4 bg-gray-50/50">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="text-sm">{t("admin.heroSlides.loadingUploads")}</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-3">
              <FolderOpen size={40} className="text-gray-300" />
              <p className="text-sm font-medium">{t("admin.heroSlides.noMatchingFiles")}</p>
              <p className="text-xs text-gray-400">
                {t("admin.heroSlides.noMatchingFilesHelp")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredFiles.map((file) => {
                const type = file.mediaType || detectMediaType(file.url || file.fileName);
                const isSelected = currentUrl === file.url;

                return (
                  <div
                    key={file.url || file.fileName}
                    className={`rounded-2xl border bg-white p-3 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-100"
                        : "border-gray-200"
                    }`}
                  >
                    <div>
                      {/* Thumbnail / 3D Icon */}
                      <div className="w-full h-28 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center relative mb-2.5">
                        {type === "image" ? (
                          <img
                            src={resolveAssetUrl(file.url)}
                            alt={file.fileName}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100/60 flex flex-col items-center justify-center text-blue-700 gap-1.5 p-2">
                            <Box size={32} />
                            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-full border border-blue-200">
                              {file.extension || ".stl"}
                            </span>
                          </div>
                        )}

                        {/* Top badge */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              type === "model3d"
                                ? "bg-blue-600 text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {type === "model3d" ? t("admin.heroSlides.badge3d") : t("admin.heroSlides.badgeImage")}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 p-1 bg-emerald-600 text-white rounded-full">
                            <Check size={12} />
                          </div>
                        )}
                      </div>

                      {/* File Details */}
                      <div className="space-y-1">
                        <div
                          className="font-semibold text-xs text-gray-900 truncate"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>{formatBytes(file.sizeBytes)}</span>
                          <span className="font-mono text-[10px] text-gray-400 truncate max-w-[120px]">
                            {file.relativePath || file.url}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-2 border-t flex items-center justify-between gap-2">
                      {type === "model3d" ? (
                        <button
                          type="button"
                          onClick={() => onPreview3d(file.url, file.fileName)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 hover:text-blue-900"
                        >
                          <Eye size={12} />
                          <span>{t("admin.heroSlides.preview3d")}</span>
                        </button>
                      ) : (
                        <span />
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onSelect(file.url, type, file.fileName);
                          onClose();
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {isSelected ? t("admin.heroSlides.selected") : t("admin.heroSlides.selectFile")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t shrink-0">
          <div className="text-xs text-gray-500">
            {t("admin.heroSlides.totalFiles")} <span className="font-semibold">{filteredFiles.length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-xl text-xs font-medium hover:bg-gray-50"
          >
            {t("admin.heroSlides.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Component
// ---------------------------------------------------------------------------
export default function AdminHeroSlides() {
  const { notifyError, notifySuccess } = useNotify();
  const { t, language } = useI18n();
  const [activeMainTab, setActiveMainTab] = useState<"slides" | "holidays">("slides");
  const [previewHolidayKey, setPreviewHolidayKey] = useState<HolidayKey | null>(null);
  const [previewHolidayLang, setPreviewHolidayLang] = useState<SupportedLanguage>(language);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isReseeding, setIsReseeding] = useState(false);

  // File selector & upload state
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<"create" | "edit" | null>(null);
  const [uploadingFor, setUploadingFor] = useState<"create" | "edit" | null>(null);
  const [preview3dModelUrl, setPreview3dModelUrl] = useState<string | null>(null);
  const [preview3dTitle, setPreview3dTitle] = useState<string>("");

  const createFileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state for new slide
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLang, setCreateLang] = useState<SupportedLanguage>("en");
  const [createTitles, setCreateTitles] = useState<Record<string, string>>({});
  const [createSubtexts, setCreateSubtexts] = useState<Record<string, string>>({});
  const [createPriceTexts, setCreatePriceTexts] = useState<Record<string, string>>({});
  const [createInstructionTooltips, setCreateInstructionTooltips] = useState<Record<string, string>>({});
  const [createTitle, setCreateTitle] = useState("");
  const [createTitleNl, setCreateTitleNl] = useState("");
  const [createSubtext, setCreateSubtext] = useState("");
  const [createSubtextNl, setCreateSubtextNl] = useState("");
  const [createPriceText, setCreatePriceText] = useState("");
  const [createPriceTextNl, setCreatePriceTextNl] = useState("");
  const [createMediaUrl, setCreateMediaUrl] = useState("");
  const [createMediaType, setCreateMediaType] = useState<HeroMediaType>("model3d");
  const [createInstructionTooltip, setCreateInstructionTooltip] = useState("");
  const [createInstructionTooltipNl, setCreateInstructionTooltipNl] = useState("");
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createSortOrder, setCreateSortOrder] = useState(0);

  // Edit form state
  const [editLang, setEditLang] = useState<SupportedLanguage>("en");
  const [editFormData, setEditFormData] = useState<Partial<HeroSlide>>({});

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const data = await getHeroSlides(true);
      setSlides(data);
    } catch (err) {
      console.error(err);
      notifyError(t("admin.heroSlides.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleStartEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    const titles = { ...(slide.titles || {}) };
    if (slide.title && !titles.en) titles.en = slide.title;
    if (slide.titleNl && !titles.nl) titles.nl = slide.titleNl;

    const subtexts = { ...(slide.subtexts || {}) };
    if (slide.subtext && !subtexts.en) subtexts.en = slide.subtext;
    if (slide.subtextNl && !subtexts.nl) subtexts.nl = slide.subtextNl;

    const priceTexts = { ...(slide.priceTexts || {}) };
    if (slide.priceText && !priceTexts.en) priceTexts.en = slide.priceText;
    if (slide.priceTextNl && !priceTexts.nl) priceTexts.nl = slide.priceTextNl;

    const instructionTooltips = { ...(slide.instructionTooltips || {}) };
    if (slide.instructionTooltip && !instructionTooltips.en) instructionTooltips.en = slide.instructionTooltip;
    if (slide.instructionTooltipNl && !instructionTooltips.nl) instructionTooltips.nl = slide.instructionTooltipNl;

    setEditFormData({
      ...slide,
      titles,
      subtexts,
      priceTexts,
      instructionTooltips,
    });
    setEditLang("en");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async (id: string) => {
    setSavingId(id);
    try {
      const titles = { ...(editFormData.titles || {}) };
      if (editFormData.title && !titles.en) titles.en = editFormData.title;
      if (editFormData.titleNl && !titles.nl) titles.nl = editFormData.titleNl;

      const subtexts = { ...(editFormData.subtexts || {}) };
      if (editFormData.subtext && !subtexts.en) subtexts.en = editFormData.subtext;
      if (editFormData.subtextNl && !subtexts.nl) subtexts.nl = editFormData.subtextNl;

      const priceTexts = { ...(editFormData.priceTexts || {}) };
      if (editFormData.priceText && !priceTexts.en) priceTexts.en = editFormData.priceText;
      if (editFormData.priceTextNl && !priceTexts.nl) priceTexts.nl = editFormData.priceTextNl;

      const instructionTooltips = { ...(editFormData.instructionTooltips || {}) };
      if (editFormData.instructionTooltip && !instructionTooltips.en) instructionTooltips.en = editFormData.instructionTooltip;
      if (editFormData.instructionTooltipNl && !instructionTooltips.nl) instructionTooltips.nl = editFormData.instructionTooltipNl;

      const payload = {
        ...editFormData,
        title: titles.en || editFormData.title || "",
        titleNl: titles.nl || editFormData.titleNl || null,
        subtext: subtexts.en || editFormData.subtext || "",
        subtextNl: subtexts.nl || editFormData.subtextNl || null,
        priceText: priceTexts.en || editFormData.priceText || "",
        priceTextNl: priceTexts.nl || editFormData.priceTextNl || null,
        instructionTooltip: instructionTooltips.en || editFormData.instructionTooltip || null,
        instructionTooltipNl: instructionTooltips.nl || editFormData.instructionTooltipNl || null,
        titles,
        subtexts,
        priceTexts,
        instructionTooltips,
      };

      const res = await api.put(`/heroslides/${id}`, payload);
      invalidateHeroSlidesCache();
      notifySuccess(t("admin.heroSlides.updateSuccess"));
      setSlides((prev) => prev.map((s) => (s.id === id ? res.data : s)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      notifyError(t("admin.heroSlides.updateFailed"));
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(t("admin.heroSlides.confirmDelete"))
    )
      return;

    setDeletingId(id);
    try {
      await api.delete(`/heroslides/${id}`);
      invalidateHeroSlidesCache();
      notifySuccess(t("admin.heroSlides.deleteSuccess"));
      setSlides((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      notifyError(t("admin.heroSlides.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeedDefaults = async () => {
    if (
      !window.confirm(t("admin.heroSlides.confirmSeed"))
    ) {
      return;
    }

    setIsReseeding(true);
    try {
      const updatedSlides = await seedDefaultHeroSlides();
      setSlides(updatedSlides);
      notifySuccess(t("admin.heroSlides.seedSuccess"));
    } catch (err: any) {
      console.error(err);
      notifyError(
        err?.response?.data?.message || t("admin.heroSlides.seedFailed"),
      );
    } finally {
      setIsReseeding(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryTitle = createTitles.en || createTitle;
    if (!primaryTitle.trim() || !createMediaUrl.trim()) {
      notifyError(t("admin.heroSlides.validationTitleMedia"));
      return;
    }

    try {
      const titles = { ...createTitles };
      if (createTitle.trim() && !titles.en) titles.en = createTitle.trim();
      if (createTitleNl.trim() && !titles.nl) titles.nl = createTitleNl.trim();

      const subtexts = { ...createSubtexts };
      if (createSubtext.trim() && !subtexts.en) subtexts.en = createSubtext.trim();
      if (createSubtextNl.trim() && !subtexts.nl) subtexts.nl = createSubtextNl.trim();

      const priceTexts = { ...createPriceTexts };
      if (createPriceText.trim() && !priceTexts.en) priceTexts.en = createPriceText.trim();
      if (createPriceTextNl.trim() && !priceTexts.nl) priceTexts.nl = createPriceTextNl.trim();

      const instructionTooltips = { ...createInstructionTooltips };
      if (createInstructionTooltip.trim() && !instructionTooltips.en) instructionTooltips.en = createInstructionTooltip.trim();
      if (createInstructionTooltipNl.trim() && !instructionTooltips.nl) instructionTooltips.nl = createInstructionTooltipNl.trim();

      const payload = {
        title: titles.en || createTitle.trim(),
        titleNl: titles.nl || createTitleNl.trim() || null,
        subtext: subtexts.en || createSubtext.trim(),
        subtextNl: subtexts.nl || createSubtextNl.trim() || null,
        priceText: priceTexts.en || createPriceText.trim(),
        priceTextNl: priceTexts.nl || createPriceTextNl.trim() || null,
        mediaUrl: createMediaUrl.trim(),
        mediaType: createMediaType,
        instructionTooltip: instructionTooltips.en || createInstructionTooltip.trim() || null,
        instructionTooltipNl: instructionTooltips.nl || createInstructionTooltipNl.trim() || null,
        titles,
        subtexts,
        priceTexts,
        instructionTooltips,
        isActive: createIsActive,
        sortOrder: createSortOrder,
      };

      const res = await api.post("/heroslides", payload);
      invalidateHeroSlidesCache();
      notifySuccess(t("admin.heroSlides.createSuccess"));
      setSlides((prev) =>
        [...prev, res.data].sort((a, b) => a.sortOrder - b.sortOrder),
      );
      setShowCreateModal(false);
      // Reset
      setCreateTitle("");
      setCreateTitleNl("");
      setCreateSubtext("");
      setCreateSubtextNl("");
      setCreatePriceText("");
      setCreatePriceTextNl("");
      setCreateTitles({});
      setCreateSubtexts({});
      setCreatePriceTexts({});
      setCreateInstructionTooltips({});
      setCreateMediaUrl("");
      setCreateMediaType("model3d");
      setCreateInstructionTooltip("");
      setCreateInstructionTooltipNl("");
      setCreateIsActive(true);
      setCreateSortOrder(0);
    } catch (err) {
      console.error(err);
      notifyError(t("admin.heroSlides.createFailed"));
    }
  };

  // Upload handler for direct file upload in form
  const handleDirectUpload = async (
    target: "create" | "edit",
    file: File | null,
  ) => {
    if (!file) return;

    setUploadingFor(target);
    try {
      const res = await uploadHeroMedia(file);
      const inferredType = res.mediaType || detectMediaType(res.url);

      if (target === "create") {
        setCreateMediaUrl(res.url);
        setCreateMediaType(inferredType);
      } else {
        setEditFormData((prev) => ({
          ...prev,
          mediaUrl: res.url,
          mediaType: inferredType,
        }));
      }

      notifySuccess(
        t("admin.heroSlides.uploadedFileSuccess", { fileName: file.name }),
      );
    } catch (err: any) {
      console.error(err);
      notifyError(err?.response?.data?.message || "Failed to upload file.");
    } finally {
      setUploadingFor(null);
    }
  };

  // Callback from MediaSelectorModal
  const handleSelectorSelect = (
    url: string,
    mediaType: HeroMediaType,
    fileName: string,
  ) => {
    if (selectorTarget === "create") {
      setCreateMediaUrl(url);
      setCreateMediaType(mediaType);
    } else if (selectorTarget === "edit") {
      setEditFormData((prev) => ({
        ...prev,
        mediaUrl: url,
        mediaType,
      }));
    }
    notifySuccess(t("admin.heroSlides.selectedFile", { fileName }));
  };

  const openSelectorFor = (target: "create" | "edit") => {
    setSelectorTarget(target);
    setShowSelectorModal(true);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminBreadcrumb
          title={t("admin.heroSlides.title")}
          items={[{ label: t("breadcrumb.admin") || "Admin", to: "/admin" }, { label: t("admin.nav.heroSlides") || "Hero Slides" }]}
          rightSlot={
            activeMainTab === "slides" ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isReseeding}
                  onClick={handleSeedDefaults}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium rounded-xl text-sm transition-colors shadow-xs disabled:opacity-50"
                  title={t("admin.heroSlides.seedTooltip")}
                >
                  {isReseeding ? (
                    <Loader2 size={16} className="animate-spin text-emerald-700" />
                  ) : (
                    <Sparkles size={16} className="text-emerald-700" />
                  )}
                  <span>{t("admin.heroSlides.seedButton")}</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-xs"
                >
                  <Plus size={16} />
                  <span>{t("admin.heroSlides.addSlide")}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {t("admin.heroSlides.previewLanguage")}:
                </span>
                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/10">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setPreviewHolidayLang(lang)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        previewHolidayLang === lang
                          ? "bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <span>{languageFlagMap[lang]}</span>
                      <span className="uppercase text-[11px]">{lang}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          }
        />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/10 w-fit mb-6">
          <button
            type="button"
            onClick={() => setActiveMainTab("slides")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeMainTab === "slides"
                ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <ImageIcon size={16} />
            <span>{t("admin.heroSlides.tabStandardSlides")}</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold">
              {slides.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("holidays")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeMainTab === "holidays"
                ? "bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Calendar size={16} />
            <span>{t("admin.heroSlides.tabHolidayHeroes")}</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
              {HOLIDAY_PRIORITY.length}
            </span>
          </button>
        </div>

        {activeMainTab === "slides" && (
          loading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : slides.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#0e1512] rounded-2xl border border-gray-100 dark:border-white/10 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-bold text-base mb-1">
                {t("admin.heroSlides.noSlidesTitle")}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-4">
                {t("admin.heroSlides.noSlidesDesc")}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isReseeding}
                onClick={handleSeedDefaults}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 font-semibold rounded-xl text-sm cursor-pointer"
              >
                {isReseeding ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>{t("admin.heroSlides.restoreDefaults")}</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm cursor-pointer"
              >
                <Plus size={16} />
                <span>{t("admin.heroSlides.createSlide")}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {slides.map((slide) => {
              const isEditing = editingId === slide.id;
              const isSaving = savingId === slide.id;
              const isDeleting = deletingId === slide.id;

              return (
                <div
                  key={slide.id}
                  className={`bg-white dark:bg-[#0e1512] rounded-2xl border p-6 shadow-xs transition-all ${
                    slide.isActive
                      ? "border-emerald-200 dark:border-emerald-800/60 ring-1 ring-emerald-50 dark:ring-emerald-950/40"
                      : "border-gray-200 dark:border-white/10 opacity-75"
                  }`}
                >
                  {isEditing ? (
                    // Edit Form
                    <div className="space-y-4">
                      {/* Language Selector Tabs */}
                      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-100 dark:bg-white/5 rounded-xl">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2">
                          {t("admin.heroSlides.languageTab")}:
                        </span>
                        {supportedLanguages.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setEditLang(lang)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              editLang === lang
                                ? "bg-white dark:bg-[#141e1a] text-emerald-800 dark:text-emerald-400 shadow-xs"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                          >
                            <span>{languageFlagMap[lang]}</span>
                            <span className="uppercase">{lang}</span>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            {t("admin.heroSlides.fieldTitle")} ({editLang.toUpperCase()})
                          </label>
                          <input
                            type="text"
                            value={
                              editFormData.titles?.[editLang] ??
                              (editLang === "en"
                                ? editFormData.title ?? ""
                                : editLang === "nl"
                                ? editFormData.titleNl ?? ""
                                : "")
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) => {
                                const updated = { ...(prev.titles || {}), [editLang]: val };
                                const next = { ...prev, titles: updated };
                                if (editLang === "en") next.title = val;
                                if (editLang === "nl") next.titleNl = val;
                                return next;
                              });
                            }}
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            {t("admin.heroSlides.fieldPrice")} ({editLang.toUpperCase()})
                          </label>
                          <input
                            type="text"
                            placeholder={t("admin.heroSlides.pricePlaceholder")}
                            value={
                              editFormData.priceTexts?.[editLang] ??
                              (editLang === "en"
                                ? editFormData.priceText ?? ""
                                : editLang === "nl"
                                ? editFormData.priceTextNl ?? ""
                                : "")
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditFormData((prev) => {
                                const updated = { ...(prev.priceTexts || {}), [editLang]: val };
                                const next = { ...prev, priceTexts: updated };
                                if (editLang === "en") next.priceText = val;
                                if (editLang === "nl") next.priceTextNl = val;
                                return next;
                              });
                            }}
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          {t("admin.heroSlides.fieldSubtext")} ({editLang.toUpperCase()})
                        </label>
                        <textarea
                          rows={2}
                          value={
                            editFormData.subtexts?.[editLang] ??
                            (editLang === "en"
                              ? editFormData.subtext ?? ""
                              : editLang === "nl"
                              ? editFormData.subtextNl ?? ""
                              : "")
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditFormData((prev) => {
                              const updated = { ...(prev.subtexts || {}), [editLang]: val };
                              const next = { ...prev, subtexts: updated };
                              if (editLang === "en") next.subtext = val;
                              if (editLang === "nl") next.subtextNl = val;
                              return next;
                            });
                          }}
                          className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Media URL with File Upload and File Selector */}
                      <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="block text-xs font-semibold text-gray-800">
                            {t("admin.heroSlides.fieldMedia")}
                          </label>

                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              ref={editFileInputRef}
                              className="hidden"
                              accept=".stl,.obj,.3mf,.step,.stp,.png,.jpg,.jpeg,.webp,.gif,.svg"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleDirectUpload("edit", f);
                                if (e.target) e.target.value = "";
                              }}
                            />
                            <button
                              type="button"
                              disabled={uploadingFor === "edit"}
                              onClick={() => editFileInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
                            >
                              {uploadingFor === "edit" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Upload size={14} />
                              )}
                              <span>
                                {uploadingFor === "edit"
                                  ? t("admin.heroSlides.uploading")
                                  : t("admin.heroSlides.uploadFile")}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openSelectorFor("edit")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-medium shadow-xs transition-colors"
                            >
                              <FolderOpen size={14} />
                              <span>{t("admin.heroSlides.chooseFromUploads")}</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              value={editFormData.mediaUrl || ""}
                              placeholder={t("admin.heroSlides.mediaUrlPlaceholder")}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditFormData({
                                  ...editFormData,
                                  mediaUrl: val,
                                  mediaType: detectMediaType(val),
                                });
                              }}
                              className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                            />
                          </div>

                          <div>
                            <select
                              value={editFormData.mediaType || "model3d"}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  mediaType: e.target.value as HeroMediaType,
                                })
                              }
                              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                            >
                              <option value="model3d">{t("admin.heroSlides.mediaType3d")}</option>
                              <option value="image">{t("admin.heroSlides.mediaTypeImage")}</option>
                            </select>
                          </div>
                        </div>

                        {/* Preview Chip */}
                        {editFormData.mediaUrl && (
                          <div className="flex items-center justify-between p-2.5 rounded-xl border bg-white text-xs">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              {editFormData.mediaType === "image" ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center shrink-0">
                                  <img
                                    src={resolveAssetUrl(editFormData.mediaUrl)}
                                    alt={t("admin.heroSlides.previewAlt")}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display =
                                        "none";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                  <Box size={20} />
                                </div>
                              )}
                              <div className="truncate">
                                <div className="font-semibold text-gray-800 truncate">
                                  {editFormData.mediaUrl.split("/").pop()}
                                </div>
                                <div className="text-gray-400 font-mono text-[10px] truncate">
                                  {editFormData.mediaUrl}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {editFormData.mediaType === "model3d" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreview3dModelUrl(
                                      editFormData.mediaUrl || null,
                                    );
                                    setPreview3dTitle(
                                      editFormData.title || "3D Model Preview",
                                    );
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                                >
                                  <Eye size={12} />
                                  <span>{t("admin.heroSlides.preview3d")}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setEditFormData({
                                    ...editFormData,
                                    mediaUrl: "",
                                  })
                                }
                                className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title={t("admin.heroSlides.clearFile")}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          {t("admin.heroSlides.fieldTooltip")} ({editLang.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          placeholder={t("admin.heroSlides.interactiveInstructions")}
                          value={
                            editFormData.instructionTooltips?.[editLang] ??
                            (editLang === "en"
                              ? editFormData.instructionTooltip ?? ""
                              : editLang === "nl"
                              ? editFormData.instructionTooltipNl ?? ""
                              : "")
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditFormData((prev) => {
                              const updated = { ...(prev.instructionTooltips || {}), [editLang]: val };
                              const next = { ...prev, instructionTooltips: updated };
                              if (editLang === "en") next.instructionTooltip = val;
                              if (editLang === "nl") next.instructionTooltipNl = val;
                              return next;
                            });
                          }}
                          className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={editFormData.isActive ?? true}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  isActive: e.target.checked,
                                })
                              }
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{t("admin.heroSlides.fieldActive")}</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-700">
                              {t("admin.heroSlides.sortOrderPrefix")}
                            </label>
                            <input
                              type="number"
                              value={editFormData.sortOrder ?? 0}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  sortOrder: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-20 px-2 py-1 border rounded-lg text-sm text-center"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 border rounded-xl text-sm hover:bg-gray-50"
                          >
                            {t("admin.heroSlides.cancel")}
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveEdit(slide.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-xs"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            <span>{t("admin.heroSlides.saveChanges")}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Display Card
                    <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              slide.isActive
                                ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                                : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {slide.isActive ? t("admin.heroSlides.active") : t("admin.heroSlides.inactive")}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                            {slide.mediaType === "model3d" ? (
                              <Box size={12} />
                            ) : (
                              <ImageIcon size={12} />
                            )}
                            <span>{slide.mediaType}</span>
                          </span>

                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {t("admin.heroSlides.sortOrderPrefix")} #{slide.sortOrder}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                          <span>{slide.title}</span>
                          {slide.titleNl && (
                            <span className="text-xs font-normal text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                              {t("admin.heroSlides.nlPrefix")} {slide.titleNl}
                            </span>
                          )}
                        </h3>

                        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                          {slide.subtext}
                        </p>
                        {slide.subtextNl && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic max-w-2xl">
                            {t("admin.heroSlides.nlPrefix")} {slide.subtextNl}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                          {slide.priceText && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {t("admin.heroSlides.pricePrefix")}
                              </span>{" "}
                              {slide.priceText}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {t("admin.heroSlides.mediaUrlPrefix")}
                            </span>{" "}
                            <span className="font-mono text-gray-600 dark:text-gray-400">
                              {slide.mediaUrl}
                            </span>
                          </div>
                          {slide.instructionTooltip && (
                            <div>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {t("admin.heroSlides.tooltipPrefix")}
                              </span>{" "}
                              {slide.instructionTooltip}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action buttons & Thumbnail */}
                      <div className="flex items-center gap-3 shrink-0">
                        {slide.mediaType === "image" && slide.mediaUrl && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                            <img
                              src={resolveAssetUrl(slide.mediaUrl)}
                              alt={slide.title}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                        {slide.mediaType === "model3d" && slide.mediaUrl && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 flex flex-col items-center justify-center text-blue-700 dark:text-blue-300 gap-1 p-1 text-center">
                            <Box size={22} />
                            <span className="text-[10px] font-bold truncate max-w-full px-1">
                              {slide.mediaUrl.split("/").pop()}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPreview3dModelUrl(slide.mediaUrl);
                                setPreview3dTitle(slide.title);
                              }}
                              className="text-[9px] underline text-blue-800 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 font-bold cursor-pointer"
                            >
                              {t("admin.heroSlides.preview3d")}
                            </button>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(slide)}
                            className="p-2 border border-gray-200 dark:border-white/15 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                            title={t("admin.heroSlides.editSlide")}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(slide.id)}
                            className="p-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title={t("admin.heroSlides.deleteSlide")}
                          >
                            {isDeleting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Holiday Themes & Hero Live Preview Tab */}
        {activeMainTab === "holidays" && (
          <div className="space-y-6">
            {/* Header / Description card */}
            <div className="bg-gradient-to-r from-emerald-900/10 via-emerald-800/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-900/10 dark:to-transparent border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {t("admin.heroSlides.tabHolidayHeroes")}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                  {t("admin.heroSlides.holidayHeroesSubtitle")}
                </p>
              </div>

              {/* Quick live preview trigger */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const activeKey =
                      HOLIDAY_PRIORITY.find((k) =>
                        isDateInHoliday(new Date(), holidayConfig[k]),
                      ) || HOLIDAY_PRIORITY[0];
                    setPreviewHolidayKey(activeKey);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-xs cursor-pointer"
                >
                  <Eye size={16} />
                  <span>{t("admin.heroSlides.livePreview")}</span>
                </button>
              </div>
            </div>

            {/* Grid of 11 Holiday Heroes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {HOLIDAY_PRIORITY.map((key) => {
                const holiday = holidayConfig[key];
                const isActiveToday = isDateInHoliday(new Date(), holiday);
                const name = getHolidayName(key, previewHolidayLang);
                const dateLabel = getHolidayDateLabel(key, previewHolidayLang);
                const title = getHolidayTitle(key, previewHolidayLang);
                const subtitle = getHolidaySubtitle(key, previewHolidayLang);
                const ctaText = getHolidayCtaText(key, previewHolidayLang);

                return (
                  <div
                    key={key}
                    className={`bg-white dark:bg-[#0e1512] rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                      isActiveToday
                        ? "border-emerald-300 dark:border-emerald-700/80 ring-2 ring-emerald-500/20"
                        : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Bar: Name + Active Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-base text-gray-900 dark:text-white">
                            {name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <Calendar size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{dateLabel}</span>
                          </div>
                        </div>

                        {isActiveToday ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{t("admin.heroSlides.activeNow")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400">
                            <span>{t("admin.heroSlides.scheduled")}</span>
                          </span>
                        )}
                      </div>

                      {/* Content Preview Box */}
                      <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 space-y-2">
                        <div className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">
                          "{title}"
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                          {subtitle}
                        </div>
                        <div className="pt-2 flex items-center justify-end">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            <span>{ctaText}</span>
                          </span>
                        </div>
                      </div>

                      {/* Badges: 3D Model, Effect, Palette */}
                      <div className="space-y-2 text-xs">
                        {/* 3D Model Chip */}
                        <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-white/5">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Box size={13} className="text-blue-500" />
                            <span>{t("admin.heroSlides.modelLabel")}:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPreview3dModelUrl(holiday.modelUrl);
                              setPreview3dTitle(name);
                            }}
                            className="font-mono text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                            title={t("admin.heroSlides.preview3d")}
                          >
                            <span>{holiday.modelUrl.replace("/uploads/hero/", "")}</span>
                            <Eye size={11} />
                          </button>
                        </div>

                        {/* Background Effect Chip */}
                        <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-white/5">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-500" />
                            <span>{t("admin.heroSlides.effectLabel")}:</span>
                          </span>
                          <span className="font-semibold capitalize px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[11px]">
                            {holiday.effect}
                          </span>
                        </div>

                        {/* Palette Swatch */}
                        <div className="flex items-center justify-between py-1">
                          <span className="text-gray-500 dark:text-gray-400">
                            {t("admin.heroSlides.paletteLabel")}:
                          </span>
                          <div
                            className={`h-4 w-28 rounded-md ${holiday.colorPalette.heroBg} border border-white/20 shadow-xs`}
                            title={holiday.colorPalette.heroBg}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-5 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreview3dModelUrl(holiday.modelUrl);
                          setPreview3dTitle(name);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
                      >
                        <Box size={14} className="text-blue-500" />
                        <span>{t("admin.heroSlides.preview3d")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewHolidayKey(key)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>{t("admin.heroSlides.livePreview")}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create Slide Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0e1512] border border-gray-200 dark:border-white/10 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t("admin.heroSlides.addSlideTitle")}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Language Selector Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2">
                    {t("admin.heroSlides.languageTab")}:
                  </span>
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setCreateLang(lang)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        createLang === lang
                          ? "bg-white dark:bg-emerald-700 text-emerald-800 dark:text-white shadow-xs"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <span>{languageFlagMap[lang]}</span>
                      <span className="uppercase">{lang}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t("admin.heroSlides.fieldTitle")} ({createLang.toUpperCase()}) {createLang === "en" ? "*" : ""}
                    </label>
                    <input
                      type="text"
                      required={createLang === "en"}
                      placeholder={t("admin.heroSlides.enTitlePlaceholder")}
                      value={createTitles[createLang] ?? (createLang === "en" ? createTitle : createLang === "nl" ? createTitleNl : "")}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCreateTitles((prev) => ({ ...prev, [createLang]: val }));
                        if (createLang === "en") setCreateTitle(val);
                        if (createLang === "nl") setCreateTitleNl(val);
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t("admin.heroSlides.fieldPrice")} ({createLang.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      placeholder={t("admin.heroSlides.pricePlaceholder")}
                      value={createPriceTexts[createLang] ?? (createLang === "en" ? createPriceText : createLang === "nl" ? createPriceTextNl : "")}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCreatePriceTexts((prev) => ({ ...prev, [createLang]: val }));
                        if (createLang === "en") setCreatePriceText(val);
                        if (createLang === "nl") setCreatePriceTextNl(val);
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t("admin.heroSlides.fieldSubtext")} ({createLang.toUpperCase()})
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t("admin.heroSlides.enDescPlaceholder")}
                    value={createSubtexts[createLang] ?? (createLang === "en" ? createSubtext : createLang === "nl" ? createSubtextNl : "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCreateSubtexts((prev) => ({ ...prev, [createLang]: val }));
                      if (createLang === "en") setCreateSubtext(val);
                      if (createLang === "nl") setCreateSubtextNl(val);
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Media URL with File Upload and File Selector */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-gray-800">
                      {t("admin.heroSlides.fieldMedia")}
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={createFileInputRef}
                        className="hidden"
                        accept=".stl,.obj,.3mf,.step,.stp,.png,.jpg,.jpeg,.webp,.gif,.svg"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleDirectUpload("create", f);
                          if (e.target) e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploadingFor === "create"}
                        onClick={() => createFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs transition-colors disabled:opacity-50"
                      >
                        {uploadingFor === "create" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        <span>
                          {uploadingFor === "create"
                            ? t("admin.heroSlides.uploading")
                            : t("admin.heroSlides.uploadFile")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openSelectorFor("create")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-medium shadow-xs transition-colors"
                      >
                        <FolderOpen size={14} />
                        <span>{t("admin.heroSlides.chooseFromUploads")}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="/uploads/hero/cable-holder.stl"
                        value={createMediaUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCreateMediaUrl(val);
                          setCreateMediaType(detectMediaType(val));
                        }}
                        className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>

                    <div>
                      <select
                        value={createMediaType}
                        onChange={(e) =>
                          setCreateMediaType(e.target.value as HeroMediaType)
                        }
                        className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="model3d">{t("admin.heroSlides.mediaType3d")}</option>
                        <option value="image">{t("admin.heroSlides.mediaTypeImage")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview Chip */}
                  {createMediaUrl && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl border bg-white text-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {createMediaType === "image" ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center shrink-0">
                            <img
                              src={resolveAssetUrl(createMediaUrl)}
                              alt={t("admin.heroSlides.previewAlt")}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <Box size={20} />
                          </div>
                        )}
                        <div className="truncate">
                          <div className="font-semibold text-gray-800 truncate">
                            {createMediaUrl.split("/").pop()}
                          </div>
                          <div className="text-gray-400 font-mono text-[10px] truncate">
                            {createMediaUrl}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {createMediaType === "model3d" && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreview3dModelUrl(createMediaUrl);
                              setPreview3dTitle(createTitle || "3D Model Preview");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                          >
                            <Eye size={12} />
                            <span>{t("admin.heroSlides.preview3d")}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setCreateMediaUrl("")}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title={t("admin.heroSlides.clearFile")}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t("admin.heroSlides.fieldTooltip")} ({createLang.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      placeholder={t("admin.heroSlides.interactiveInstructions")}
                      value={createInstructionTooltips[createLang] ?? (createLang === "en" ? createInstructionTooltip : createLang === "nl" ? createInstructionTooltipNl : "")}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCreateInstructionTooltips((prev) => ({ ...prev, [createLang]: val }));
                        if (createLang === "en") setCreateInstructionTooltip(val);
                        if (createLang === "nl") setCreateInstructionTooltipNl(val);
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t("admin.heroSlides.fieldSortOrder")}
                    </label>
                    <input
                      type="number"
                      value={createSortOrder}
                      onChange={(e) =>
                        setCreateSortOrder(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t("admin.heroSlides.fieldTooltipNl")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("admin.heroSlides.nlInstructionPlaceholder")}
                    value={createInstructionTooltipNl}
                    onChange={(e) =>
                      setCreateInstructionTooltipNl(e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createActiveCheck"
                    checked={createIsActive}
                    onChange={(e) => setCreateIsActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label
                    htmlFor="createActiveCheck"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {t("admin.heroSlides.activeVisible")}
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border rounded-xl text-sm hover:bg-gray-50"
                  >
                    {t("admin.heroSlides.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs"
                  >
                    <Check size={16} />
                    <span>{t("admin.heroSlides.createSlide")}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Media Selector Modal */}
        <MediaSelectorModal
          isOpen={showSelectorModal}
          onClose={() => {
            setShowSelectorModal(false);
            setSelectorTarget(null);
          }}
          onSelect={handleSelectorSelect}
          currentUrl={
            selectorTarget === "create"
              ? createMediaUrl
              : editFormData.mediaUrl
          }
          onPreview3d={(url, title) => {
            setPreview3dModelUrl(url);
            setPreview3dTitle(title || "3D Model Preview");
          }}
        />

        {/* 3D Preview Modal */}
        <Model3dPreviewModal
          isOpen={!!preview3dModelUrl}
          onClose={() => {
            setPreview3dModelUrl(null);
            setPreview3dTitle("");
          }}
          modelUrl={preview3dModelUrl}
          title={preview3dTitle}
        />

        {/* Holiday Hero Full Live Preview Modal */}
        {previewHolidayKey && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="relative bg-white dark:bg-[#0e1512] border border-gray-200 dark:border-white/10 rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] my-auto">
              {/* Absolute Top-Right Close Button */}
              <button
                type="button"
                onClick={() => setPreviewHolidayKey(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition cursor-pointer z-20"
                aria-label={t("admin.heroSlides.closeModal")}
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200 dark:border-white/10 shrink-0 pr-10 sm:pr-12">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {t("admin.heroSlides.previewModalTitle", {
                        name: getHolidayName(previewHolidayKey, previewHolidayLang),
                      })}
                    </h3>
                    {isDateInHoliday(new Date(), holidayConfig[previewHolidayKey]) ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {t("admin.heroSlides.activeNow")}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300">
                        {t("admin.heroSlides.scheduled")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t("admin.heroSlides.previewModalSubtitle")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Switch holiday selector */}
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="previewHolidaySelect" className="text-xs font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                      {t("admin.heroSlides.switchHoliday")}:
                    </label>
                    <select
                      id="previewHolidaySelect"
                      value={previewHolidayKey}
                      onChange={(e) => setPreviewHolidayKey(e.target.value as HolidayKey)}
                      className="text-xs font-semibold rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {HOLIDAY_PRIORITY.map((key) => (
                        <option
                          key={key}
                          value={key}
                          className="bg-white dark:bg-[#0e1512] text-gray-900 dark:text-white"
                        >
                          {getHolidayName(key, previewHolidayLang)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Language Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/10">
                    {supportedLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setPreviewHolidayLang(lang);
                          void loadLanguage(lang);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          previewHolidayLang === lang
                            ? "bg-white dark:bg-emerald-600 text-emerald-800 dark:text-white shadow-xs"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                        title={lang.toUpperCase()}
                      >
                        <span>{languageFlagMap[lang]}</span>
                        <span className="uppercase text-[10px] ml-1">{lang}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Hero Component Viewport */}
              <div className="mt-4 flex-1 overflow-y-auto rounded-[2.5rem] border border-gray-200/60 dark:border-white/10 shadow-inner bg-transparent relative max-h-[72vh] overflow-hidden">
                <Hero
                  previewHolidayId={previewHolidayKey}
                  previewLanguage={previewHolidayLang}
                />
              </div>

              {/* Modal Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 shrink-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {t("admin.heroSlides.dateRangeLabel")}:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {getHolidayDateLabel(previewHolidayKey, previewHolidayLang)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Box size={13} className="text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {t("admin.heroSlides.modelLabel")}:
                    </span>
                    <code className="text-[11px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200">
                      {holidayConfig[previewHolidayKey].modelUrl}
                    </code>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {t("admin.heroSlides.effectLabel")}:
                    </span>
                    <span className="capitalize font-semibold text-gray-900 dark:text-white">
                      {holidayConfig[previewHolidayKey].effect}
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewHolidayKey(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition cursor-pointer"
                >
                  {t("admin.heroSlides.closeModal")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
