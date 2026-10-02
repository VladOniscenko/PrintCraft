// src/components/FAQ.tsx
import { useState } from "react";
import Navbar from "./Navbar";
import { ChevronDown, ChevronUp, MessageCircleQuestion } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import Footer from "./Footer";
import { Link } from "react-router-dom";

export default function FAQ() {
  const { t } = useI18n();
  const faqData = [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
    { question: t("faq.q6"), answer: t("faq.a6") },
  ];

  // Keeps track of which question is currently open
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleQuestion = (index: number) => {
    // If clicking the already open question, close it. Otherwise, open the new one.
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="site-shell font-sans text-gray-900 flex flex-col">
      <Navbar />

      {/* Header Section */}
      <header className="site-page-hero reveal-soft">
        <div className="site-page-hero-card reveal-up">
          <div className="flex justify-center mb-6">
            <MessageCircleQuestion
              size={56}
              className="text-emerald-400 opacity-80"
            />
          </div>
          <h1 className="site-page-hero-title">{t("faq.title")}</h1>
          <p className="site-page-hero-subtitle">{t("faq.subtitle")}</p>
        </div>
      </header>

      {/* FAQ Accordion List */}
      <main className="site-main max-w-4xl px-4 sm:px-6 py-12 w-full flex-grow reveal-up stagger-1">
        <div className="space-y-4 reveal-up stagger-2">
          {faqData.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`site-card reveal-up stagger-3 rounded-2xl overflow-hidden transition-all duration-200 ${
                  isOpen
                    ? "border-emerald-500 shadow-md"
                    : "border-[#d7e5df] hover:border-emerald-300"
                }`}
              >
                {/* Clickable Header */}
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <h3
                    className={`font-bold text-lg pr-8 ${isOpen ? "text-[#0f5f53]" : "text-[#1d2d27]"}`}
                  >
                    {faq.question}
                  </h3>
                  <div
                    className={`shrink-0 transition-transform duration-200 ${isOpen ? "text-emerald-600" : "text-[#7f948d]"}`}
                  >
                    {isOpen ? (
                      <ChevronUp size={24} />
                    ) : (
                      <ChevronDown size={24} />
                    )}
                  </div>
                </button>

                {/* Expandable Answer */}
                {isOpen && (
                  <div className="px-6 pb-6 text-[#5f726c] leading-relaxed animate-in fade-in slide-in-from-top-2">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Support Box */}
        <div className="site-card reveal-up stagger-4 mt-10 text-center p-8">
          <p className="text-[#5f726c] mb-4">{t("faq.contactText")}</p>
          <Link to="/privacy" className="site-btn-primary">
            {t("faq.contactCta")}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
