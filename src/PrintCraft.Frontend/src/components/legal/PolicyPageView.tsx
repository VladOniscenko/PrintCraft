import { useEffect, useState } from "react";
import Navbar from "../Navbar";
import Footer from "../Footer";
import NotFound from "../NotFound";
import { useI18n } from "../../i18n/I18nContext";
import { getPolicy } from "../../services/api";
import type { PolicySection, PolicyTemplate } from "../../types";

interface PolicyPageViewProps {
  slug: "privacy" | "terms" | "refunds" | "shipping" | string;
}

function resolveDictText(
  dict?: Record<string, string> | null,
  lang = "nl",
  fallback = "",
): string {
  if (!dict) return fallback;
  if (dict[lang]?.trim()) return dict[lang].trim();
  if (dict["en"]?.trim()) return dict["en"].trim();
  if (dict["nl"]?.trim()) return dict["nl"].trim();

  const values = Object.values(dict).filter((v) => typeof v === "string" && v.trim().length > 0);
  if (values.length > 0) return values[0].trim();

  return fallback;
}

function renderFormattedBody(text: string) {
  if (!text) return null;
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => (
        <p key={i} className="whitespace-pre-line">
          {para}
        </p>
      ))}
    </div>
  );
}

export default function PolicyPageView({ slug }: PolicyPageViewProps) {
  const { t, language } = useI18n();
  const [template, setTemplate] = useState<PolicyTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadPolicy = async () => {
      setLoading(true);
      try {
        const data = await getPolicy(slug);
        if (!cancelled && data) {
          setTemplate(data);
        }
      } catch {
        /* Fall back gracefully to bundled translations */
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPolicy();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Fallback data mapping from static translations
  const fallbackTitle = (() => {
    if (slug === "privacy") return t("legal.privacy.title");
    if (slug === "terms") return t("legal.terms.title");
    if (slug === "refunds") return t("legal.refunds.title");
    if (slug === "shipping") return t("legal.shipping.title");
    return t("legal.privacy.title");
  })();

  const fallbackUpdated = t("legal.updated");
  const fallbackContactTitle = t("legal.contact.title");
  const fallbackContactBody = t("legal.contact.body");

  const fallbackSections = (() => {
    if (slug === "privacy") {
      return [
        { id: "f-1", title: t("legal.privacy.section1Title"), body: t("legal.privacy.section1Body") },
        { id: "f-2", title: t("legal.privacy.section2Title"), body: t("legal.privacy.section2Body") },
        { id: "f-3", title: t("legal.privacy.section3Title"), body: t("legal.privacy.section3Body") },
        { id: "f-4", title: t("legal.privacy.section4Title"), body: t("legal.privacy.section4Body") },
      ];
    }
    if (slug === "terms") {
      return [
        { id: "f-1", title: t("legal.terms.section1Title"), body: t("legal.terms.section1Body") },
        { id: "f-2", title: t("legal.terms.section2Title"), body: t("legal.terms.section2Body") },
        { id: "f-3", title: t("legal.terms.pricingDisclaimerTitle"), body: t("legal.terms.pricingDisclaimerBody") },
        { id: "f-4", title: t("legal.terms.section3Title"), body: t("legal.terms.section3Body") },
        { id: "f-5", title: t("legal.terms.section4Title"), body: t("legal.terms.section4Body") },
      ];
    }
    if (slug === "refunds") {
      return [
        { id: "f-1", title: t("legal.refunds.section1Title"), body: t("legal.refunds.section1Body") },
        { id: "f-2", title: t("legal.refunds.section2Title"), body: t("legal.refunds.section2Body") },
        { id: "f-3", title: t("legal.refunds.section3Title"), body: t("legal.refunds.section3Body") },
        { id: "f-4", title: t("legal.refunds.section4Title"), body: t("legal.refunds.section4Body") },
      ];
    }
    if (slug === "shipping") {
      return [
        { id: "f-1", title: t("legal.shipping.section1Title"), body: t("legal.shipping.section1Body") },
        { id: "f-2", title: t("legal.shipping.section2Title"), body: t("legal.shipping.section2Body") },
        { id: "f-3", title: t("legal.shipping.section3Title"), body: t("legal.shipping.section3Body") },
        { id: "f-4", title: t("legal.shipping.section4Title"), body: t("legal.shipping.section4Body") },
      ];
    }
    return [];
  })();

  const title = template ? resolveDictText(template.title, language, fallbackTitle) : fallbackTitle;
  const updated = template ? resolveDictText(template.lastUpdated, language, fallbackUpdated) : fallbackUpdated;
  const contactTitle = template ? resolveDictText(template.contactTitle, language, fallbackContactTitle) : fallbackContactTitle;
  const contactBody = template ? resolveDictText(template.contactBody, language, fallbackContactBody) : fallbackContactBody;

  const rawSections: PolicySection[] = template?.sections || [];
  const sections = rawSections.length > 0
    ? rawSections.map((sec: PolicySection, index: number) => ({
        id: sec.id || `sec-${index}`,
        title: resolveDictText(sec.title, language),
        body: resolveDictText(sec.body, language),
      }))
    : fallbackSections;

  if (!loading && !template && fallbackSections.length === 0) {
    return <NotFound />;
  }

  return (
    <div className="site-shell min-h-screen flex flex-col">
      <Navbar />
      <main className="site-main max-w-4xl mx-auto px-6 py-12 w-full flex-grow">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
        {updated ? (
          <p className="text-gray-600 dark:text-gray-400 mb-8">{updated}</p>
        ) : null}

        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          {sections.map((section) => (
            <section key={section.id}>
              {section.title ? (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {section.title}
                </h2>
              ) : null}
              {renderFormattedBody(section.body)}
            </section>
          ))}

          {contactTitle || contactBody ? (
            <section className="bg-white dark:bg-[#0e1512] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xs">
              {contactTitle ? (
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {contactTitle}
                </h2>
              ) : null}
              {renderFormattedBody(contactBody)}
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
