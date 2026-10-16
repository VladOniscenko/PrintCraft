import { Link } from "react-router-dom";
import { ArrowRight, Box, Cpu, Sparkles, Wrench, ShieldCheck, Timer } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import { seoApplications, getApplicationName } from "../../config/seoApplications";

const applicationIcons = [
  Sparkles,
  Wrench,
  Cpu,
  Box,
];

export default function SolutionsGrid() {
  const { t, language, localizePath } = useI18n();

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            {t("home.solutions.eyebrow")}
          </p>
          <h2 className="site-heading mt-2 text-3xl sm:text-4xl font-black text-[#132621]">
            {t("home.solutions.title")}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#5f736d]">
          {t("home.solutions.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {seoApplications.map((app, index) => {
          const Icon = applicationIcons[index % applicationIcons.length];
          const badge = app.badge[language] || app.badge.nl;
          const subtitle = app.heroSubtitle[language] || app.heroSubtitle.nl;

          return (
            <article
              key={app.slug}
              className="site-card p-6 rounded-2xl border border-[#d6e5df] hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 group-hover:bg-emerald-100/70 transition-colors">
                    <Icon size={24} />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#f0f8f5] text-emerald-800 border border-[#dcebe5]">
                    {badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#142621] group-hover:text-emerald-700 transition-colors">
                    {getApplicationName(app, language)}
                  </h3>
                  <p className="text-sm text-[#546b65] leading-relaxed mt-2 line-clamp-3">
                    {subtitle}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#edf4f1] space-y-1.5 text-xs text-[#526a63]">
                  <div className="flex items-center gap-2">
                    <Timer size={14} className="text-emerald-600 shrink-0" />
                    <span>{app.leadTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                    <span>{app.precision}</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4">
                <Link
                  to={localizePath(`/oplossingen/${app.slug}`)}
                  className="w-full site-btn-soft py-2.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 group-hover:bg-emerald-700 group-hover:text-white transition-all shadow-sm"
                >
                  <span>{t("home.solutions.viewSolution")}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

