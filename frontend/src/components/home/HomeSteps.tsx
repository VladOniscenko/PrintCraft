import { ArrowRight, Box, PackageCheck, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";

const steps = [
  {
    number: "01",
    title: "home.steps.uploadTitle",
    text: "home.steps.uploadText",
    icon: Box,
  },
  {
    number: "02",
    title: "home.steps.materialTitle",
    text: "home.steps.materialText",
    icon: SlidersHorizontal,
  },
  {
    number: "03",
    title: "home.steps.printTitle",
    text: "home.steps.printText",
    icon: PackageCheck,
  },
] as const;

export default function HomeSteps() {
  const { t, localizePath } = useI18n();
  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          {t("home.steps.eyebrow")}
        </p>
        <h2 className="site-heading mt-2 text-4xl font-black">
          {t("home.steps.title")}
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(({ number, title, text, icon: Icon }) => (
          <article
            key={number}
            className="relative rounded-2xl border border-[#d8e6df] bg-white p-6 shadow-sm"
          >
            <span className="text-sm font-black text-amber-600">{number}</span>
            <Icon size={28} className="mt-8 text-emerald-800" />
            <h3 className="mt-5 text-xl font-black text-[#17231f]">
              {t(title)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#5f736d]">{t(text)}</p>
          </article>
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <Link
          to={localizePath("/checkout")}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>{t("hero.ctaQuote")}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
