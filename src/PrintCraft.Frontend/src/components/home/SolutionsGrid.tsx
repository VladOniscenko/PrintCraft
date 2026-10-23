import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Box,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";

export default function SolutionsGrid() {
  const { t, localizePath } = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const cards = [
    {
      titleKey: "home.solutions.card1Title",
      descKey: "home.solutions.card1Desc",
      tagKey: "home.solutions.card1Tag",
      ctaKey: "home.solutions.card1Cta",
      link: "/faq/vervangende-onderdelen-printen",
      icon: Wrench,
      gradient: "from-emerald-50 to-teal-50/40",
      iconBg: "bg-emerald-100 text-emerald-800",
    },
    {
      titleKey: "home.solutions.card2Title",
      descKey: "home.solutions.card2Desc",
      tagKey: "home.solutions.card2Tag",
      ctaKey: "home.solutions.card2Cta",
      link: "/faq/elektronica-behuizingen-op-maat",
      icon: Box,
      gradient: "from-sky-50 to-blue-50/40",
      iconBg: "bg-sky-100 text-sky-800",
    },
    {
      titleKey: "home.solutions.card3Title",
      descKey: "home.solutions.card3Desc",
      tagKey: "home.solutions.card3Tag",
      ctaKey: "home.solutions.card3Cta",
      link: "/faq/rapid-prototyping-kunststof",
      icon: Cpu,
      gradient: "from-amber-50 to-orange-50/40",
      iconBg: "bg-amber-100 text-amber-800",
    },
    {
      titleKey: "home.solutions.card4Title",
      descKey: "home.solutions.card4Desc",
      tagKey: "home.solutions.card4Tag",
      ctaKey: "home.solutions.card4Cta",
      link: "/filament-painting",
      icon: Sparkles,
      gradient: "from-purple-50 to-pink-50/40",
      iconBg: "bg-purple-100 text-purple-800",
    },
  ] as const;

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 420;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section id="solutions" className="space-y-8">
      {/* Header with Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
            {t("home.solutions.eyebrow")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-950">
            {t("home.solutions.title")}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl">
            {t("home.solutions.subtitle")}
          </p>
        </div>

        {/* Scroll Arrows for Desktop */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label={t("home.solutions.prevShelf")}
            className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label={t("home.solutions.nextShelf")}
            className="p-3 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Apple-Style Horizontal Snap-Scrolling Shelf */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {cards.map(
          ({
            titleKey,
            descKey,
            tagKey,
            ctaKey,
            link,
            icon: Icon,
            gradient,
            iconBg,
          }) => (
            <article
              key={titleKey}
              className={`min-w-[300px] sm:min-w-[360px] md:min-w-[420px] rounded-3xl p-8 bg-gradient-to-br ${gradient} border border-gray-200/80 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between shrink-0 snap-start group`}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/90 text-gray-800 border border-gray-200/60 shadow-xs">
                    {t(tagKey)}
                  </span>
                  <div
                    className={`w-12 h-12 rounded-2xl ${iconBg} shadow-sm flex items-center justify-center transition-transform group-hover:scale-110`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-950 tracking-tight group-hover:text-emerald-700 transition-colors">
                    {t(titleKey)}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(descKey)}
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  to={localizePath(link)}
                  aria-label={t(ctaKey)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
                >
                  <span>{t(ctaKey)}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
