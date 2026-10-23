import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileUp, Layers, Loader2, Truck, UploadCloud } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import api from "../../services/api";

const DRAFT_KEY = "printcraft-home-quote";

export default function HomeWorkflow() {
  const { t, localizePath } = useI18n();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const steps = [
    {
      num: "01",
      icon: UploadCloud,
      titleKey: "home.process.step1Title",
      descKey: "home.process.step1Desc",
    },
    {
      num: "02",
      icon: Layers,
      titleKey: "home.process.step2Title",
      descKey: "home.process.step2Desc",
    },
    {
      num: "03",
      icon: Truck,
      titleKey: "home.process.step3Title",
      descKey: "home.process.step3Desc",
    },
  ] as const;

  const handleFileSelect = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { detectModelDimensions } = await import(
        "../../utils/modelDimensions"
      );
      const [uploadResponse, dims] = await Promise.all([
        api.post("/upload", form),
        detectModelDimensions(file).catch(() => null),
      ]);
      const fileUrl = uploadResponse.data?.url;
      let quoteToken: string | undefined;
      try {
        const draftRes = await api.post("/quote-drafts", {
          fileUrl,
          fileName: file.name,
          description: "",
          material: "PLA",
        });
        quoteToken = draftRes.data?.quoteToken;
      } catch {
        // Fallback to local draft only
      }
      const draft = {
        fileUrl,
        fileName: file.name,
        material: "PLA",
        color: "Black",
        quoteToken,
        scaleFactor: 1.0,
        dimensionBaseX: dims?.x,
        dimensionBaseY: dims?.y,
        dimensionBaseZ: dims?.z,
        dimensionX: dims?.x,
        dimensionY: dims?.y,
        dimensionZ: dims?.z,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      navigate(localizePath("/checkout"));
    } catch {
      // If direct upload fails, navigate to checkout where user can retry
      navigate(localizePath("/checkout"));
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => {
    setDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  return (
    <section id="workflow" className="space-y-10 sm:space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
          {t("home.process.eyebrow")}
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-950 dark:text-white">
          {t("home.process.title")}
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {t("home.process.subtitle")}
        </p>
      </div>

      {/* 3 Large Apple-Style Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {steps.map(({ num, icon: Icon, titleKey, descKey }) => (
          <article
            key={titleKey}
            className="group relative flex flex-col justify-between p-8 rounded-3xl bg-gray-50/70 dark:bg-[#0e1512] border border-gray-100 dark:border-white/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-white dark:hover:bg-[#121c18] hover:shadow-xl transition-all duration-300"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-gray-600 dark:text-gray-400 font-mono group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
                  {num}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#141e1a] border border-gray-200/60 dark:border-white/10 shadow-sm flex items-center justify-center text-emerald-800 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-all">
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-950 dark:text-white tracking-tight">
                  {t(titleKey)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t(descKey)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Clean Drag-and-Drop Dropzone & CTA */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
          dragging
            ? "border-emerald-600 dark:border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30 scale-[1.01]"
            : "border-gray-200 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-400 bg-gray-50/50 dark:bg-[#0e1512]/60 hover:bg-emerald-50/15 dark:hover:bg-emerald-950/20"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".stl,.3mf,.step,.stp,.obj"
          aria-label={t("home.process.uploadCta")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileSelect(file);
          }}
        />

        <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#141e1a] border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center justify-center text-emerald-800 dark:text-emerald-400">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-emerald-800 dark:text-emerald-400" />
            ) : (
              <FileUp className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-gray-950 dark:text-white">
              {uploading
                ? t("home.process.analyzing")
                : t("home.process.dropTitle")}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {t("home.process.dropSubtitle")}
            </p>
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold bg-emerald-700 dark:bg-emerald-600 text-white hover:bg-emerald-800 dark:hover:bg-emerald-500 active:scale-95 transition-all shadow-md hover:shadow-emerald-700/20 cursor-pointer disabled:opacity-60"
          >
            <span>{t("home.process.uploadCta")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
