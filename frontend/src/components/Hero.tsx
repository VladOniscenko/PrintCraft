import { Box, Clock, Leaf } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import QuickQuoteFlow from "./home/QuickQuoteFlow";

const HeroModelViewer = lazy(() => import("./HeroModelViewer"));

const heroModelLoaders = import.meta.glob("../assets/hero-models/*.stl", {
  import: "default",
  query: "?url",
}) as Record<string, () => Promise<unknown>>;

export default function Hero() {
  const { t } = useI18n();
  const [showViewer, setShowViewer] = useState(false);
  const [heroModelSrc, setHeroModelSrc] = useState("");

  useEffect(() => {
    const modelPaths = Object.keys(heroModelLoaders);
    if (modelPaths.length === 0) {
      setHeroModelSrc("");
      return;
    }

    const selectedPath =
      modelPaths[Math.floor(Math.random() * modelPaths.length)] ??
      modelPaths[0] ??
      "";

    const loadModel = heroModelLoaders[selectedPath];
    if (!loadModel) {
      setHeroModelSrc("");
      return;
    }

    let cancelled = false;
    loadModel()
      .then((resolved) => {
        if (cancelled) return;
        setHeroModelSrc(typeof resolved === "string" ? resolved : "");
      })
      .catch(() => {
        if (cancelled) return;
        setHeroModelSrc("");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const win = globalThis as any;
    const startViewer = () => setShowViewer(true);

    if (typeof win.requestIdleCallback === "function") {
      const idleId = win.requestIdleCallback(startViewer, {
        timeout: 500,
      });
      return () => win.cancelIdleCallback?.(idleId);
    }

    const timeoutId = win.setTimeout(startViewer, 180);
    return () => win.clearTimeout(timeoutId);
  }, []);

  return (
    <section className="rounded-[2rem] p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden bg-gradient-to-br from-[#12382b] via-[#0f5144] to-[#0a645e] shadow-[0_28px_50px_rgba(12,56,43,0.28)]">
      {/* Left Content */}
      <div className="lg:w-1/2 text-white z-10 space-y-8">
        <div className="space-y-4 max-w-xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
            {t("hero.titleLine1")}
            <br />
            {t("hero.titleLine2")}
          </h1>
          <p className="text-emerald-50/85 text-lg leading-relaxed max-w-md">
            {t("hero.description")}
          </p>
        </div>

        <QuickQuoteFlow />

        {/* Feature highlights: Fast turnaround, Quality print, Professional finishing */}
        <div className="flex flex-wrap gap-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-emerald-400" />
            <div>
              <p className="font-semibold text-sm">
                {t("hero.fastTurnaround")}
              </p>
              <p className="text-xs text-white/60">
                {t("hero.fastTurnaroundValue")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Box size={24} className="text-emerald-400" />
            <div>
              <p className="font-semibold text-sm">{t("hero.highQuality")}</p>
              <p className="text-xs text-white/60">
                {t("hero.highQualityValue")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Leaf size={24} className="text-emerald-400" />
            <div>
              <p className="font-semibold text-sm">{t("hero.eco")}</p>
              <p className="text-xs text-white/60">{t("hero.ecoValue")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Illustration */}
      <div className="lg:w-1/2 w-full h-[330px] sm:h-[380px] lg:h-[440px] relative z-10 flex justify-center items-center">
        <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] h-[72%] bg-emerald-300/20 rounded-full blur-3xl" />

        <div className="relative w-full h-full max-w-[580px]">
          {showViewer && heroModelSrc ? (
            <Suspense
              fallback={
                <div className="absolute z-30 left-1/2 -translate-x-1/2 bottom-[6%] w-[98%] h-[86%] flex items-center justify-center text-xs text-white/75">
                  Loading 3D model...
                </div>
              }
            >
              <HeroModelViewer src={heroModelSrc} />
            </Suspense>
          ) : (
            <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-[6%] w-[98%] h-[86%]" />
          )}
        </div>
      </div>
    </section>
  );
}
