import { useEffect, useState } from "react";
import AdminBreadcrumb from "./AdminBreadcrumb";
import AdminLayout from "./AdminLayout";
import api from "../../services/api";
import type { Filament } from "../../types";
import { useNotify } from "../../context/NotifyContext";
import { useI18n } from "../../i18n/I18nContext";
import axios from "axios";

export default function AdminFilaments() {
  const { notifyError, notifySuccess } = useNotify();
  const { t } = useI18n();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nameEdits, setNameEdits] = useState<Record<string, string>>({});
  const [materialEdits, setMaterialEdits] = useState<Record<string, string>>(
    {},
  );
  const [colorEdits, setColorEdits] = useState<Record<string, string>>({});
  const [priceEdits, setPriceEdits] = useState<Record<string, number>>({});
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});

  const [name, setName] = useState("");
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [pricePerGram, setPricePerGram] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [description, setDescription] = useState("");

  const fetchFilaments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/filaments");
      const nextFilaments = Array.isArray(res.data) ? res.data : [];
      setFilaments(nextFilaments);

      const nextPriceEdits: Record<string, number> = {};
      const nextStockEdits: Record<string, number> = {};
      const nextNameEdits: Record<string, string> = {};
      const nextMaterialEdits: Record<string, string> = {};
      const nextColorEdits: Record<string, string> = {};
      nextFilaments.forEach((f: Filament) => {
        nextPriceEdits[f.id] = f.pricePerGram;
        nextStockEdits[f.id] = f.stockQuantity ?? 0;
        nextNameEdits[f.id] = f.name;
        nextMaterialEdits[f.id] = f.material;
        nextColorEdits[f.id] = f.color;
      });
      setNameEdits(nextNameEdits);
      setMaterialEdits(nextMaterialEdits);
      setColorEdits(nextColorEdits);
      setPriceEdits(nextPriceEdits);
      setStockEdits(nextStockEdits);
    } catch (err) {
      console.error(err);
      notifyError(t("admin.filaments.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilaments();
  }, []);

  const addFilament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/filaments", {
        name,
        material,
        color,
        pricePerGram,
        stockQuantity,
        description,
      });

      setName("");
      setMaterial("");
      setColor("");
      setPricePerGram(0);
      setStockQuantity(0);
      setDescription("");
      fetchFilaments();
      notifySuccess(t("admin.filaments.added"));
    } catch (err) {
      console.error(err);
      notifyError(t("admin.filaments.createFailed"));
    }
  };

  const updateFilament = async (id: string) => {
    const nextName = (nameEdits[id] ?? "").trim();
    const nextMaterial = (materialEdits[id] ?? "").trim();
    const nextColor = (colorEdits[id] ?? "").trim();
    const nextPrice = priceEdits[id] ?? 0;
    const nextStock = stockEdits[id] ?? 0;

    if (!nextName || !nextMaterial || !nextColor) {
      notifyError(t("admin.filaments.requiredFields"));
      return;
    }

    if (nextPrice < 0 || nextStock < 0) {
      notifyError(t("admin.filaments.priceStockNegative"));
      return;
    }

    const previous = filaments.find((f) => f.id === id);
    if (!previous) {
      notifyError(t("admin.filaments.notFound"));
      return;
    }

    // Optimistic row update for snappy admin UX.
    setFilaments((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              name: nextName,
              material: nextMaterial,
              color: nextColor,
              pricePerGram: nextPrice,
              stockQuantity: nextStock,
            }
          : f,
      ),
    );

    setSavingId(id);
    try {
      await api.put(`/filaments/${id}`, {
        name: nextName,
        material: nextMaterial,
        color: nextColor,
        pricePerGram: nextPrice,
        stockQuantity: nextStock,
      });
      notifySuccess(t("admin.filaments.updated"));
    } catch (err) {
      console.error(err);
      // Rollback on failure.
      setFilaments((prev) => prev.map((f) => (f.id === id ? previous : f)));
      setNameEdits((prev) => ({ ...prev, [id]: previous.name }));
      setMaterialEdits((prev) => ({ ...prev, [id]: previous.material }));
      setColorEdits((prev) => ({ ...prev, [id]: previous.color }));
      setPriceEdits((prev) => ({ ...prev, [id]: previous.pricePerGram }));
      setStockEdits((prev) => ({ ...prev, [id]: previous.stockQuantity ?? 0 }));

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          notifyError(t("admin.filaments.updateAuthError"));
        } else if (err.response?.status === 404) {
          notifyError(t("admin.filaments.notFoundServer"));
        } else {
          notifyError(t("admin.filaments.updateFailed"));
        }
      } else {
        notifyError(t("admin.filaments.updateFailed"));
      }
    } finally {
      setSavingId(null);
    }
  };

  const deleteFilament = async (id: string) => {
    if (!confirm(t("admin.filaments.confirmDelete"))) return;

    const previous = filaments;

    // Optimistic removal.
    setFilaments((prev) => prev.filter((f) => f.id !== id));
    setNameEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setMaterialEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setColorEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPriceEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setStockEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setDeletingId(id);
    try {
      await api.delete(`/filaments/${id}`);
      notifySuccess(t("admin.filaments.deleted"));
    } catch (err) {
      console.error(err);
      // Rollback on failure.
      setFilaments(previous);
      const nextNameEdits: Record<string, string> = {};
      const nextMaterialEdits: Record<string, string> = {};
      const nextColorEdits: Record<string, string> = {};
      const nextPriceEdits: Record<string, number> = {};
      const nextStockEdits: Record<string, number> = {};
      previous.forEach((f) => {
        nextNameEdits[f.id] = f.name;
        nextMaterialEdits[f.id] = f.material;
        nextColorEdits[f.id] = f.color;
        nextPriceEdits[f.id] = f.pricePerGram;
        nextStockEdits[f.id] = f.stockQuantity ?? 0;
      });
      setNameEdits(nextNameEdits);
      setMaterialEdits(nextMaterialEdits);
      setColorEdits(nextColorEdits);
      setPriceEdits(nextPriceEdits);
      setStockEdits(nextStockEdits);

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          notifyError(t("admin.filaments.deleteAuthError"));
        } else if (err.response?.status === 404) {
          notifyError(t("admin.filaments.notFoundServer"));
        } else {
          notifyError(t("admin.filaments.deleteFailed"));
        }
      } else {
        notifyError(t("admin.filaments.deleteFailed"));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <AdminBreadcrumb
        title={t("admin.filaments.managementTitle")}
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: t("admin.nav.filaments") },
        ]}
      />

      <form
        onSubmit={addFilament}
        className="admin-panel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8 p-4"
      >
        <label className="admin-label">
          <span className="font-semibold">
            {t("admin.filaments.nameLabel")}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t("admin.filaments.namePlaceholder")}
            className="admin-field"
          />
        </label>
        <label className="admin-label">
          <span className="font-semibold">
            {t("admin.filaments.materialLabel")}
          </span>
          <input
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            required
            placeholder={t("admin.filaments.materialPlaceholder")}
            className="admin-field"
          />
        </label>
        <label className="admin-label">
          <span className="font-semibold">
            {t("admin.filaments.colorLabel")}
          </span>
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            required
            placeholder={t("admin.filaments.colorPlaceholder")}
            className="admin-field"
          />
        </label>
        <label className="admin-label">
          <span className="font-semibold">
            {t("admin.filaments.priceLabel")}
          </span>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={pricePerGram}
            onChange={(e) => setPricePerGram(parseFloat(e.target.value) || 0)}
            required
            placeholder={t("admin.filaments.pricePlaceholder")}
            className="admin-field"
          />
        </label>
        <label className="admin-label">
          <span className="font-semibold">
            {t("admin.filaments.stockLabel")}
          </span>
          <input
            type="number"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
            required
            placeholder={t("admin.filaments.stockPlaceholder")}
            className="admin-field"
          />
        </label>
        <button type="submit" className="admin-btn admin-btn-primary">
          {t("admin.filaments.addButton")}
        </button>

        <label className="admin-label col-span-full">
          <span className="font-semibold">
            {t("admin.filaments.descriptionLabel")}
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("admin.filaments.descriptionPlaceholder")}
            className="admin-textarea"
            rows={3}
          />
        </label>
      </form>

      {loading ? (
        <p className="admin-note">{t("admin.filaments.loadingMessage")}</p>
      ) : (
        <div className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.filaments.tableName")}</th>
                <th>{t("admin.filaments.tableMaterial")}</th>
                <th>{t("admin.filaments.tableColor")}</th>
                <th>{t("admin.filaments.tablePrice")}</th>
                <th>{t("admin.filaments.tableStock")}</th>
                <th>{t("admin.filaments.tableActions")}</th>
              </tr>
            </thead>
            <tbody>
              {filaments.map((f) => (
                <tr key={f.id}>
                  <td>
                    <input
                      type="text"
                      className="admin-field"
                      value={nameEdits[f.id] ?? ""}
                      onChange={(e) =>
                        setNameEdits((prev) => ({
                          ...prev,
                          [f.id]: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="admin-field"
                      value={materialEdits[f.id] ?? ""}
                      onChange={(e) =>
                        setMaterialEdits((prev) => ({
                          ...prev,
                          [f.id]: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="admin-field"
                      value={colorEdits[f.id] ?? ""}
                      onChange={(e) =>
                        setColorEdits((prev) => ({
                          ...prev,
                          [f.id]: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      className="admin-field w-28"
                      value={priceEdits[f.id] ?? 0}
                      onChange={(e) =>
                        setPriceEdits((prev) => ({
                          ...prev,
                          [f.id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="admin-field w-24"
                      value={stockEdits[f.id] ?? 0}
                      onChange={(e) =>
                        setStockEdits((prev) => ({
                          ...prev,
                          [f.id]: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateFilament(f.id)}
                        disabled={savingId === f.id || deletingId === f.id}
                        className="admin-btn admin-btn-primary"
                      >
                        {savingId === f.id
                          ? t("admin.order.savingButton")
                          : t("admin.orderDetail.saveButton")}
                      </button>
                      <button
                        onClick={() => deleteFilament(f.id)}
                        disabled={savingId === f.id || deletingId === f.id}
                        className="admin-btn admin-btn-danger"
                      >
                        {deletingId === f.id
                          ? t("admin.filaments.deleting")
                          : t("admin.filaments.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
