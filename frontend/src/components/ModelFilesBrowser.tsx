import { useEffect, useMemo, useState } from "react";
import { Boxes, ExternalLink, RefreshCcw, Search } from "lucide-react";
import { Link } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout";
import AdminBreadcrumb from "./admin/AdminBreadcrumb";
import api from "../services/api";
import { useI18n } from "../i18n/I18nContext";
import { resolveAssetUrl } from "../utils/assetUrl";

type ModelFile = {
  fileName: string;
  extension: string;
  sizeBytes: number;
  lastModifiedUtc: string;
  url: string;
  orderId?: string | null;
  itemIndex?: number | null;
  linkedToOrder?: boolean;
  linkedToActiveOrder?: boolean;
  canDelete?: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ModelFilesBrowser() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<ModelFile[]>([]);
  const [deletingFileName, setDeletingFileName] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ModelFile[]>("/upload/models");
      setFiles(response.data ?? []);
    } catch {
      setError(t("models.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFiles();
  }, []);

  const deleteFile = async (file: ModelFile) => {
    const canDelete = file.canDelete ?? false;
    if (!canDelete) return;

    const confirmed = window.confirm(t("models.deleteConfirm"));
    if (!confirmed) return;

    setDeletingFileName(file.fileName);
    setError(null);

    try {
      await api.delete("/upload/models", {
        params: { fileName: file.fileName },
      });
      await fetchFiles();
    } catch (err: any) {
      const message = err?.response?.data?.message || t("models.deleteFailed");
      setError(message);
    } finally {
      setDeletingFileName(null);
    }
  };

  const visibleFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return files;

    return files.filter(
      (file) =>
        file.fileName.toLowerCase().includes(normalized) ||
        file.extension.toLowerCase().includes(normalized),
    );
  }, [files, query]);

  return (
    <AdminLayout>
      <AdminBreadcrumb
        title={t("models.title")}
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: t("breadcrumb.orders"), to: "/admin/orders" },
          { label: t("models.title") },
        ]}
      />

      <main className="max-w-7xl px-4 sm:px-6 py-2">
        <section className="rounded-3xl border border-[#dbe8e2] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="site-heading text-3xl font-bold tracking-tight text-[#173028]">
                {t("models.title")}
              </h1>
              <p className="site-subheading mt-2 text-[#56736a]">
                {t("models.subtitle")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => void fetchFiles()}
                className="site-btn-soft inline-flex items-center gap-2"
                type="button"
              >
                <RefreshCcw size={16} /> {t("models.refresh")}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full md:max-w-sm">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6e8780]"
              />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-xl border border-[#d5e3dc] bg-[#f9fcfb] py-2.5 pl-9 pr-3 text-sm outline-none ring-0 transition focus:border-[#18907f]"
                placeholder={t("models.searchPlaceholder")}
              />
            </label>

            <div className="text-sm text-[#5f756e]">
              {t("models.count")}:{" "}
              <span className="font-semibold">{visibleFiles.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#5e746d]">
              {t("models.loading")}
            </div>
          ) : error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          ) : visibleFiles.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-[#cfded7] bg-[#f8fbfa] p-12 text-center text-[#4e6660]">
              <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#2f5a4f]">
                <Boxes size={22} />
              </div>
              <p className="font-semibold">{t("models.empty")}</p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-[#deebe5]">
              <table className="min-w-full divide-y divide-[#e7f0ec] text-sm">
                <thead className="bg-[#f7fbf9]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-[#23423a]">
                      {t("models.table.file")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-[#23423a]">
                      {t("models.table.type")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-[#23423a]">
                      {t("models.table.size")}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-[#23423a]">
                      {t("models.table.updated")}
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-[#23423a]">
                      {t("models.table.action")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef4f1] bg-white">
                  {visibleFiles.map((file) => (
                    <tr key={file.fileName} className="hover:bg-[#fbfefd]">
                      <td className="px-4 py-3 font-medium text-[#223d36]">
                        {file.fileName}
                      </td>
                      <td className="px-4 py-3 text-[#4f6a63]">
                        {file.extension}
                      </td>
                      <td className="px-4 py-3 text-[#4f6a63]">
                        {formatBytes(file.sizeBytes)}
                      </td>
                      <td className="px-4 py-3 text-[#4f6a63]">
                        {new Date(file.lastModifiedUtc).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          {file.orderId ? (
                            <Link
                              to={`/admin/orders/${file.orderId}`}
                              className="inline-flex items-center rounded-lg border border-[#d8e6df] px-3 py-1.5 font-semibold text-[#21453d] hover:bg-[#f2f9f6]"
                            >
                              {t("models.order")}
                            </Link>
                          ) : null}

                          {file.fileName ? (
                            <Link
                              to={`/admin/models/view/${encodeURIComponent(file.fileName)}`}
                              className="inline-flex items-center rounded-lg border border-[#cfd9ff] px-3 py-1.5 font-semibold text-[#3048a0] hover:bg-[#eef1ff]"
                            >
                              {file.extension === ".png" ||
                              file.extension === ".jpg" ||
                              file.extension === ".jpeg" ||
                              file.extension === ".webp" ||
                              file.extension === ".gif"
                                ? t("models.viewImage")
                                : t("models.view3d")}
                            </Link>
                          ) : null}

                          <a
                            href={resolveAssetUrl(file.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#cfe2da] px-3 py-1.5 font-semibold text-[#165f52] hover:bg-[#ecf7f3]"
                          >
                            {t("models.open")}
                            <ExternalLink size={14} />
                          </a>

                          <button
                            type="button"
                            onClick={() => void deleteFile(file)}
                            disabled={
                              !(file.canDelete ?? false) ||
                              deletingFileName === file.fileName
                            }
                            title={
                              file.canDelete
                                ? t("models.delete")
                                : t("models.deleteBlocked")
                            }
                            className="inline-flex items-center rounded-lg border border-red-200 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent"
                          >
                            {deletingFileName === file.fileName
                              ? t("models.deleting")
                              : t("models.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </AdminLayout>
  );
}
