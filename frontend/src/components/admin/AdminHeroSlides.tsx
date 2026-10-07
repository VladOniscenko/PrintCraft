import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Box,
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
  seedDefaultHeroSlides,
  uploadHeroMedia,
} from "../../services/api";
import type { HeroMediaType, HeroSlide } from "../../types";
import { resolveAssetUrl } from "../../utils/assetUrl";
import { useNotify } from "../../context/NotifyContext";

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
  if (!isOpen || !modelUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Box size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {title || "3D Model Preview"}
              </h3>
              <p className="text-xs text-gray-500 font-mono truncate max-w-md">
                {modelUrl}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="w-full h-80 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden relative border">
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center text-white gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-sm">Loading 3D renderer...</span>
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
              Interactive 3D: drag to rotate 360°, scroll to zoom
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-medium"
          >
            Close Preview
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
      notifyError("Failed to load uploaded files list.");
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
      notifySuccess(`Uploaded "${file.name}" successfully.`);
      await fetchFiles();
      // Auto-select the newly uploaded file
      const inferredType = res.mediaType || detectMediaType(res.url);
      onSelect(res.url, inferredType, res.fileName || file.name);
      onClose();
    } catch (err: any) {
      console.error(err);
      notifyError(err?.response?.data?.message || "Failed to upload file.");
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Select from Uploaded Files
            </h3>
            <p className="text-xs text-gray-500">
              Choose an existing 3D model or image asset, or upload a new file.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
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
              <span>{uploading ? "Uploading File..." : "Upload New File"}</span>
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
                All Files
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
                <span>3D Models</span>
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
                <span>Images</span>
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
                placeholder="Search files..."
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
              title="Refresh files"
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
              <span className="text-sm">Loading uploaded files...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-3">
              <FolderOpen size={40} className="text-gray-300" />
              <p className="text-sm font-medium">No matching files found.</p>
              <p className="text-xs text-gray-400">
                Upload a file with the button above or clear search filters.
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
                            {type === "model3d" ? "3D Model" : "Image"}
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
                          <span>Preview 3D</span>
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
                        {isSelected ? "Selected" : "Select File"}
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
            Total files: <span className="font-semibold">{filteredFiles.length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-xl text-xs font-medium hover:bg-gray-50"
          >
            Cancel
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
  const [editFormData, setEditFormData] = useState<Partial<HeroSlide>>({});

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const data = await getHeroSlides(true);
      setSlides(data);
    } catch (err) {
      console.error(err);
      notifyError("Failed to load hero slides.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleStartEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setEditFormData({ ...slide });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async (id: string) => {
    setSavingId(id);
    try {
      const res = await api.put(`/heroslides/${id}`, editFormData);
      notifySuccess("Hero slide updated successfully.");
      setSlides((prev) => prev.map((s) => (s.id === id ? res.data : s)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
      notifyError("Failed to update hero slide.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this promotional slide?")
    )
      return;

    setDeletingId(id);
    try {
      await api.delete(`/heroslides/${id}`);
      notifySuccess("Hero slide deleted.");
      setSlides((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      notifyError("Failed to delete hero slide.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeedDefaults = async () => {
    if (
      !window.confirm(
        "This will ensure default promotional slides and 3D STL files (cable-holder, dino, materials) exist on the server. Proceed?",
      )
    ) {
      return;
    }

    setIsReseeding(true);
    try {
      const updatedSlides = await seedDefaultHeroSlides();
      setSlides(updatedSlides);
      notifySuccess("Default slides and 3D STL assets seeded successfully!");
    } catch (err: any) {
      console.error(err);
      notifyError(
        err?.response?.data?.message ||
          "Failed to seed default slides and assets.",
      );
    } finally {
      setIsReseeding(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createMediaUrl.trim()) {
      notifyError("Title and Media URL are required.");
      return;
    }

    try {
      const payload = {
        title: createTitle.trim(),
        titleNl: createTitleNl.trim() || null,
        subtext: createSubtext.trim(),
        subtextNl: createSubtextNl.trim() || null,
        priceText: createPriceText.trim(),
        priceTextNl: createPriceTextNl.trim() || null,
        mediaUrl: createMediaUrl.trim(),
        mediaType: createMediaType,
        instructionTooltip: createInstructionTooltip.trim() || null,
        instructionTooltipNl: createInstructionTooltipNl.trim() || null,
        isActive: createIsActive,
        sortOrder: createSortOrder,
      };

      const res = await api.post("/heroslides", payload);
      notifySuccess("New hero slide created successfully.");
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
      setCreateMediaUrl("");
      setCreateMediaType("model3d");
      setCreateInstructionTooltip("");
      setCreateInstructionTooltipNl("");
      setCreateIsActive(true);
      setCreateSortOrder(0);
    } catch (err) {
      console.error(err);
      notifyError("Failed to create hero slide.");
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

      notifySuccess(`Uploaded "${file.name}" successfully!`);
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
    notifySuccess(`Selected "${fileName}"`);
  };

  const openSelectorFor = (target: "create" | "edit") => {
    setSelectorTarget(target);
    setShowSelectorModal(true);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminBreadcrumb
          title="Promotional Hero Slides"
          items={[{ label: "Admin", to: "/admin" }, { label: "Hero Slides" }]}
          rightSlot={
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isReseeding}
                onClick={handleSeedDefaults}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium rounded-xl text-sm transition-colors shadow-xs disabled:opacity-50"
                title="Ensure default slides and 3D STL assets are seeded"
              >
                {isReseeding ? (
                  <Loader2 size={16} className="animate-spin text-emerald-700" />
                ) : (
                  <Sparkles size={16} className="text-emerald-700" />
                )}
                <span>Seed Default Slides</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-xs"
              >
                <Plus size={16} />
                <span>Add New Slide</span>
              </button>
            </div>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : slides.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-base mb-1">
                No hero slides found in database
              </p>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                You can seed the pre-configured default slides (with interactive
                3D models) or create a fresh slide from scratch.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isReseeding}
                onClick={handleSeedDefaults}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-xl text-sm"
              >
                {isReseeding ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>Restore Default Slides & STL Files</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm"
              >
                <Plus size={16} />
                <span>Create Slide</span>
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
                  className={`bg-white rounded-2xl border p-6 shadow-xs transition-all ${
                    slide.isActive
                      ? "border-emerald-200 ring-1 ring-emerald-50"
                      : "border-gray-200 opacity-75"
                  }`}
                >
                  {isEditing ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Title (EN) *
                          </label>
                          <input
                            type="text"
                            value={editFormData.title || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Price Text (EN)
                          </label>
                          <input
                            type="text"
                            value={editFormData.priceText || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                priceText: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Title (NL - Nederlands)
                          </label>
                          <input
                            type="text"
                            placeholder="Nederlandse titel..."
                            value={editFormData.titleNl || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                titleNl: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Price Text (NL)
                          </label>
                          <input
                            type="text"
                            placeholder="bijv. Vanaf €9,95"
                            value={editFormData.priceTextNl || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                priceTextNl: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Subtext / Description (EN)
                          </label>
                          <textarea
                            rows={2}
                            value={editFormData.subtext || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                subtext: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Subtext / Description (NL)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Nederlandse beschrijving..."
                            value={editFormData.subtextNl || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                subtextNl: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Media URL with File Upload and File Selector */}
                      <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="block text-xs font-semibold text-gray-800">
                            Media Asset / File *
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
                                  ? "Uploading..."
                                  : "Upload File"}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openSelectorFor("edit")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-medium shadow-xs transition-colors"
                            >
                              <FolderOpen size={14} />
                              <span>Choose from Uploads</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              value={editFormData.mediaUrl || ""}
                              placeholder="/uploads/hero/model.stl or /uploads/image.png"
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
                              <option value="model3d">3D Model (Three.js STL / 3MF)</option>
                              <option value="image">Static Image / Banner</option>
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
                                    alt="Preview"
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
                                  <span>Preview 3D</span>
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
                                title="Clear file"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Instruction Tooltip (EN)
                          </label>
                          <input
                            type="text"
                            value={editFormData.instructionTooltip || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                instructionTooltip: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Instruction Tooltip (NL)
                          </label>
                          <input
                            type="text"
                            placeholder="Nederlandse instructie..."
                            value={editFormData.instructionTooltipNl || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                instructionTooltipNl: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
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
                            <span>Active in Public Slideshow</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-700">
                              Sort Order:
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
                            Cancel
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
                            <span>Save Changes</span>
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
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {slide.isActive ? "Active" : "Inactive"}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {slide.mediaType === "model3d" ? (
                              <Box size={12} />
                            ) : (
                              <ImageIcon size={12} />
                            )}
                            <span>{slide.mediaType}</span>
                          </span>

                          <span className="text-xs text-gray-400">
                            Sort Order: #{slide.sortOrder}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
                          <span>{slide.title}</span>
                          {slide.titleNl && (
                            <span className="text-xs font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              NL: {slide.titleNl}
                            </span>
                          )}
                        </h3>

                        <p className="text-sm text-gray-600 max-w-2xl">
                          {slide.subtext}
                        </p>
                        {slide.subtextNl && (
                          <p className="text-xs text-gray-500 italic max-w-2xl">
                            NL: {slide.subtextNl}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
                          {slide.priceText && (
                            <div>
                              <span className="font-semibold text-gray-700">
                                Price:
                              </span>{" "}
                              {slide.priceText}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-700">
                              Media URL:
                            </span>{" "}
                            <span className="font-mono text-gray-600">
                              {slide.mediaUrl}
                            </span>
                          </div>
                          {slide.instructionTooltip && (
                            <div>
                              <span className="font-semibold text-gray-700">
                                Tooltip:
                              </span>{" "}
                              {slide.instructionTooltip}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action buttons & Thumbnail */}
                      <div className="flex items-center gap-3 shrink-0">
                        {slide.mediaType === "image" && slide.mediaUrl && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center">
                            <img
                              src={resolveAssetUrl(slide.mediaUrl)}
                              alt={slide.title}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                        {slide.mediaType === "model3d" && slide.mediaUrl && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-blue-200 bg-blue-50/70 flex flex-col items-center justify-center text-blue-700 gap-1 p-1 text-center">
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
                              className="text-[9px] underline text-blue-800 hover:text-blue-900 font-bold"
                            >
                              Preview 3D
                            </button>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(slide)}
                            className="p-2 border rounded-xl hover:bg-gray-50 text-gray-700 hover:text-emerald-700 transition-colors"
                            title="Edit slide"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(slide.id)}
                            className="p-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                            title="Delete slide"
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
        )}

        {/* Create Slide Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="text-lg font-bold text-gray-900">
                  Add Promotional Hero Slide
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Title (EN) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rapid Prototyping & Custom Parts"
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Price Text (EN)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Starting from €9.95"
                      value={createPriceText}
                      onChange={(e) => setCreatePriceText(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Title (NL - Nederlands)
                    </label>
                    <input
                      type="text"
                      placeholder="bijv. Snelle Prototyping & Maatwerk Onderdelen"
                      value={createTitleNl}
                      onChange={(e) => setCreateTitleNl(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Price Text (NL)
                    </label>
                    <input
                      type="text"
                      placeholder="bijv. Vanaf €9,95"
                      value={createPriceTextNl}
                      onChange={(e) => setCreatePriceTextNl(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Subtext / Description (EN)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="High-precision FDM 3D printing for functional prototypes..."
                      value={createSubtext}
                      onChange={(e) => setCreateSubtext(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Subtext / Description (NL)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Precisie FDM 3D-printen voor functionele prototypes..."
                      value={createSubtextNl}
                      onChange={(e) => setCreateSubtextNl(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Media URL with File Upload and File Selector */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-gray-800">
                      Media Asset / File *
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
                            ? "Uploading..."
                            : "Upload File"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openSelectorFor("create")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-medium shadow-xs transition-colors"
                      >
                        <FolderOpen size={14} />
                        <span>Choose from Uploads</span>
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
                        <option value="model3d">3D Model (Three.js STL / 3MF)</option>
                        <option value="image">Static Image / Banner</option>
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
                              alt="Preview"
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
                            <span>Preview 3D</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setCreateMediaUrl("")}
                          className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          title="Clear file"
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
                      Instruction Tooltip (EN)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Drag to rotate 360°, scroll to zoom"
                      value={createInstructionTooltip}
                      onChange={(e) =>
                        setCreateInstructionTooltip(e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Sort Order
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
                    Instruction Tooltip (NL)
                  </label>
                  <input
                    type="text"
                    placeholder="bijv. Sleep om 360° te draaien, scroll om in te zoomen"
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
                    Active (visible in public slideshow)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border rounded-xl text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs"
                  >
                    <Check size={16} />
                    <span>Create Slide</span>
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
      </div>
    </AdminLayout>
  );
}
