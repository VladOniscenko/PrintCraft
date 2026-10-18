import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Timer,
  ShieldCheck,
  ArrowRight,
  Cpu,
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
import { getFaqTopic } from "../services/api";
import type { FaqTopic } from "../types/faq";
import {
  getLocalizedText,
  getLocalizedList,
  getLocalizedFaqs,
} from "../utils/i18nHelpers";

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
  const [dynamicTopic, setDynamicTopic] = useState<FaqTopic | null>(null);

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

  const appName = dynamicTopic
    ? getLocalizedText(dynamicTopic.names, language, activeSlug)
    : (fallbackApp ? getApplicationName(fallbackApp, language) : "");
  const heroBadge = dynamicTopic
    ? getLocalizedText(dynamicTopic.badge, language)
    : (fallbackApp ? getLocalizedText(fallbackApp.badge, language) : "");
  const heroTitle = dynamicTopic
    ? getLocalizedText(dynamicTopic.heroTitle, language)
    : (fallbackApp ? getLocalizedText(fallbackApp.heroTitle, language) : "");
  const heroSubtitle = dynamicTopic
    ? getLocalizedText(dynamicTopic.heroSubtitle, language)
    : (fallbackApp ? getLocalizedText(fallbackApp.heroSubtitle, language) : "");
  const description = dynamicTopic
    ? getLocalizedText(dynamicTopic.description, language)
    : (fallbackApp ? getLocalizedText(fallbackApp.description, language) : "");
  const benefits = dynamicTopic
    ? getLocalizedList(dynamicTopic.benefits, language)
    : (fallbackApp ? getLocalizedList(fallbackApp.benefits, language) : []);
  const faqs = dynamicTopic
    ? getLocalizedFaqs(dynamicTopic.faqs, language)
    : (fallbackApp ? getLocalizedFaqs(fallbackApp.faqs, language) : []);
  const leadTime = dynamicTopic?.leadTime || fallbackApp?.leadTime || "2-5 werkdagen";
  const precision = dynamicTopic?.precision || fallbackApp?.precision || "±0.1 mm";
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
    <div className="site-shell font-sans text-gray-900 flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <header className="site-page-hero reveal-soft">
        <div className="site-page-hero-card reveal-up max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-emerald-300 border border-emerald-400/30 mb-6 backdrop-blur-xs">
            <Sparkles size={14} className="text-emerald-300" />
            <span>{heroBadge}</span>
          </div>

          <h1 className="site-page-hero-title text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            {heroTitle}
          </h1>

          <p className="site-page-hero-subtitle text-lg sm:text-xl text-emerald-100/90 mt-5 max-w-2xl mx-auto leading-relaxed font-normal">
            {heroSubtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={localizePath("/checkout")}
              className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
            >
              <span>{t("cityPage.quoteCta")}</span>
              <ArrowRight size={18} />
            </Link>
            <a
              href="#faqs"
              className="px-6 py-3.5 rounded-xl font-bold transition-all bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs"
            >
              {t("cityPage.viewFaq")}
            </a>
          </div>

          {/* Quick Specifications */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/15 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white/10 text-emerald-300 border border-white/10 shrink-0">
                <Timer size={20} />
              </div>
              <div>
                <p className="text-xs text-emerald-200/80 font-medium">{t("hero.fastTurnaround")}</p>
                <p className="text-sm font-bold text-white">{leadTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white/10 text-sky-300 border border-white/10 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs text-emerald-200/80 font-medium">{t("hero.highQuality")}</p>
                <p className="text-sm font-bold text-white">{precision}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white/10 text-amber-300 border border-white/10 shrink-0">
                <Layers size={20} />
              </div>
              <div>
                <p className="text-xs text-emerald-200/80 font-medium">{t("home.materials.eyebrow")}</p>
                <p className="text-sm font-bold text-white">{recommendedMaterials.join(", ")}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="site-main max-w-5xl px-4 sm:px-6 py-14 mx-auto w-full flex-grow space-y-16">
        {/* Solution Overview & Benefits */}
        <section className="site-card p-8 sm:p-10 rounded-3xl border border-[#d8e5df]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                {t("cityPage.capabilitiesEyebrow")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#11241f] leading-snug">
                {appName}
              </h2>
              <p className="text-[#4e645e] leading-relaxed text-base">
                {description}
              </p>
            </div>
            <div className="lg:col-span-5 bg-[#f4faf7] p-6 rounded-2xl border border-[#dbece4] space-y-3">
              <h3 className="font-bold text-[#162a24] text-sm uppercase tracking-wide flex items-center gap-2">
                <Cpu size={16} className="text-emerald-600" />
                <span>{t("home.showcase.eyebrow")}</span>
              </h3>
              <ul className="space-y-2.5 text-sm text-[#435953]">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
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
            <h2 className="text-2xl sm:text-3xl font-black text-[#132621]">
              {t("cityPage.materialsTitle", { city: localizedCountry })}
            </h2>
            <p className="text-[#5c726c] mt-1 text-sm">
              {t("cityPage.materialsDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {materialOptions.map((mat) => (
              <div
                key={mat.name}
                className="site-card p-6 rounded-2xl border border-[#d6e5df] hover:border-emerald-400 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-xl text-[#142621]">{mat.name}</h3>
                  <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-[#ecf6f2] text-emerald-700">
                    {mat.tagline}
                  </span>
                </div>
                <p className="text-sm text-[#546b65] leading-relaxed">{mat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Dedicated FAQ Accordion */}
        <section id="faqs" className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              {t("cityPage.faqEyebrow")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#132621] mt-1">
              {t("faq.title")} - {appName}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`site-card rounded-2xl overflow-hidden transition-all duration-200 border ${
                    isOpen ? "border-emerald-500 shadow-sm" : "border-[#d8e5df]"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                  >
                    <h3
                      className={`font-bold text-base pr-4 ${
                        isOpen ? "text-[#0f5f53]" : "text-[#182a24]"
                      }`}
                    >
                      {item.q}
                    </h3>
                    <div
                      className={`shrink-0 transition-transform duration-200 ${
                        isOpen ? "text-emerald-600" : "text-[#7b928b]"
                      }`}
                    >
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-[#526862] leading-relaxed border-t border-[#edf4f1] pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="rounded-3xl bg-gradient-to-br from-[#12362b] to-[#0d271f] p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-xl">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-2xl sm:text-3xl font-black text-white max-w-xl mx-auto">
            {t("cityPage.ctaBannerTitle", { city: appName })}
          </h2>
          <p className="text-white/85 max-w-lg mx-auto mt-3 text-sm sm:text-base leading-relaxed">
            {t("cityPage.ctaBannerDesc")}
          </p>
          <div className="mt-8">
            <Link
              to={localizePath("/checkout")}
              className="site-btn-primary px-8 py-3.5 rounded-xl font-bold inline-flex items-center gap-2 shadow-lg"
            >
              <span>{t("cityPage.ctaBannerButton")}</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* Other Applications Links */}
        <section className="space-y-4 pt-4 border-t border-[#dce9e3]">
          <h2 className="text-lg font-bold text-[#142621]">
            {t("seo.schema.catalogName")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {otherApps.map((other) => (
              <Link
                key={other.slug}
                to={localizePath(`/faq/${other.slug}`)}
                className="p-4 rounded-xl border border-[#d6e5df] hover:border-emerald-400 bg-white hover:bg-[#f6fbf9] transition-all text-sm font-semibold text-[#203630] flex items-center justify-between"
              >
                <span>{getApplicationName(other, language)}</span>
                <ArrowRight size={14} className="text-emerald-600" />
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Cities Section */}
        <section className="space-y-4 pt-2">
          <h2 className="text-lg font-bold text-[#142621]">
            {t("cityPage.otherCitiesTitle")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {featuredCities.map((city) => (
              <Link
                key={city.slug}
                to={localizePath(`/3d-print-service/${city.slug}`)}
                className="px-3 py-1.5 rounded-lg border border-[#d6e5df] bg-white hover:bg-emerald-50 hover:border-emerald-300 text-xs font-medium text-[#2d443e] transition-all"
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
