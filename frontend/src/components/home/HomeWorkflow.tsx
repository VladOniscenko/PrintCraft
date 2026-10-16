import { useState } from "react";
import {
  UploadCloud,
  Cpu,
  Layers,
  Truck,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";

export default function HomeWorkflow() {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const steps = [
    {
      icon: UploadCloud,
      titleKey: "home.process.step1Title",
      descKey: "home.process.step1Desc",
      badge: "STEP / CAD / STL",
    },
    {
      icon: Cpu,
      titleKey: "home.process.step2Title",
      descKey: "home.process.step2Desc",
      badge: "PETG / TPU / PLA",
    },
    {
      icon: Layers,
      titleKey: "home.process.step3Title",
      descKey: "home.process.step3Desc",
      badge: "±0.1mm Precision",
    },
    {
      icon: Truck,
      titleKey: "home.process.step4Title",
      descKey: "home.process.step4Desc",
      badge: "2-5 Days Delivery",
    },
  ] as const;

  const faqs = [
    {
      qKey: "home.faq.q1",
      aKey: "home.faq.a1",
    },
    {
      qKey: "home.faq.q2",
      aKey: "home.faq.a2",
    },
    {
      qKey: "home.faq.q3",
      aKey: "home.faq.a3",
    },
    {
      qKey: "home.faq.q4",
      aKey: "home.faq.a4",
    },
  ] as const;

  return (
    <section className="space-y-12">
      {/* 4-Step Process Grid */}
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              {t("home.process.eyebrow")}
            </p>
            <h2 className="site-heading mt-2 text-3xl sm:text-4xl font-black text-[#132621]">
              {t("home.process.title")}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#5f736d]">
            {t("home.process.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map(({ icon: Icon, titleKey, descKey, badge }) => (
            <article
              key={titleKey}
              className="site-card p-6 rounded-2xl border border-[#d6e5df] hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Icon size={24} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#f0f8f5] text-emerald-800 border border-[#dcebe5]">
                    {badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#142621]">
                    {t(titleKey)}
                  </h3>
                  <p className="text-sm text-[#546b65] leading-relaxed mt-2">
                    {t(descKey)}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-[#edf4f1] flex items-center gap-2 text-xs font-medium text-emerald-800">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>{t("cityPage.precisionBadge")}</span>
              </div>
            </article>
          ))}
        </div>

        {/* Quality Specification Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d2a23] to-[#12382f] text-white border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
            <ShieldCheck size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">
              {t("home.process.guaranteeTitle")}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
              {t("home.process.guaranteeText")}
            </p>
          </div>
        </div>
      </div>

      {/* Commercial FAQ Accordion */}
      <div className="site-card rounded-2xl p-6 sm:p-8 border border-[#d8e7e1] bg-[#fbfdfc] space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} />
            <span>{t("home.faq.eyebrow")}</span>
          </div>
          <h2 className="site-heading text-2xl sm:text-3xl font-black text-[#132621]">
            {t("home.faq.title")}
          </h2>
          <p className="text-sm text-[#576d66] mt-2 max-w-2xl">
            {t("home.faq.subtitle")}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map(({ qKey, aKey }, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={qKey}
                className="border border-[#dcebe5] rounded-xl overflow-hidden bg-white transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#182924] hover:text-[#0f766e] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{t(qKey)}</span>
                  <ChevronDown
                    size={18}
                    className={`text-emerald-600 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm text-[#526861] leading-relaxed border-t border-[#edf5f2] pt-3 animate-in fade-in duration-150">
                    {t(aKey)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
