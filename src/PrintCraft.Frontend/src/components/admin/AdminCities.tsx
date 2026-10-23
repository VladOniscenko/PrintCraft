import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit2,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import {
  createCity,
  deleteCity,
  getCities,
  seedCities,
  updateCity,
} from "../../services/api";
import type { ManagedCity } from "../../types";
import { useNotify } from "../../context/NotifyContext";
import { useI18n } from "../../i18n/I18nContext";
import {
  supportedLanguages,
  type SupportedLanguage,
  defaultLanguage,
} from "../../i18n/translations";
import { getLocalizedText } from "../../utils/i18nHelpers";

export default function AdminCities() {
  const { t, language, localizePath } = useI18n();
  const { notifyError, notifySuccess } = useNotify();

  const [cities, setCities] = useState<ManagedCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");

  // Create / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<ManagedCity | null>(null);
  const [cityLangTab, setCityLangTab] = useState<SupportedLanguage>(defaultLanguage);
  const [slug, setSlug] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [province, setProvince] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete & Seed Modals state
  const [deleteTarget, setDeleteTarget] = useState<ManagedCity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadCities = async () => {
    setLoading(true);
    try {
      const data = await getCities(true);
      setCities(data);
    } catch {
      notifyError(t("admin.cities.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    cities.forEach((c) => {
      if (c.province) set.add(c.province);
    });
    return Array.from(set).sort();
  }, [cities]);

  const filteredCities = useMemo(() => {
    return cities.filter((city) => {
      if (selectedProvince !== "all" && city.province !== selectedProvince) {
        return false;
      }
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const name = getLocalizedText(city.names, language).toLowerCase();
      const slugMatch = city.slug.toLowerCase().includes(term);
      const provMatch = (city.province || "").toLowerCase().includes(term);
      return name.includes(term) || slugMatch || provMatch;
    });
  }, [cities, search, selectedProvince, language]);

  const openModal = (city?: ManagedCity) => {
    if (city) {
      setEditingCity(city);
      setSlug(city.slug);
      setNames({ ...(city.names || {}) });
      setProvince(city.province || "");
      setLatitude(city.latitude ?? undefined);
      setLongitude(city.longitude ?? undefined);
      setSortOrder(city.sortOrder || 0);
      setIsActive(city.isActive);
    } else {
      setEditingCity(null);
      setSlug("");
      setNames({});
      setProvince("Zuid-Holland");
      setLatitude(undefined);
      setLongitude(undefined);
      setSortOrder((cities.length + 1) * 10);
      setIsActive(true);
    }
    setCityLangTab(language);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!slug.trim()) {
      notifyError(t("admin.cities.saveFailed"));
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<ManagedCity> = {
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        names,
        province: province.trim(),
        latitude: latitude !== undefined ? Number(latitude) : null,
        longitude: longitude !== undefined ? Number(longitude) : null,
        sortOrder: Number(sortOrder),
        isActive,
      };

      if (editingCity) {
        await updateCity(editingCity.id, payload);
      } else {
        await createCity(payload);
      }
      notifySuccess(t("admin.cities.saveSuccess"));
      setIsModalOpen(false);
      await loadCities();
    } catch {
      notifyError(t("admin.cities.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (city: ManagedCity) => {
    try {
      await updateCity(city.id, { isActive: !city.isActive });
      setCities((prev) =>
        prev.map((c) => (c.id === city.id ? { ...c, isActive: !c.isActive } : c)),
      );
      notifySuccess(t("admin.cities.saveSuccess"));
    } catch {
      notifyError(t("admin.cities.saveFailed"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCity(deleteTarget.id);
      notifySuccess(t("admin.cities.deleteSuccess"));
      setDeleteTarget(null);
      await loadCities();
    } catch {
      notifyError(t("admin.cities.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedCities(true);
      notifySuccess(t("admin.cities.seedSuccess"));
      setSeedConfirmOpen(false);
      await loadCities();
    } catch {
      notifyError(t("admin.cities.seedFailed"));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AdminLayout wide>
      <AdminBreadcrumb
        title={t("admin.cities.title")}
        items={[
          { label: t("admin.nav.dashboard"), to: "/admin" },
          { label: t("admin.cities.title") },
        ]}
      />

      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#d8e6df]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-grow">
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.cities.searchPlaceholder")}
                className="site-input pl-10 pr-4 py-2 w-full text-sm rounded-xl"
              />
            </div>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="site-input px-3 py-2 text-sm rounded-xl shrink-0"
            >
              <option value="all">{t("admin.cities.filterProvince")}</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSeedConfirmOpen(true)}
              className="site-btn-soft px-3 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("admin.cities.seedDefaults")}</span>
            </button>
            <button
              onClick={() => openModal()}
              className="site-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{t("admin.cities.addCity")}</span>
            </button>
          </div>
        </div>

        {/* Cities Table */}
        {loading ? (
          <div className="p-12 text-center text-[#556b64] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span>{t("common.loading")}</span>
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="p-12 text-center text-[#68817a] site-card rounded-2xl">
            <MapPin className="w-10 h-10 mx-auto text-gray-400 mb-2 opacity-60" />
            <p className="font-semibold text-base">{t("admin.cities.emptyTitle")}</p>
          </div>
        ) : (
          <div className="site-card rounded-2xl overflow-hidden border border-[#d8e6df] dark:border-white/10 dark:bg-[#0e1512]">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-[#f4f9f6] dark:bg-white/5 text-[#283d36] dark:text-gray-200 font-bold text-xs uppercase tracking-wider border-b border-[#d8e6df] dark:border-white/10">
                <tr>
                  <th className="py-3 px-4">{t("admin.cities.colSlug")}</th>
                  <th className="py-3 px-4">{t("admin.cities.colName")}</th>
                  <th className="py-3 px-4">{t("admin.cities.colProvince")}</th>
                  <th className="py-3 px-4">{t("admin.cities.colGeo")}</th>
                  <th className="py-3 px-4 w-20 text-center">{t("admin.cities.colSort")}</th>
                  <th className="py-3 px-4 w-24 text-center">{t("admin.cities.colStatus")}</th>
                  <th className="py-3 px-4 w-28 text-right">{t("admin.cities.colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9f2ee] dark:divide-white/10">
                {filteredCities.map((city) => {
                  const cityName = getLocalizedText(city.names, language);

                  return (
                    <tr key={city.id} className="hover:bg-teal-50/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-teal-800 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200/50 dark:border-teal-800/40">
                          /3d-print-service/{city.slug}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#142621] dark:text-white">{cityName}</td>
                      <td className="py-3 px-4 text-xs text-[#526b64] dark:text-gray-400">{city.province}</td>
                      <td className="py-3 px-4 text-xs font-mono text-gray-500 dark:text-gray-400">
                        {city.latitude != null && city.longitude != null
                          ? `${city.latitude.toFixed(4)}, ${city.longitude.toFixed(4)}`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-gray-600 dark:text-gray-400">
                        {city.sortOrder}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(city)}
                          className={`px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                            city.isActive
                              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200"
                              : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {city.isActive
                            ? t("admin.cities.active")
                            : t("admin.cities.inactive")}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={localizePath(`/3d-print-service/${city.slug}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                            title={t("admin.cities.viewLive")}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => openModal(city)}
                            className="p-1.5 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-white/10 rounded-lg transition-colors"
                            title={t("admin.cities.edit")}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(city)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                            title={t("admin.cities.delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* CREATE / EDIT CITY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1512] border border-gray-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingCity
                  ? t("admin.cities.modalTitleEdit", {
                      name: getLocalizedText(editingCity.names, language),
                    })
                  : t("admin.cities.modalTitleNew")}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slug input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t("admin.cities.slugLabel")}
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-2 rounded-xl">
                  /3d-print-service/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={t("admin.cities.slugPlaceholder")}
                  className="site-input flex-grow px-3 py-2 text-sm rounded-xl font-mono"
                />
              </div>
            </div>

            {/* Language Switcher Tabs for City Name */}
            <div className="bg-[#f0f7f4] dark:bg-white/5 p-1.5 rounded-xl flex items-center gap-1 border border-gray-100 dark:border-white/10">
              <span className="text-xs font-semibold text-[#345148] dark:text-gray-300 px-2">
                {t("admin.cities.editingLanguage")}
              </span>
              {supportedLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setCityLangTab(lang)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    cityLangTab === lang
                      ? "bg-white dark:bg-teal-700 text-teal-800 dark:text-white shadow-xs"
                      : "text-[#4e6b62] dark:text-gray-400 hover:text-teal-900 dark:hover:text-white"
                  }`}
                >
                  {lang.toUpperCase()}
                  {names[lang]?.trim() && (
                    <Check className="w-3 h-3 inline ml-1 text-emerald-600 dark:text-emerald-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Multilingual City Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t("admin.cities.nameLabel")} ({cityLangTab.toUpperCase()})
              </label>
              <input
                type="text"
                value={names[cityLangTab] || ""}
                onChange={(e) => setNames({ ...names, [cityLangTab]: e.target.value })}
                className="site-input w-full px-3 py-2 text-sm rounded-xl"
              />
            </div>

            {/* Province */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t("admin.cities.provinceLabel")}
              </label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="site-input w-full px-3 py-2 text-sm rounded-xl"
              />
            </div>

            {/* Latitude and Longitude */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.cities.latLabel")}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude ?? ""}
                  onChange={(e) =>
                    setLatitude(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="52.3676"
                  className="site-input w-full px-3 py-2 text-sm rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.cities.lngLabel")}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude ?? ""}
                  onChange={(e) =>
                    setLongitude(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="4.9041"
                  className="site-input w-full px-3 py-2 text-sm rounded-xl font-mono"
                />
              </div>
            </div>

            {/* Sort order and Active */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t("admin.cities.sortOrderLabel")}
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="site-input w-full px-3 py-2 text-sm rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="cityIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <label htmlFor="cityIsActive" className="text-xs font-bold text-gray-800">
                  {t("admin.cities.isActiveLabel")}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="site-btn-soft px-4 py-2 text-xs font-semibold"
              >
                {t("admin.cities.cancel")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="site-btn-primary px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{saving ? t("admin.cities.saving") : t("admin.cities.save")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1512] border border-gray-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("admin.cities.deleteConfirmTitle")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("admin.cities.deleteConfirmMessage")}
            </p>
            <p className="text-xs font-semibold text-teal-900 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-100 dark:border-teal-800/40 font-mono">
              /3d-print-service/{deleteTarget.slug}
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
              <button
                onClick={() => setDeleteTarget(null)}
                className="site-btn-soft px-4 py-2 text-xs font-semibold"
              >
                {t("admin.cities.cancel")}
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl inline-flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? t("admin.cities.deleting") : t("admin.cities.delete")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SEED MODAL */}
      {seedConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0e1512] border border-gray-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("admin.cities.seedConfirmTitle")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("admin.cities.seedConfirmMessage")}
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
              <button
                onClick={() => setSeedConfirmOpen(false)}
                className="site-btn-soft px-4 py-2 text-xs font-semibold"
              >
                {t("admin.cities.cancel")}
              </button>
              <button
                disabled={seeding}
                onClick={handleSeed}
                className="site-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
              >
                {seeding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t("admin.cities.seedDefaults")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
