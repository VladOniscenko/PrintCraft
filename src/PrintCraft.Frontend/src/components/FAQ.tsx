import { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Truck,
  ShieldCheck,
  MapPin,
  Search,
  ArrowRight,
  MessageCircleQuestion,
} from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import { businessInfo } from "../config/businessInfo";
import { getFaqItems, getCachedFaqItems } from "../services/api";
import type { FaqItem } from "../types/faq";
import { getLocalizedText } from "../utils/i18nHelpers";

export default function FAQ() {
  const { t, language, localizePath } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [dynamicItems, setDynamicItems] = useState<FaqItem[]>(() => {
    const cached = getCachedFaqItems();
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached
        .filter((item: FaqItem) => item.isActive)
        .sort((a: FaqItem, b: FaqItem) => a.sortOrder - b.sortOrder);
    }
    return [];
  });

  useEffect(() => {
    let isMounted = true;
    getFaqItems()
      .then((res) => {
        if (isMounted && Array.isArray(res) && res.length > 0) {
          const activeOnly = res
            .filter((item: FaqItem) => item.isActive)
            .sort((a: FaqItem, b: FaqItem) => a.sortOrder - b.sortOrder);
          if (activeOnly.length > 0) {
            setDynamicItems(activeOnly);
          }
        }
      })
      .catch(() => {
        // Keep fallback
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackData = useMemo(() => [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
    { question: t("faq.q6"), answer: t("faq.a6") },
    { question: t("faq.q7"), answer: t("faq.a7") },
    { question: t("faq.q8"), answer: t("faq.a8") },
    { question: t("faq.q9"), answer: t("faq.a9") },
    { question: t("faq.q10"), answer: t("faq.a10") },
    { question: t("faq.q11"), answer: t("faq.a11") },
    { question: t("faq.q12"), answer: t("faq.a12") },
    { question: t("faq.q13"), answer: t("faq.a13") },
    { question: t("faq.q14"), answer: t("faq.a14") },
    { question: t("faq.q15"), answer: t("faq.a15") },
    { question: t("faq.q16"), answer: t("faq.a16") },
  ], [t]);

  const rawFaqData = useMemo(() => {
    return dynamicItems.length > 0
      ? dynamicItems.map((item) => ({
          question: getLocalizedText(item.question, language),
          answer: getLocalizedText(item.answer, language),
        }))
      : fallbackData;
  }, [dynamicItems, language, fallbackData]);

  const filteredFaqData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawFaqData;
    return rawFaqData.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [rawFaqData, searchQuery]);

  // Keeps track of which question is currently open
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="site-shell font-sans text-gray-900 flex flex-col min-h-screen">
      <Navbar />

      {/* Apple-Style Clean Header */}
      <header className="px-4 sm:px-6 pt-10 md:pt-16 pb-6 max-w-4xl mx-auto text-center w-full">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-4 border border-emerald-100 shadow-2xs">
          <MessageCircleQuestion size={14} className="text-emerald-700" />
          <span>{t("faq.badge")}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-3">
          {t("faq.title")}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          {t("faq.subtitle")}
        </p>

        {/* High-Trust Reassurance Badges */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-medium text-gray-600">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100/90 border border-gray-200/60 shadow-2xs">
            <Truck size={14} className="text-[#133827]" />
            {t("faq.trustBadgeFastDelivery")}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100/90 border border-gray-200/60 shadow-2xs">
            <ShieldCheck size={14} className="text-[#133827]" />
            {t("faq.trustBadgeInspection")}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100/90 border border-gray-200/60 shadow-2xs">
            <MapPin size={14} className="text-[#133827]" />
            {t("faq.trustBadgeRotterdam")}
          </span>
        </div>

        {/* Interactive Search Bar */}
        <div className="max-w-xl mx-auto mt-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("faq.searchPlaceholder")}
            className="w-full pl-11 pr-4 py-3.5 rounded-full border border-gray-200 bg-white shadow-2xs text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#133827]/20 focus:border-[#133827] transition-all"
          />
        </div>
      </header>

      {/* FAQ Accordion List */}
      <main className="max-w-4xl px-4 sm:px-6 py-6 md:py-8 w-full flex-grow mx-auto">
        {filteredFaqData.length === 0 ? (
          <div className="p-8 text-center text-gray-500 rounded-3xl border border-gray-200 bg-white shadow-xs">
            <p className="text-sm font-medium">{t("faq.noQuestionsFound")}</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredFaqData.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? "bg-white border-emerald-600/60 shadow-xs ring-1 ring-emerald-600/10"
                      : "bg-white border-gray-200/80 hover:border-gray-300 shadow-2xs"
                  }`}
                >
                  {/* Clickable Header */}
                  <button
                    type="button"
                    onClick={() => toggleQuestion(index)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer transition-colors focus:outline-none"
                  >
                    <h3
                      className={`font-bold text-base sm:text-lg pr-4 transition-colors ${
                        isOpen ? "text-gray-900" : "text-gray-800"
                      }`}
                    >
                      {faq.question}
                    </h3>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isOpen ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isOpen ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </button>

                  {/* Expandable Answer */}
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 text-sm sm:text-base text-gray-600 leading-relaxed border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-1">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Apple-Style High-Trust Contact Box */}
        <div className="rounded-3xl border border-gray-200/80 bg-gradient-to-b from-gray-50/70 to-white p-8 sm:p-12 text-center shadow-xs mt-12">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center mx-auto mb-4">
            <Mail size={22} />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {t("faq.contactCta")}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto mb-6 leading-relaxed">
            {t("faq.contactText")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to={localizePath("/checkout")}
              className="rounded-full bg-[#133827] hover:bg-[#1c4d37] text-white px-7 py-3.5 text-xs sm:text-sm font-semibold shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>{t("faq.ctaUploadQuote")}</span>
              <ArrowRight size={16} />
            </Link>
            <a
              href={`mailto:${businessInfo.email}`}
              className="rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 px-6 py-3.5 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Mail size={16} />
              <span>{businessInfo.email}</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
