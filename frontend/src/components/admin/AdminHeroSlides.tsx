import { useEffect, useState } from "react";
import {
  Box,
  Check,
  Edit2,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api, { getHeroSlides } from "../../services/api";
import type { HeroMediaType, HeroSlide } from "../../types";
import { resolveAssetUrl } from "../../utils/assetUrl";
import { useNotify } from "../../context/NotifyContext";

export default function AdminHeroSlides() {
  const { notifyError, notifySuccess } = useNotify();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state for new slide
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createTitleNl, setCreateTitleNl] = useState("");
  const [createSubtext, setCreateSubtext] = useState("");
  const [createSubtextNl, setCreateSubtextNl] = useState("");
  const [createPriceText, setCreatePriceText] = useState("");
  const [createPriceTextNl, setCreatePriceTextNl] = useState("");
  const [createMediaUrl, setCreateMediaUrl] = useState("");
  const [createMediaType, setCreateMediaType] =
    useState<HeroMediaType>("image");
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
      setCreateMediaType("image");
      setCreateInstructionTooltip("");
      setCreateInstructionTooltipNl("");
      setCreateIsActive(true);
      setCreateSortOrder(0);
    } catch (err) {
      console.error(err);
      notifyError("Failed to create hero slide.");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdminBreadcrumb
          title="Promotional Hero Slides"
          items={[{ label: "Admin", to: "/admin" }, { label: "Hero Slides" }]}
          rightSlot={
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Add New Slide</span>
            </button>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : slides.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 mb-4">
              No hero slides found in database.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm"
            >
              <Plus size={16} />
              <span>Create First Slide</span>
            </button>
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
                  className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
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
                            Title (EN)
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Media URL
                          </label>
                          <input
                            type="text"
                            value={editFormData.mediaUrl || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                mediaUrl: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Media Type
                          </label>
                          <select
                            value={editFormData.mediaType || "image"}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                mediaType: e.target.value as HeroMediaType,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="image">Image</option>
                            <option value="model3d">3D Model (Three.js)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Sort Order
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
                            className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
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

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!editFormData.isActive}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                isActive: e.target.checked,
                              })
                            }
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Active (Visible on homepage)</span>
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t">
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium"
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
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
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
                      placeholder="e.g. Rapid Prototyping"
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
                      placeholder="bijv. Snelle Prototyping"
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
                      placeholder="Short description highlighting turnaround, precision, etc."
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
                      placeholder="Nederlandse beschrijving..."
                      value={createSubtextNl}
                      onChange={(e) => setCreateSubtextNl(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Media URL *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="/uploads/hero/model.stl"
                      value={createMediaUrl}
                      onChange={(e) => setCreateMediaUrl(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Media Type
                    </label>
                    <select
                      value={createMediaType}
                      onChange={(e) =>
                        setCreateMediaType(e.target.value as HeroMediaType)
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="image">Image</option>
                      <option value="model3d">3D Model (Three.js)</option>
                    </select>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Instruction Tooltip (EN)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Drag to rotate 3D preview"
                      value={createInstructionTooltip}
                      onChange={(e) =>
                        setCreateInstructionTooltip(e.target.value)
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
                      placeholder="bijv. Sleep om 3D model te draaien"
                      value={createInstructionTooltipNl}
                      onChange={(e) =>
                        setCreateInstructionTooltipNl(e.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
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
                    className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm"
                  >
                    <Check size={16} />
                    <span>Create Slide</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
