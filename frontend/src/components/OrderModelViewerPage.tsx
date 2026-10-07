import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { Order, OrderItem } from "../types";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AdminLayout from "./admin/AdminLayout";
import AdminBreadcrumb from "./admin/AdminBreadcrumb";
import { resolveAssetUrl } from "../utils/assetUrl";
import { useI18n } from "../i18n/I18nContext";

const Interactive3DViewer = lazy(() => import("./Interactive3DViewer"));

type ViewerMode = "user" | "admin";

function getFileExtension(fileUrl?: string): string {
  if (!fileUrl) return "";
  const clean = fileUrl.split("?")[0] ?? fileUrl;
  const parts = clean.split(".");
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

function isImageExtension(ext: string): boolean {
  return ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
}

export default function OrderModelViewerPage({ mode }: { mode: ViewerMode }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id, itemIndex } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const parsedItemIndex = Number.parseInt(itemIndex ?? "", 10);
  const selectedItem = useMemo<OrderItem | null>(() => {
    if (!order || Number.isNaN(parsedItemIndex)) return null;
    if (parsedItemIndex < 0 || parsedItemIndex >= order.items.length)
      return null;
    return order.items[parsedItemIndex] ?? null;
  }, [order, parsedItemIndex]);

  const itemFiles = useMemo(() => {
    if (!selectedItem)
      return [] as Array<{ url: string; name: string; kind?: string }>;

    const fromFiles = (selectedItem.files || []).filter((file) => !!file?.url);
    const fromAttachments = (selectedItem.attachments || [])
      .filter((file) => !!file?.url)
      .map((file) => ({
        url: file.url,
        name: file.name || t("modelViewer.unnamed"),
        kind: file.kind,
      }));

    const merged = [...fromFiles];
    for (const file of fromAttachments) {
      if (!merged.some((f) => f.url === file.url)) {
        merged.push(file);
      }
    }

    if (
      selectedItem.fileUrl &&
      !merged.some((f) => f.url === selectedItem.fileUrl)
    ) {
      merged.push({
        url: selectedItem.fileUrl,
        name: selectedItem.fileName || t("modelViewer.unnamed"),
        kind: "model",
      });
    }

    if (
      selectedItem.imageUrl &&
      !merged.some((f) => f.url === selectedItem.imageUrl)
    ) {
      merged.push({
        url: selectedItem.imageUrl,
        name: "image",
        kind: "image",
      });
    }

    return merged;
  }, [selectedItem, t]);

  const requestedFileIndex = Number.parseInt(
    searchParams.get("file") ?? "",
    10,
  );
  const selectedFileIndex = Number.isNaN(requestedFileIndex)
    ? 0
    : Math.min(
        Math.max(requestedFileIndex, 0),
        Math.max(itemFiles.length - 1, 0),
      );
  const selectedFile = itemFiles[selectedFileIndex] ?? null;

  const modelUrl = resolveAssetUrl(selectedFile?.url || selectedItem?.fileUrl);
  const modelExt = getFileExtension(selectedFile?.url || selectedItem?.fileUrl);
  const canPreview3d =
    ["stl", "obj", "3mf"].includes(modelExt) && !!modelUrl;
  const canPreviewImage = isImageExtension(modelExt) && !!modelUrl;

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError(t("modelViewer.notFound"));
        setLoading(false);
        return;
      }

      try {
        const endpoint =
          mode === "admin" ? `/admin/orders/${id}` : `/orders/${id}`;
        const response = await api.get<Order>(endpoint);
        setOrder(response.data);
      } catch {
        setError(t("modelViewer.notFound"));
      } finally {
        setLoading(false);
      }
    };

    void fetchOrder();
  }, [id, mode, t]);

  const backPath = mode === "admin" ? `/admin/orders/${id}` : `/orders/${id}`;

  const content = (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d8e6df] bg-white px-4 py-2 text-sm font-semibold text-[#27443c] hover:bg-[#f3faf7]"
        >
          <ArrowLeft size={16} /> {t("modelViewer.backToOrder")}
        </button>

        {modelUrl ? (
          <a
            href={modelUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#cfe2da] bg-white px-4 py-2 text-sm font-semibold text-[#12594d] hover:bg-[#ecf7f3]"
          >
            <Download size={16} /> {t("modelViewer.download")}
          </a>
        ) : null}
      </div>

      {loading ? (
        <section className="rounded-3xl border border-[#dbe8e2] bg-white px-6 py-20 text-center text-[#5f756e]">
          {t("modelViewer.loading")}
        </section>
      ) : error || !selectedItem ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-16 text-center text-rose-700">
          {error || t("modelViewer.notFound")}
        </section>
      ) : (
        <section className="rounded-[2rem] p-6 lg:p-10 relative overflow-hidden bg-gradient-to-br from-[#12382b] via-[#0f5144] to-[#0a645e] shadow-[0_28px_50px_rgba(12,56,43,0.28)]">
          <div className="mb-6">
            <p className="text-emerald-100/85 text-sm uppercase tracking-[0.18em]">
              {t("modelViewer.orderItem")} #{parsedItemIndex + 1}
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight break-all">
              {selectedFile?.name ||
                selectedItem.fileName ||
                t("modelViewer.unnamed")}
            </h1>
            <p className="mt-2 text-emerald-50/85 text-sm">
              {selectedItem.material} · {selectedItem.color} · x
              {selectedItem.count || 1}
            </p>
          </div>

          {itemFiles.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {itemFiles.map((file, index) => {
                const isActive = index === selectedFileIndex;
                return (
                  <Link
                    key={`${file.url}-${index}`}
                    to={`${mode === "admin" ? `/admin/orders/${id}/models/${parsedItemIndex}` : `/orders/${id}/models/${parsedItemIndex}`}?file=${index}`}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                      isActive
                        ? "border-white/60 bg-white/20 text-white"
                        : "border-white/20 bg-white/5 text-emerald-50/90 hover:bg-white/15"
                    }`}
                  >
                    {file.name || t("modelViewer.unnamed")}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="relative w-full min-h-[460px] sm:min-h-[560px] rounded-2xl border border-white/15 bg-[#0e3128]/35 backdrop-blur-sm overflow-hidden flex flex-col">
            {canPreview3d ? (
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-white/75">
                    {t("modelViewer.loading")}
                  </div>
                }
              >
                <Interactive3DViewer
                  fileUrl={modelUrl}
                  fileName={
                    selectedFile?.name ||
                    selectedItem.fileName ||
                    `model.${modelExt}`
                  }
                  colorName={selectedItem.color || "Black"}
                  materialName={selectedItem.material || "PLA"}
                  scaleFactor={selectedItem.scaleFactor ?? 1.0}
                  count={selectedItem.count || 1}
                  className="w-full flex-1 border-0 rounded-none bg-transparent"
                />
              </Suspense>
            ) : canPreviewImage ? (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <img
                  src={modelUrl}
                  alt={selectedFile?.name || t("modelViewer.unnamed")}
                  className="max-h-full max-w-full rounded-xl object-contain"
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-white/85">
                <p className="text-lg font-semibold">
                  {t("modelViewer.previewUnavailable")}
                </p>
                <p className="mt-2 text-sm text-emerald-50/80">
                  {t("modelViewer.previewUnavailableHint")}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );

  if (mode === "admin") {
    return (
      <AdminLayout>
        <AdminBreadcrumb
          title={t("modelViewer.title")}
          items={[
            { label: t("breadcrumb.admin"), to: "/admin" },
            { label: t("breadcrumb.orders"), to: "/admin/orders" },
            {
              label: order?.id
                ? order.id.slice(0, 8)
                : t("admin.order.loading"),
              to: backPath,
            },
            { label: t("modelViewer.title") },
          ]}
        />
        {content}
      </AdminLayout>
    );
  }

  return (
    <div className="site-shell">
      <Navbar />
      {content}
      <Footer />
    </div>
  );
}
