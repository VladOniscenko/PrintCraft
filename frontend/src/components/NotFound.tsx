import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useI18n } from "../i18n/I18nContext";

const HeroModelViewer = lazy(() => import("./HeroModelViewer"));

const heroModelLoaders = import.meta.glob("../assets/hero-models/*.stl", {
  import: "default",
  query: "?url",
}) as Record<string, () => Promise<unknown>>;

export default function NotFound() {
  const { t, localizePath } = useI18n();
  const [modelSrc, setModelSrc] = useState("");

  useEffect(() => {
    const modelPaths = Object.keys(heroModelLoaders);
    if (modelPaths.length === 0) {
      setModelSrc("");
      return;
    }

    const selectedPath =
      modelPaths[Math.floor(Math.random() * modelPaths.length)] ??
      modelPaths[0] ??
      "";

    const loadModel = heroModelLoaders[selectedPath];
    if (!loadModel) {
      setModelSrc("");
      return;
    }

    let cancelled = false;
    loadModel()
      .then((resolved) => {
        if (cancelled) return;
        setModelSrc(typeof resolved === "string" ? resolved : "");
      })
      .catch(() => {
        if (cancelled) return;
        setModelSrc("");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="site-shell">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl py-10 lg:py-14">
        <section className="rounded-[2rem] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative overflow-hidden bg-gradient-to-br from-[#3b0a12] via-[#7a1124] to-[#d62839] shadow-[0_28px_50px_rgba(60,10,20,0.4)]">
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          <div className="space-y-5 text-white z-10">
            <p className="text-rose-100/80 text-sm font-bold tracking-[0.24em]">
              404
            </p>
            <h1 className="text-4xl sm:text-5xl font-black leading-[1.04] tracking-tight">
              {t("notFound.title")}
            </h1>
            <p className="text-rose-50/85 max-w-lg text-base sm:text-lg">
              {t("notFound.description")}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to={localizePath("/")} className="site-btn-primary gap-2">
                <Home size={18} />
                {t("notFound.backHome")}
              </Link>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
              >
                <ArrowLeft size={18} />
                {t("notFound.goBack")}
              </button>
            </div>
          </div>

          <div className="relative w-full h-[300px] sm:h-[360px] lg:h-[460px] z-10">
            <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[70%] bg-rose-400/20 rounded-full blur-3xl" />

            {modelSrc ? (
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-white/75">
                    {t("notFound.loadingModel")}
                  </div>
                }
              >
                <HeroModelViewer src={modelSrc} />
              </Suspense>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
                {t("notFound.loadingModel")}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
