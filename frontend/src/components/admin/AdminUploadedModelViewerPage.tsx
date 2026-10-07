import { lazy, Suspense, useMemo } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import AdminBreadcrumb from "./AdminBreadcrumb";
import { useI18n } from "../../i18n/I18nContext";
import { resolveAssetUrl } from "../../utils/assetUrl";

const Interactive3DViewer = lazy(() => import("../Interactive3DViewer"));

function getFileExtension(fileName: string): string {
  const clean = fileName.split("?")[0] ?? fileName;
  const parts = clean.split(".");
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

function isImageExtension(ext: string): boolean {
  return ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
}

export default function AdminUploadedModelViewerPage() {
  const { t } = useI18n();
  const { fileName } = useParams<{ fileName: string }>();

  const decodedFileName = useMemo(() => {
    const raw = fileName ?? "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [fileName]);

  const safeFileName =
    decodedFileName.replace(/\\/g, "/").split("/").pop() ?? "";
  const modelUrl = safeFileName
    ? resolveAssetUrl(`/uploads/${safeFileName}`)
    : "";
  const modelExt = getFileExtension(safeFileName);
  const canPreview3d =
    ["stl", "obj", "3mf"].includes(modelExt) && !!modelUrl;
  const canPreviewImage = isImageExtension(modelExt) && !!modelUrl;

  return (
    <AdminLayout>
      <AdminBreadcrumb
        title={t("modelViewer.title")}
        items={[
          { label: t("breadcrumb.admin"), to: "/admin" },
          { label: t("models.title"), to: "/admin/models" },
          { label: t("modelViewer.title") },
        ]}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            to="/admin/models"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8e6df] bg-white px-4 py-2 text-sm font-semibold text-[#27443c] hover:bg-[#f3faf7]"
          >
            <ArrowLeft size={16} /> {t("models.backToFiles")}
          </Link>

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

        {!safeFileName ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-16 text-center text-rose-700">
            {t("modelViewer.notFound")}
          </section>
        ) : (
          <section className="rounded-[2rem] p-6 lg:p-10 relative overflow-hidden bg-gradient-to-br from-[#12382b] via-[#0f5144] to-[#0a645e] shadow-[0_28px_50px_rgba(12,56,43,0.28)]">
            <div className="mb-6">
              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight break-all">
                {safeFileName}
              </h1>
            </div>

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
                    fileName={safeFileName}
                    className="w-full flex-1 border-0 rounded-none bg-transparent"
                  />
                </Suspense>
              ) : canPreviewImage ? (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <img
                    src={modelUrl}
                    alt={safeFileName}
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
    </AdminLayout>
  );
}
