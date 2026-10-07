import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Tag,
} from "lucide-react";
import { getActiveHeroSlides } from "../services/api";
import type { HeroSlide } from "../types";
import { resolveAssetUrl } from "../utils/assetUrl";
import { useI18n } from "../i18n/I18nContext";

const HeroModelViewer = lazy(() => import("./HeroModelViewer"));

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: "fallback-slide-1",
    title: "Rapid Prototyping & Custom Parts",
    titleNl: "Snelle Prototyping & Maatwerk Onderdelen",
    subtext:
      "High-precision FDM 3D printing for functional prototypes, replacement parts, and custom enclosures in 2-5 working days.",
    subtextNl:
      "Precisie FDM 3D-printen voor functionele prototypes, vervangende onderdelen en behuizingen binnen 2-5 werkdagen.",
    priceText: "Starting from €9.95",
    priceTextNl: "Vanaf €9,95",
    mediaUrl: "/uploads/hero/cable-holder.stl",
    mediaType: "model3d",
    instructionTooltip:
      "Interactive 3D model: drag to rotate 360°, scroll to zoom in and inspect geometry.",
    instructionTooltipNl:
      "Interactief 3D-model: sleep om 360° te draaien, scroll om in te zoomen op details.",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "fallback-slide-2",
    title: "Engineering Grade Materials",
    titleNl: "Technische Kwaliteitsmaterialen",
    subtext:
      "Durable PETG, heat-resistant ABS, ultra-tough Carbon Fiber, and flexible TPU engineered for real-world demands.",
    subtextNl:
      "Duurzaam PETG, hittebestendig ABS, oersterk Carbon Fiber en flexibel TPU voor zware toepassingen.",
    priceText: "From €0.08 / gram",
    priceTextNl: "Vanaf €0,08 / gram",
    mediaUrl: "/uploads/hero/materials.svg",
    mediaType: "image",
    instructionTooltip:
      "Available in 12+ vibrant colors, food-safe filaments, and specialty carbon fiber composites.",
    instructionTooltipNl:
      "Beschikbaar in 12+ kleuren, voedselveilige filamenten en carbon-composieten.",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "fallback-slide-3",
    title: "Detailed Figurines & Art Collectibles",
    titleNl: "Gedetailleerde Figuren & Kunstobjecten",
    subtext:
      "Ultra-fine 0.12mm layer height reproducing intricate curves, character meshes, and miniatures with silky smoothness.",
    subtextNl:
      "Fijne 0.12mm laaghoogte voor vloeiende rondingen, miniaturen en artistieke modellen met hoge precisie.",
    priceText: "Starting at €14.50",
    priceTextNl: "Vanaf €14,50",
    mediaUrl: "/uploads/hero/dino.stl",
    mediaType: "model3d",
    instructionTooltip:
      "Rotate the model to check fine organic curves and surface layer fidelity.",
    instructionTooltipNl:
      "Draai het model om organische vormen en oppervlaktekwaliteit te inspecteren.",
    isActive: true,
    sortOrder: 3,
  },
];

const AUTOPLAY_INTERVAL_MS = 5000;

export default function Hero() {
  const { t, language } = useI18n();
  const [slides, setSlides] = useState<HeroSlide[]>(FALLBACK_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const timerRef = useRef<number | null>(null);

  const isNl = language === "nl";

  // Fetch active slides from .NET API
  useEffect(() => {
    let active = true;

    async function loadSlides() {
      try {
        const data = await getActiveHeroSlides();
        if (active && Array.isArray(data) && data.length > 0) {
          setSlides(data);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.warn("Could not load dynamic hero slides from API, using fallback slides:", err);
      }
    }

    loadSlides();

    return () => {
      active = false;
    };
  }, []);

  const totalSlides = slides.length;
  const currentSlide = slides[currentIndex] || slides[0] || FALLBACK_SLIDES[0];

  const slideTitle =
    isNl && currentSlide.titleNl?.trim()
      ? currentSlide.titleNl
      : currentSlide.title;
  const slideSubtext =
    isNl && currentSlide.subtextNl?.trim()
      ? currentSlide.subtextNl
      : currentSlide.subtext;
  const slidePrice =
    isNl && currentSlide.priceTextNl?.trim()
      ? currentSlide.priceTextNl
      : currentSlide.priceText;
  const slideTooltip =
    isNl && currentSlide.instructionTooltipNl?.trim()
      ? currentSlide.instructionTooltipNl
      : currentSlide.instructionTooltip;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (totalSlides > 0 ? (prev + 1) % totalSlides : 0));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) =>
      totalSlides > 0 ? (prev - 1 + totalSlides) % totalSlides : 0,
    );
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-play (5-second intervals)
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, nextSlide, totalSlides, currentIndex]);

  const handleInteractionStart = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <section
      aria-label="Promotional slideshow"
      className="relative w-full rounded-[2.2rem] overflow-hidden bg-gradient-to-br from-[#061e16] via-[#0b3326] to-[#041611] border border-emerald-500/25 shadow-[0_28px_60px_-15px_rgba(4,22,17,0.7)] text-white transition-all"
    >
      {/* Background Accent Gradients & Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[70%] bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Split Layout Container */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center p-6 sm:p-10 lg:p-14">
        {/* ================= LEFT SIDE: Text, Price, Tooltip, Actions ================= */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          {/* Top Tag & Indicator */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isNl ? "Uitgelichte prints" : "Promotional Showcase"}</span>
            </span>
            <span className="text-xs font-mono text-emerald-200/60 tracking-wider">
              {String(currentIndex + 1).padStart(2, "0")} /{" "}
              {String(totalSlides).padStart(2, "0")}
            </span>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] text-white">
              {slideTitle}
            </h1>
            <p className="text-base sm:text-lg text-emerald-50/80 leading-relaxed max-w-xl font-normal">
              {slideSubtext}
            </p>
          </div>

          {/* Price & Instruction Tooltip Accents */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
            {/* Price Badge */}
            {slidePrice ? (
              <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-[#06241b] border border-emerald-500/40 text-emerald-300 shadow-inner">
                <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-400/90">
                  {isNl ? "Prijs:" : "Price:"}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-white">
                  {slidePrice}
                </span>
              </div>
            ) : null}

            {/* Instruction Tooltip */}
            {slideTooltip ? (
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setTooltipOpen((prev) => !prev)}
                  onMouseEnter={() => setTooltipOpen(true)}
                  onMouseLeave={() => setTooltipOpen(false)}
                  onFocus={() => setTooltipOpen(true)}
                  onBlur={() => setTooltipOpen(false)}
                  aria-label={isNl ? "Instructies en printtips bekijken" : "View slide instructions and printing tips"}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-emerald-100 bg-white/5 border border-emerald-500/25 hover:border-emerald-400/60 hover:bg-white/10 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>{isNl ? "Print- & modelgids" : "Printing & Model Guide"}</span>
                </button>

                {/* Floating Tooltip Card */}
                {tooltipOpen ? (
                  <div
                    role="tooltip"
                    className="absolute left-0 bottom-full mb-3 w-72 sm:w-80 p-4 rounded-2xl bg-[#07241c]/95 border border-emerald-400/40 shadow-[0_15px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl text-xs text-emerald-50 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-emerald-500/20 font-semibold text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isNl ? "Specificaties & Instructies" : "Specifications & Instructions"}</span>
                    </div>
                    <p className="leading-relaxed text-emerald-100/90">
                      {slideTooltip}
                    </p>
                    {/* Tooltip caret */}
                    <div className="absolute left-6 -bottom-1.5 w-3 h-3 bg-[#07241c] border-r border-b border-emerald-400/40 rotate-45" />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/checkout"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-gray-950 hover:from-emerald-400 hover:to-teal-300 shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{isNl ? "Vraag een Offerte Aan" : (t("hero.ctaQuote") || "Get Instant 3D Quote")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature Badges Row */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-emerald-500/15 max-w-lg">
            <div className="flex items-center gap-2 text-xs text-emerald-100/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isNl ? "2-5 werkdagen" : "2-5 working days"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-100/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isNl ? "±0.1mm Precisie" : "±0.1mm Precision"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-100/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isNl ? "Duurzaam PLA & PETG" : "Eco PLA & PETG"}</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: Dynamic Media Container ================= */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div
            className="relative w-full h-[340px] sm:h-[400px] lg:h-[450px] rounded-3xl overflow-hidden border border-emerald-500/30 bg-gradient-to-b from-[#08231b]/90 to-[#03130e]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.55)] flex items-center justify-center group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onPointerDown={handleInteractionStart}
            onPointerUp={handleInteractionEnd}
          >
            {/* Ambient Media Aura */}
            <div className="absolute inset-8 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

            {/* Media Type Tag Badge */}
            <div className="absolute top-4 right-4 z-40">
              {currentSlide.mediaType === "model3d" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/85 border border-emerald-400/40 text-emerald-300 backdrop-blur-md shadow-lg">
                  <Box className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isNl ? "Interactief 3D" : "3D Interactive"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-950/85 border border-teal-400/40 text-teal-300 backdrop-blur-md shadow-lg">
                  <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isNl ? "Uitgelichte afbeelding" : "Promotional Image"}</span>
                </span>
              )}
            </div>

            {/* CONDITIONAL MEDIA RENDERING */}
            {currentSlide.mediaType === "model3d" ? (
              // 3D Canvas rendering (Three.js)
              <div className="relative w-full h-full flex items-center justify-center">
                <Suspense
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center text-xs text-emerald-200/80 gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                      <span>{isNl ? "3D weergave laden..." : "Loading 3D preview..."}</span>
                    </div>
                  }
                >
                  <HeroModelViewer
                    key={currentSlide.id + currentSlide.mediaUrl}
                    src={resolveAssetUrl(currentSlide.mediaUrl)}
                    className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
                    onInteractionStart={handleInteractionStart}
                    onInteractionEnd={handleInteractionEnd}
                  />
                </Suspense>

                {/* 3D Interactive Instruction Tag */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-black/60 text-emerald-200/90 border border-emerald-500/20 backdrop-blur-md shadow-sm">
                    <RotateCcw className="w-3 h-3 text-emerald-400" />
                    <span>{isNl ? "Sleep om te draaien · Scroll om te zoomen" : "Drag to rotate · Scroll to zoom"}</span>
                  </span>
                </div>
              </div>
            ) : (
              // Image tag rendering
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {!imageError[currentSlide.id] ? (
                  <img
                    key={currentSlide.id + currentSlide.mediaUrl}
                    src={resolveAssetUrl(currentSlide.mediaUrl)}
                    alt={slideTitle}
                    onError={() =>
                      setImageError((prev) => ({
                        ...prev,
                        [currentSlide.id]: true,
                      }))
                    }
                    className="w-full h-full object-contain rounded-2xl drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] select-none transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-emerald-950/40 rounded-2xl border border-emerald-500/20 text-emerald-200 space-y-3">
                    <ImageIcon className="w-12 h-12 text-emerald-400/60" />
                    <p className="text-sm font-semibold text-white">
                      {slideTitle}
                    </p>
                    <p className="text-xs text-emerald-200/70 max-w-xs">
                      {slideSubtext}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM BAR: Stationary Controls ================= */}
      <div className="relative z-20 grid grid-cols-3 items-center px-6 sm:px-10 lg:px-14 pb-6 pt-3 border-t border-emerald-500/15">
        {/* Navigation Arrows (Fixed Left) */}
        <div className="flex items-center gap-2 justify-self-start">
          <button
            type="button"
            onClick={prevSlide}
            aria-label={isNl ? "Vorige dia" : "Previous promotional slide"}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 text-emerald-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label={isNl ? "Volgende dia" : "Next promotional slide"}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 text-emerald-200 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Clickable Navigation Dots / Boliens (Strictly Centered & Fixed Position) */}
        <div
          className="flex items-center justify-center gap-2.5 justify-self-center"
          role="tablist"
          aria-label={isNl ? "Diavoorstelling paginering" : "Slideshow pagination"}
        >
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const slideItemTitle =
              isNl && slide.titleNl?.trim() ? slide.titleNl : slide.title;
            return (
              <button
                key={slide.id || idx}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={isNl ? `Ga naar dia ${idx + 1}: ${slideItemTitle}` : `Go to slide ${idx + 1}: ${slideItemTitle}`}
                onClick={() => goToSlide(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                  isActive
                    ? "w-8 h-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                    : "w-2.5 h-2.5 bg-white/25 hover:bg-white/50"
                }`}
              />
            );
          })}
        </div>

        {/* Status indicator (Fixed Right, never pushes middle dots) */}
        <div className="flex items-center justify-end gap-2 text-[11px] font-medium text-emerald-200/60 justify-self-end w-28">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
            }`}
          />
          <span className="text-right">
            {isPaused ? (isNl ? "Gepauzeerd" : "Paused") : (isNl ? "Automatisch 5s" : "Auto 5s")}
          </span>
        </div>
      </div>
    </section>
  );
}
