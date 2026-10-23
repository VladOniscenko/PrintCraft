import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Box, RotateCcw } from "lucide-react";
import { getActiveHeroSlides, getCachedActiveHeroSlides } from "../services/api";
import type { HeroSlide } from "../types";
import { resolveAssetUrl } from "../utils/assetUrl";
import { useI18n } from "../i18n/I18nContext";
import {
  getHeroSlideTitle,
  getHeroSlideSubtext,
  getHeroSlidePrice,
} from "../utils/hero";

const HeroModelViewer = lazy(() => import("./HeroModelViewer"));

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: "00000000-0000-0000-0000-000000000101",
    title: "Your idea, 3D printed in days.",
    titleNl: "Jouw idee, binnen enkele dagen 3D-geprint.",
    subtext:
      "From a single replacement part for home to business series. Upload your file and get it delivered via PostNL in 2 to 5 business days.",
    subtextNl:
      "Van één vervangend onderdeel voor thuis tot zakelijke series. Upload je bestand en ontvang het binnen 2 tot 5 werkdagen via PostNL.",
    priceText: "3D Printing in Rotterdam & Across the Netherlands",
    priceTextNl: "3D-printen in Rotterdam & heel Nederland",
    mediaUrl: "/uploads/hero/cable-holder.stl",
    mediaType: "model3d",
    instructionTooltip:
      "Interactive 3D model: drag to rotate 360°, scroll to zoom in and inspect geometry.",
    instructionTooltipNl:
      "Interactief 3D-model: sleep om 360° te draaien, scroll om in te zoomen op details.",
    titles: {
      en: "Your idea, 3D printed in days.",
      nl: "Jouw idee, binnen enkele dagen 3D-geprint.",
      tr: "Fikriniz, günler içinde 3D basılsın.",
      ru: "Ваша идея, напечатанная на 3D-принтере за считанные дни.",
      ar: "فكرتك، مطبوعة ثلاثية الأبعاد في أيام معدودة.",
    },
    subtexts: {
      en: "From a single replacement part for home to business series. Upload your file and get it delivered via PostNL in 2 to 5 business days.",
      nl: "Van één vervangend onderdeel voor thuis tot zakelijke series. Upload je bestand en ontvang het binnen 2 tot 5 werkdagen via PostNL.",
      tr: "Ev için tek bir yedek parçadan kurumsal serilere kadar. Dosyanızı yükleyin ve PostNL ile 2 ila 5 iş günü içinde teslim alın.",
      ru: "От одной запасной детали для дома до коммерческих партий. Загрузите свой файл и получите доставку через PostNL за 2–5 рабочих дней.",
      ar: "من قطعة غيار منزلية واحدة إلى دفعات تجارية. ارفع ملفك واستلمه عبر PostNL خلال 2 إلى 5 أيام عمل.",
    },
    priceTexts: {
      en: "3D Printing in Rotterdam & Across the Netherlands",
      nl: "3D-printen in Rotterdam & heel Nederland",
      tr: "Rotterdam ve Tüm Hollanda'da 3D Baskı",
      ru: "3D-печать в Роттердаме и по всем Нидерландам",
      ar: "طباعة ثلاثية الأبعاد في روتردام وجميع أنحاء هولندا",
    },
    instructionTooltips: {
      en: "Interactive 3D model: drag to rotate 360°, scroll to zoom in and inspect geometry.",
      nl: "Interactief 3D-model: sleep om 360° te draaien, scroll om in te zoomen op details.",
      tr: "Etkileşimli 3D model: 360° döndürmek için sürükleyin, yakınlaştırmak ve geometriyi incelemek için kaydırın.",
      ru: "Интерактивная 3D-модель: перетаскивайте для поворота на 360°, масштабируйте для осмотра геометрии.",
      ar: "نموذج تفاعلي ثلاثي الأبعاد: اسحب للتدوير بزاوية 360 درجة، ومرر للتكبير وفحص التفاصيل.",
    },
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    title: "Extra strong in Black & White.",
    titleNl: "Extra sterk in Zwart & Wit.",
    subtext:
      "Need a part that can handle heat, outdoor weather, or heavy use? Our Black and White PETG is always in stock for fast, affordable production.",
    subtextNl:
      "Een onderdeel nodig dat tegen hitte, buitenweer of een stootje kan? Onze zwarte en witte PETG is altijd op voorraad voor snelle levering.",
    priceText: "Most Popular Choice",
    priceTextNl: "Meest gekozen materiaal",
    mediaUrl: "/uploads/hero/dino.stl",
    mediaType: "model3d",
    instructionTooltip:
      "High-durability PETG is UV-stable, weatherproof, and impact-resistant for demanding environments.",
    instructionTooltipNl:
      "Duurzaam PETG is UV-bestendig, weerbestendig en slagvast voor veeleisende omgevingen.",
    titles: {
      en: "Extra strong in Black & White.",
      nl: "Extra sterk in Zwart & Wit.",
      tr: "Siyah ve Beyazda Ekstra Güçlü.",
      ru: "Особая прочность в черном и белом цвете.",
      ar: "قوة فائقة باللونين الأسود والأبيض.",
    },
    subtexts: {
      en: "Need a part that can handle heat, outdoor weather, or heavy use? Our Black and White PETG is always in stock for fast, affordable production.",
      nl: "Een onderdeel nodig dat tegen hitte, buitenweer of een stootje kan? Onze zwarte en witte PETG is altijd op voorraad voor snelle levering.",
      tr: "Isıya, dış hava koşullarına veya zorlu kullanıma dayanıklı bir parçaya mı ihtiyacınız var? Siyah ve Beyaz PETG malzememiz hızlı ve uygun maliyetli üretim için daima stokta.",
      ru: "Нужна деталь, устойчивая к нагреву, погодным условиям или нагрузкам? Наш черный и белый PETG всегда в наличии для быстрого и надежного производства.",
      ar: "هل تحتاج إلى قطعة تتحمل الحرارة، والطقس الخارجي، أو الاستخدام الشاق؟ خامة PETG باللونين الأسود والأبيض متوفرة دائماً في المخزون لإنتاج سريع وتكلفة مناسبة.",
    },
    priceTexts: {
      en: "Most Popular Choice",
      nl: "Meest gekozen materiaal",
      tr: "En Çok Tercih Edilen Malzeme",
      ru: "Самый популярный материал",
      ar: "الخامة الأكثر طلباً",
    },
    instructionTooltips: {
      en: "High-durability PETG is UV-stable, weatherproof, and impact-resistant for demanding environments.",
      nl: "Duurzaam PETG is UV-bestendig, weerbestendig en slagvast voor veeleisende omgevingen.",
      tr: "Yüksek dayanımlı PETG zorlu ortamlar için UV ışınlarına, hava şartlarına ve darbelere dayanıklıdır.",
      ru: "Прочный PETG устойчив к ультрафиолету, атмосферным воздействиям и ударам в сложных условиях.",
      ar: "مادة PETG عالية المتانة مقاومة للأشعة فوق البنفسجية والطقس والصدمات في الظروف الصعبة.",
    },
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "00000000-0000-0000-0000-000000000103",
    title: "Turn your favorite photo into 3D art.",
    titleNl: "Maak van je favoriete foto een 3D-kunstwerk.",
    subtext:
      "Upload any picture and we print it layer by layer into a detailed, touchable relief painting.",
    subtextNl:
      "Upload een foto en wij printen hem laag voor laag tot een tastbaar schilderij met diepte.",
    priceText: "3D Photo Painting",
    priceTextNl: "3D Foto Schilderij",
    mediaUrl: "/uploads/hero/snowflake.stl",
    mediaType: "model3d",
    instructionTooltip:
      "Upload any photo in our configurator to preview layered optical relief and color blends.",
    instructionTooltipNl:
      "Upload je foto in onze configurator voor een voorbeeld van optische reliëflagen en kleurovergangen.",
    titles: {
      en: "Turn your favorite photo into 3D art.",
      nl: "Maak van je favoriete foto een 3D-kunstwerk.",
      tr: "En sevdiğiniz fotoğrafı 3D sanata dönüştürün.",
      ru: "Превратите любимую фотографию в объемное 3D-искусство.",
      ar: "حوّل صورتك المفضلة إلى عمل فني ثلاثي الأبعاد.",
    },
    subtexts: {
      en: "Upload any picture and we print it layer by layer into a detailed, touchable relief painting.",
      nl: "Upload een foto en wij printen hem laag voor laag tot een tastbaar schilderij met diepte.",
      tr: "Herhangi bir fotoğrafı yükleyin, katman katman dokunulabilir ve detaylı bir kabartma tabloya dönüştürelim.",
      ru: "Загрузите любое изображение, и мы напечатаем его слой за слоем в виде осязаемой рельефной картины.",
      ar: "ارفع أي صورة وسنقوم بطباعتها طبقة تلو الأخرى إلى لوحة بارزة ملموسة ومليئة بالتفاصيل.",
    },
    priceTexts: {
      en: "3D Photo Painting",
      nl: "3D Foto Schilderij",
      tr: "3D Fotoğraf Tablosu",
      ru: "3D-картины по фото",
      ar: "لوحات ثلاثية الأبعاد من الصور",
    },
    instructionTooltips: {
      en: "Upload any photo in our configurator to preview layered optical relief and color blends.",
      nl: "Upload je foto in onze configurator voor een voorbeeld van optische reliëflagen en kleurovergangen.",
      tr: "Katmanlı optik rölyef ve renk geçişlerini önizlemek için konfigüratörümüze herhangi bir fotoğraf yükleyin.",
      ru: "Загрузите фото в конфигуратор для предпросмотра оптических слоев рельефа и цветовых переходов.",
      ar: "ارفع أي صورة في أداتنا لمعاينة الطبقات البصرية البارزة وتدرجات الألوان.",
    },
    isActive: true,
    sortOrder: 3,
  },
];

const AUTOPLAY_INTERVAL_MS = 5000;

export default function Hero() {
  const { t, language, localizePath } = useI18n();
  const [slides, setSlides] = useState<HeroSlide[]>(() => {
    const cached = getCachedActiveHeroSlides();
    if (cached && cached.length > 0) {
      return [...cached].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
    }
    return FALLBACK_SLIDES;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [canRender3D, setCanRender3D] = useState(false);
  const activate3D = useCallback(() => {
    setCanRender3D(true);
  }, []);
  const timerRef = useRef<number | null>(null);

  // Mark user interaction to activate auto-play & prefetching without degrading initial LCP
  useEffect(() => {
    const userEvents = ["pointerdown", "scroll", "keydown", "touchstart"];
    const onInteract = () => {
      setHasInteracted(true);
      userEvents.forEach((e) => window.removeEventListener(e, onInteract));
    };

    userEvents.forEach((e) => {
      window.addEventListener(e, onInteract, { once: true, passive: true });
    });

    return () => {
      userEvents.forEach((e) => window.removeEventListener(e, onInteract));
    };
  }, []);

  // Fetch active slides from .NET API on user interaction (cached client-side to prevent redundant roundtrips)
  useEffect(() => {
    let active = true;

    async function loadSlides() {
      try {
        const data = await getActiveHeroSlides();
        if (active && Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
          );
          setSlides(sorted);
        }
      } catch (err) {
        console.warn("Could not load dynamic hero slides from API, using fallback slides:", err);
      }
    }

    // If already cached synchronously, load immediately
    if (getCachedActiveHeroSlides() !== null) {
      void loadSlides();
      return () => {
        active = false;
      };
    }

    const userEvents = ["pointerdown", "scroll", "keydown", "touchstart"];
    const onUserInteract = () => {
      userEvents.forEach((e) => window.removeEventListener(e, onUserInteract));
      if (active) void loadSlides();
    };

    userEvents.forEach((e) => {
      window.addEventListener(e, onUserInteract, { once: true, passive: true });
    });

    return () => {
      active = false;
      userEvents.forEach((e) => window.removeEventListener(e, onUserInteract));
    };
  }, []);

  const totalSlides = slides.length;
  const currentSlide = slides[currentIndex] || slides[0] || FALLBACK_SLIDES[0];

  const slideTitle = getHeroSlideTitle(currentSlide, language);
  const slideSubtext = getHeroSlideSubtext(currentSlide, language);
  const slideEyebrow = getHeroSlidePrice(currentSlide, language);

  const primaryCtaPath =
    currentIndex === 2
      ? localizePath("/filament-painting")
      : localizePath("/quote");

  const primaryCtaText =
    currentIndex === 2
      ? t("hero.ctaPhoto")
      : currentIndex === 1
        ? t("hero.ctaStart")
        : t("hero.ctaUpload");

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (totalSlides > 0 ? (prev + 1) % totalSlides : 0));
  }, [totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-play (5-second intervals, activated only after first user interaction to preserve LCP and conform to WCAG 2.2.2)
  useEffect(() => {
    if (!hasInteracted || totalSlides <= 1 || isPaused) {
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
  }, [hasInteracted, isPaused, nextSlide, totalSlides]);

  const handleInteractionStart = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setIsPaused(false);
  }, []);

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={t("hero.slideshowAria")}
      aria-live={isPaused ? "polite" : "off"}
      onPointerOver={() => {
        setIsPaused(true);
        setCanRender3D(true);
      }}
      onPointerLeave={() => setIsPaused(false)}
      onTouchStart={() => {
        setHasInteracted(true);
        setCanRender3D(true);
      }}
      className="relative w-full rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-[#071c15] via-[#05140f] to-[#030d0a] border border-emerald-500/20 shadow-[0_32px_64px_-16px_rgba(2,12,9,0.8)] text-white"
    >
      {/* Background Accent Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none transform-gpu" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none transform-gpu" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[65%] bg-emerald-400/5 rounded-full blur-3xl pointer-events-none transform-gpu" />

      {/* Main Split Layout Container / Active Slide */}
      <div
        role="group"
        aria-roledescription="slide"
        aria-label={t("hero.slideAria", {
          current: currentIndex + 1,
          total: totalSlides,
          title: slideTitle,
        })}
        className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center py-16 md:py-24 px-6 sm:px-10 lg:px-16"
      >
        {/* ================= LEFT SIDE: Apple-Style Typography & Primary CTA ================= */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-emerald-400">
              {slideEyebrow || t("hero.mainHeading")}
            </span>
          </div>

          {/* Dynamic Slide Heading & Subtext */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
              {slideTitle}
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 leading-relaxed max-w-xl font-normal">
              {slideSubtext}
            </p>
          </div>

          {/* Actions: 1 pill button + 1 simple text link */}
          <div className="flex flex-wrap items-center gap-6 pt-3">
            <Link
              to={primaryCtaPath}
              className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-semibold text-sm sm:text-base bg-emerald-400 text-gray-950 hover:bg-emerald-300 transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]"
            >
              <span>{primaryCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#solutions"
              className="inline-flex items-center gap-1.5 text-sm sm:text-base font-medium text-emerald-300 hover:text-white transition-colors"
            >
              <span>{t("hero.seeExamples")}</span>
            </a>
          </div>
        </div>

        {/* ================= RIGHT SIDE: Clean 3D Model Display ================= */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div
            className="relative w-full h-[360px] sm:h-[420px] lg:h-[480px] rounded-3xl overflow-hidden bg-white/[0.02] border border-white/10 flex items-center justify-center group touch-none"
            style={{ overscrollBehavior: "contain" }}
            onMouseEnter={() => {
              setIsPaused(true);
              activate3D();
            }}
            onMouseLeave={() => setIsPaused(false)}
            onPointerDown={() => {
              handleInteractionStart();
              activate3D();
            }}
            onPointerUp={handleInteractionEnd}
          >
            {/* Ambient Media Aura */}
            <div className="absolute inset-8 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none transform-gpu" />

            {/* CONDITIONAL MEDIA RENDERING */}
            {currentSlide.mediaType === "model3d" ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {canRender3D ? (
                  <>
                    <Suspense
                      fallback={
                        <div className="w-full h-full flex flex-col items-center justify-center text-xs text-emerald-200/80 gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
                          <span>{t("hero.loading3d")}</span>
                        </div>
                      }
                    >
                      <HeroModelViewer
                        src={resolveAssetUrl(currentSlide.mediaUrl)}
                        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
                        onInteractionStart={handleInteractionStart}
                        onInteractionEnd={handleInteractionEnd}
                      />
                    </Suspense>

                    {/* Subtle Interactive Instruction */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-black/40 text-emerald-200/80 backdrop-blur-md border border-white/10">
                        <RotateCcw className="w-3 h-3 text-emerald-400" />
                        <span>{t("hero.dragToRotate")}</span>
                      </span>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={activate3D}
                    aria-label={t("hero.interactive3d")}
                    className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none group/stage focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-3xl"
                  >
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-400/30 flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.15)] group-hover/stage:scale-105 group-hover/stage:border-emerald-400/50 transition-all duration-300">
                      <Box className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-400 drop-shadow-[0_4px_12px_rgba(52,211,153,0.4)]" />
                      <div className="absolute inset-0 rounded-3xl bg-emerald-400/10 pointer-events-none" />
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-2">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-400 text-gray-950 shadow-md group-hover/stage:bg-emerald-300 transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t("hero.interactive3d")}</span>
                      </span>
                      <span className="text-[11px] text-emerald-200/80">
                        {t("hero.dragToRotate")}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center p-6">
                {!imageError[currentSlide.id] ? (
                  <img
                    key={currentSlide.id + currentSlide.mediaUrl}
                    src={resolveAssetUrl(currentSlide.mediaUrl)}
                    alt={slideTitle}
                    fetchPriority="high"
                    decoding="async"
                    onError={() =>
                      setImageError((prev) => ({
                        ...prev,
                        [currentSlide.id]: true,
                      }))
                    }
                    className="w-full h-full object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.5)] select-none transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-emerald-200 space-y-3">
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

      {/* ================= BOTTOM BAR: Minimal Pagination Dots ================= */}
      <div
        role="group"
        aria-label={t("hero.paginationAria")}
        className="relative z-20 flex items-center justify-center gap-2 pb-8"
      >
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          const slideItemTitle = getHeroSlideTitle(slide, language);
          return (
            <button
              key={slide.id || idx}
              type="button"
              aria-current={isActive ? "true" : undefined}
              aria-label={t("hero.goToSlide", { index: idx + 1, title: slideItemTitle })}
              onClick={() => {
                setHasInteracted(true);
                goToSlide(idx);
              }}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-full"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-8 bg-emerald-400 opacity-100 shadow-sm"
                    : "w-2 bg-white/40 hover:bg-white/70 opacity-60"
                }`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
