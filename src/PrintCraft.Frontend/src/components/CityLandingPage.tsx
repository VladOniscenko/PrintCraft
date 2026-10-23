import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  Truck,
  UploadCloud,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import NotFound from "./NotFound";
import { useI18n } from "../i18n/I18nContext";
import { dutchCities, getDutchCityBySlug, getCityName } from "../config/dutchCities";
import { getCity, getCachedCity } from "../services/api";
import type { ManagedCity } from "../types/city";
import { getLocalizedText } from "../utils/i18nHelpers";

interface CityLandingPageProps {
  citySlug?: string;
}

export default function CityLandingPage({ citySlug: propSlug }: CityLandingPageProps = {}) {
  const params = useParams<{ city: string }>();
  const location = useLocation();
  const { t, language, localizePath } = useI18n();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Robust slug extraction (prop -> params -> path parsing)
  let slug = propSlug || params.city;
  if (!slug && typeof location !== "undefined" && location.pathname) {
    const segments = location.pathname.split("?")[0].split("/").filter(Boolean);
    const serviceIdx = segments.indexOf("3d-print-service");
    if (serviceIdx !== -1 && segments[serviceIdx + 1]) {
      slug = segments[serviceIdx + 1];
    }
  }

  const [dynamicCity, setDynamicCity] = useState<ManagedCity | null>(() => {
    return slug ? getCachedCity(slug) : null;
  });

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    getCity(slug)
      .then((res) => {
        if (isMounted && res) {
          setDynamicCity(res);
        }
      })
      .catch(() => {
        // Fallback to static config
      });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const fallbackCity = slug ? getDutchCityBySlug(slug) : undefined;

  if (!dynamicCity && !fallbackCity) {
    return <NotFound />;
  }

  const cityName = dynamicCity
    ? getLocalizedText(dynamicCity.names, language, dynamicCity.slug)
    : (fallbackCity ? getCityName(fallbackCity, language) : "");
  const activeSlug = dynamicCity?.slug || fallbackCity?.slug || "";
  const otherCities = dutchCities.filter((c) => c.slug !== activeSlug);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const capabilities = [
    {
      icon: Cpu,
      title: t("cityPage.cardPrototypesTitle"),
      desc: t("cityPage.cardPrototypesDesc"),
    },
    {
      icon: Layers,
      title: t("cityPage.cardPartsTitle"),
      desc: t("cityPage.cardPartsDesc"),
    },
    {
      icon: Sparkles,
      title: t("cityPage.cardArtTitle"),
      desc: t("cityPage.cardArtDesc"),
    },
  ];

  const materialOptions = [
    {
      name: "PLA",
      tagline: t("home.materials.plaTitle"),
      desc: t("home.materials.plaText"),
    },
    {
      name: "PETG",
      tagline: t("home.materials.petgTitle"),
      desc: t("home.materials.petgText"),
    },
    {
      name: "TPU",
      tagline: t("home.materials.tpuTitle"),
      desc: t("home.materials.tpuText"),
    },
  ];

  const faqs = [
    {
      question: t("cityPage.q1", { city: cityName }),
      answer: t("cityPage.a1", { city: cityName }),
    },
    {
      question: t("cityPage.q2", { city: cityName }),
      answer: t("cityPage.a2", { city: cityName }),
    },
    {
      question: t("cityPage.q3", { city: cityName }),
      answer: t("cityPage.a3", { city: cityName }),
    },
    {
      question: t("cityPage.q4", { city: cityName }),
      answer: t("cityPage.a4", { city: cityName }),
    },
  ];

  return (
    <div className="site-shell font-sans text-gray-900 dark:text-white selection:bg-emerald-100 min-h-screen flex flex-col">
      <Navbar />

      <main className="site-main px-2 sm:px-4 py-8 sm:py-12 space-y-16 flex-grow">
        {/* Hero Section */}
        <section className="site-section p-6 sm:p-12 relative overflow-hidden bg-gradient-to-br from-white/90 via-emerald-50/30 to-amber-50/20 dark:from-[#0e1512] dark:via-[#0e1512] dark:to-[#13221b] border border-[#d8e6df] dark:border-white/10 rounded-3xl shadow-sm">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 text-xs sm:text-sm font-semibold tracking-wide">
              <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>{t("cityPage.badge")}</span>
              <span className="text-emerald-500">•</span>
              <span>{cityName}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
              {t("cityPage.heroTitle", { city: cityName })}
            </h1>

            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {t("cityPage.heroSubtitle", { city: cityName })}
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/5 border border-[#d8e6df] dark:border-white/10 text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-medium shadow-2xs">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                {t("cityPage.deliveryBadge", { city: cityName })}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/5 border border-[#d8e6df] dark:border-white/10 text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-medium shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                {t("cityPage.precisionBadge")}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/5 border border-[#d8e6df] dark:border-white/10 text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-medium shadow-2xs">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                {t("cityPage.materialsBadge")}
              </span>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={localizePath("/checkout")}
                className="site-btn-primary w-full sm:w-auto px-8 py-3.5 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center gap-2.5 rounded-2xl cursor-pointer"
              >
                <UploadCloud className="w-5 h-5" aria-hidden="true" />
                <span>{t("cityPage.quoteCta")}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <a
                href="#local-faq"
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white/90 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 border border-[#d8e6df] dark:border-white/10 rounded-2xl shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t("cityPage.viewFaq")}</span>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* Capabilities Grid */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t("cityPage.capabilitiesEyebrow", { city: cityName })}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t("cityPage.capabilitiesTitle", { city: cityName })}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t("cityPage.capabilitiesDesc", { city: cityName })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {capabilities.map((cap, i) => {
              const IconComp = cap.icon;
              return (
                <div
                  key={i}
                  className="p-6 bg-white/90 dark:bg-[#0e1512] border border-[#d8e6df] dark:border-white/10 rounded-2xl shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                    <IconComp className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cap.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{cap.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Materials Overview */}
        <section className="site-section p-6 sm:p-10 bg-white/80 dark:bg-[#0e1512] border border-[#d8e6df] dark:border-white/10 rounded-3xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t("cityPage.materialsTitle", { city: cityName })}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t("cityPage.materialsDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {materialOptions.map((mat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-white/5 space-y-2.5 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all"
              >
                <div className="inline-block px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-sm border border-emerald-200 dark:border-emerald-800/60">
                  {mat.name}
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{mat.tagline}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{mat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Local FAQ */}
        <section id="local-faq" className="max-w-3xl mx-auto space-y-6 pt-4">
          <div className="text-center space-y-2">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t("cityPage.faqEyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t("cityPage.faqTitle", { city: cityName })}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border bg-white/95 dark:bg-[#0e1512] transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? "border-emerald-500 dark:border-emerald-500/60 shadow-sm"
                      : "border-[#d8e6df] dark:border-white/10 hover:border-emerald-300 dark:hover:border-white/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full px-5 py-4 text-left font-bold text-gray-900 dark:text-white flex justify-between items-center gap-4 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" aria-hidden="true" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-white/10 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="p-8 sm:p-12 text-center rounded-3xl bg-gradient-to-br from-[#12362b] to-[#0d271f] dark:from-[#0c221b] dark:to-[#071510] text-white space-y-6 shadow-xl relative overflow-hidden border border-transparent dark:border-white/10">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {t("cityPage.ctaBannerTitle", { city: cityName })}
            </h2>
            <p className="text-white/85 text-sm sm:text-base leading-relaxed">
              {t("cityPage.ctaBannerDesc")}
            </p>
          </div>
          <div className="relative z-10">
            <Link
              to={localizePath("/checkout")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-base shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <UploadCloud className="w-5 h-5" aria-hidden="true" />
              <span>{t("cityPage.ctaBannerButton")}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Internal Links to Other Dutch Cities */}
        <section className="space-y-6 pt-4 border-t border-[#d8e6df] dark:border-white/10">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t("cityPage.otherCitiesTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {t("cityPage.otherCitiesSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
            {otherCities.map((otherCity) => {
              const otherName = getCityName(otherCity, language);
              return (
                <Link
                  key={otherCity.slug}
                  to={localizePath(`/3d-print-service/${otherCity.slug}`)}
                  className="px-3 py-2 rounded-xl bg-white/80 dark:bg-[#0e1512] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-[#d8e6df] dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/50 text-center transition-all text-xs font-medium text-gray-800 dark:text-gray-200 hover:text-emerald-900 dark:hover:text-emerald-300 truncate shadow-2xs"
                  title={otherName}
                >
                  {otherName}
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

