import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Truck,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import NotFound from "./NotFound";
import { useI18n } from "../i18n/I18nContext";
import {
  getSeoApplicationBySlug,
  getApplicationName,
  seoApplications,
} from "../config/seoApplications";
import { dutchCities, getCityName } from "../config/dutchCities";
import { businessInfo } from "../config/businessInfo";
import { getFaqTopic, getCachedFaqTopic } from "../services/api";
import type { FaqTopic } from "../types/faq";

interface ApplicationLandingPageProps {
  appSlug?: string;
}

export default function ApplicationLandingPage({
  appSlug,
}: ApplicationLandingPageProps) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const activeSlug = appSlug || paramSlug || "";
  const { language, t, localizePath } = useI18n();

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [dynamicTopic, setDynamicTopic] = useState<FaqTopic | null>(() => {
    return activeSlug ? getCachedFaqTopic(activeSlug) : null;
  });

  useEffect(() => {
    if (!activeSlug) return;
    let isMounted = true;
    getFaqTopic(activeSlug)
      .then((res) => {
        if (isMounted && res) {
          setDynamicTopic(res);
        }
      })
      .catch(() => {
        // Fallback to static config
      });
    return () => {
      isMounted = false;
    };
  }, [activeSlug]);

  const fallbackApp = getSeoApplicationBySlug(activeSlug);

  if (!dynamicTopic && !fallbackApp) {
    return <NotFound />;
  }

  const resolveText = (
    dynDict?: Record<string, string> | null,
    fbDict?: Record<string, string> | null,
    fb = ""
  ): string => {
    if (dynDict && dynDict[language]?.trim()) return dynDict[language].trim();
    if (fbDict && fbDict[language]?.trim()) return fbDict[language].trim();
    if (dynDict && dynDict["en"]?.trim()) return dynDict["en"].trim();
    if (fbDict && fbDict["en"]?.trim()) return fbDict["en"].trim();
    if (dynDict && dynDict["nl"]?.trim()) return dynDict["nl"].trim();
    if (fbDict && fbDict["nl"]?.trim()) return fbDict["nl"].trim();
    return fb;
  };

  const resolveList = (
    dynDict?: Record<string, string[]> | null,
    fbDict?: Record<string, string[]> | null,
    fb: string[] = []
  ): string[] => {
    if (dynDict && Array.isArray(dynDict[language]) && dynDict[language].length > 0) return dynDict[language];
    if (fbDict && Array.isArray(fbDict[language]) && fbDict[language].length > 0) return fbDict[language];
    if (dynDict && Array.isArray(dynDict["en"]) && dynDict["en"].length > 0) return dynDict["en"];
    if (fbDict && Array.isArray(fbDict["en"]) && fbDict["en"].length > 0) return fbDict["en"];
    if (dynDict && Array.isArray(dynDict["nl"]) && dynDict["nl"].length > 0) return dynDict["nl"];
    if (fbDict && Array.isArray(fbDict["nl"]) && fbDict["nl"].length > 0) return fbDict["nl"];
    return fb;
  };

  const resolveFaqs = (
    dynDict?: Record<string, { q: string; a: string }[]> | null,
    fbDict?: Record<string, { q: string; a: string }[]> | null,
    fb: { q: string; a: string }[] = []
  ): { q: string; a: string }[] => {
    if (dynDict && Array.isArray(dynDict[language]) && dynDict[language].length > 0) return dynDict[language];
    if (fbDict && Array.isArray(fbDict[language]) && fbDict[language].length > 0) return fbDict[language];
    if (dynDict && Array.isArray(dynDict["en"]) && dynDict["en"].length > 0) return dynDict["en"];
    if (fbDict && Array.isArray(fbDict["en"]) && fbDict["en"].length > 0) return fbDict["en"];
    if (dynDict && Array.isArray(dynDict["nl"]) && dynDict["nl"].length > 0) return dynDict["nl"];
    if (fbDict && Array.isArray(fbDict["nl"]) && fbDict["nl"].length > 0) return fbDict["nl"];
    return fb;
  };

  const appName = resolveText(dynamicTopic?.names, fallbackApp?.names, activeSlug);
  const heroBadge = resolveText(dynamicTopic?.badge, fallbackApp?.badge);
  const heroTitle = resolveText(dynamicTopic?.heroTitle, fallbackApp?.heroTitle);
  const heroSubtitle = resolveText(dynamicTopic?.heroSubtitle, fallbackApp?.heroSubtitle);
  const description = resolveText(dynamicTopic?.description, fallbackApp?.description);
  const benefits = resolveList(dynamicTopic?.benefits, fallbackApp?.benefits);
  const faqs = resolveFaqs(dynamicTopic?.faqs, fallbackApp?.faqs);
  const recommendedMaterials = dynamicTopic?.recommendedMaterials || fallbackApp?.recommendedMaterials || ["PETG", "TPU", "PLA"];

  const localizedCountry =
    businessInfo.address.countryName[language] ||
    businessInfo.address.countryName.nl;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const otherApps = seoApplications.filter((a) => a.slug !== activeSlug);
  const featuredCities = dutchCities.slice(0, 10);

  const materialOptions = [
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
    {
      name: "PLA",
      tagline: t("home.materials.plaTitle"),
      desc: t("home.materials.plaText"),
    },
  ];

  return (
    <div className="site-shell font-sans text-gray-900 dark:text-white flex flex-col min-h-screen">
      <Navbar />

      {/* Apple-Style Minimalist Hero Header */}
      <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        {heroBadge && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 mb-6">
            <Sparkles size={14} className="text-emerald-700 dark:text-emerald-400" />
            <span>{heroBadge}</span>
          </div>
        )}

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.12]">
          {heroTitle}
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {heroSubtitle}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={localizePath("/quote")}
            className="rounded-full bg-[#133827] hover:bg-[#0f2d1f] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-8 py-4 font-semibold shadow-sm hover:shadow transition-all inline-flex items-center gap-2 text-base cursor-pointer"
          >
            <span>{t("faq.ctaUploadQuote")}</span>
            <ArrowRight size={18} />
          </Link>
          <a
            href="#faqs"
            className="rounded-full px-7 py-4 font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/15 border border-gray-200 dark:border-white/10 transition-all inline-flex items-center gap-2 text-base shadow-2xs cursor-pointer"
          >
            {t("cityPage.viewFaq")}
          </a>
        </div>

        {/* High-Trust Reassurance Chips */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 shadow-2xs">
            <Truck size={15} className="text-emerald-700 dark:text-emerald-400" />
            <span>{t("faq.trustBadgeFastDelivery")}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 shadow-2xs">
            <ShieldCheck size={15} className="text-emerald-700 dark:text-emerald-400" />
            <span>{t("faq.trustBadgeInspection")}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 shadow-2xs">
            <Layers size={15} className="text-emerald-700 dark:text-emerald-400" />
            <span>{recommendedMaterials.join(", ")}</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-5xl px-4 sm:px-6 pb-20 mx-auto w-full flex-grow space-y-16">
        {/* Solution Overview & Benefits */}
        <section className="p-8 sm:p-10 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0e1512] shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {t("home.solutions.eyebrow")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-snug">
                {appName}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base sm:text-lg">
                {description}
              </p>
            </div>
            <div className="lg:col-span-5 bg-gray-50/80 dark:bg-white/5 p-6 sm:p-8 rounded-2xl border border-gray-100 dark:border-white/10 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm tracking-wide flex items-center gap-2">
                <Cpu size={16} className="text-emerald-700 dark:text-emerald-400" />
                <span>{t("home.showcase.eyebrow")}</span>
              </h3>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Recommended Materials */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("cityPage.materialsTitle", { city: localizedCountry })}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-base">
              {t("cityPage.materialsDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {materialOptions.map((mat) => (
              <div
                key={mat.name}
                className="p-7 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0e1512] shadow-xs hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">{mat.name}</h3>
                  </div>
                  <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-400 mb-2">
                    {mat.tagline}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{mat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dedicated FAQ Accordion */}
        <section id="faqs" className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t("cityPage.faqEyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">
              {t("faq.title")} - {appName}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl transition-all duration-200 border overflow-hidden ${
                    isOpen
                      ? "bg-white dark:bg-[#0e1512] border-emerald-500/40 dark:border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/20 dark:ring-emerald-500/30"
                      : "bg-white dark:bg-[#0e1512] border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 shadow-2xs"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <h3
                      className={`font-semibold text-base sm:text-lg pr-4 transition-colors ${
                        isOpen ? "text-emerald-950 dark:text-emerald-300 font-bold" : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {item.q}
                    </h3>
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isOpen
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 rotate-180"
                          : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/15"
                      }`}
                    >
                      <ChevronDown size={18} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed border-t border-gray-100 dark:border-white/10 pt-4">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="rounded-3xl bg-[#133827] dark:bg-gradient-to-br dark:from-[#0d271f] dark:to-[#071712] border border-transparent dark:border-white/10 p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white max-w-xl mx-auto">
            {t("cityPage.ctaBannerTitle", { city: appName })}
          </h2>
          <p className="text-emerald-100/90 max-w-lg mx-auto mt-3 text-base leading-relaxed">
            {t("cityPage.ctaBannerDesc")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={localizePath("/quote")}
              className="rounded-full bg-white hover:bg-gray-100 text-[#133827] px-8 py-4 font-semibold text-base inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span>{t("faq.ctaUploadQuote")}</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* Other Applications Links */}
        <section className="space-y-4 pt-4 border-t border-gray-200/80 dark:border-white/10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t("seo.schema.catalogName")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherApps.map((other) => (
              <Link
                key={other.slug}
                to={localizePath(`/faq/${other.slug}`)}
                className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-[#0e1512] hover:bg-gray-50/80 dark:hover:bg-white/5 transition-all text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between shadow-2xs"
              >
                <span>{getApplicationName(other, language)}</span>
                <ArrowRight size={14} className="text-emerald-700 dark:text-emerald-400" />
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Cities Section */}
        <section className="space-y-4 pt-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t("cityPage.otherCitiesTitle")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {featuredCities.map((city) => (
              <Link
                key={city.slug}
                to={localizePath(`/3d-print-service/${city.slug}`)}
                className="px-3.5 py-1.5 rounded-full border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0e1512] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:text-emerald-900 dark:hover:text-emerald-300 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all shadow-2xs"
              >
                {getCityName(city, language)}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
