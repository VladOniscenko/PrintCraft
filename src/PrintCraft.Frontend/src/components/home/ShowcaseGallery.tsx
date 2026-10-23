import { Box, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";

const pieces = [
  {
    title: "home.showcase.partTitle",
    tag: "home.showcase.partTag",
    icon: Box,
    tone: "from-[#08221b] via-[#051712] to-[#020b08]",
    accent: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    title: "home.showcase.prototypeTitle",
    tag: "home.showcase.prototypeTag",
    icon: Sparkles,
    tone: "from-[#091b29] via-[#05111c] to-[#02080e]",
    accent: "text-sky-400",
    badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  },
  {
    title: "home.showcase.caseTitle",
    tag: "home.showcase.caseTag",
    icon: ShieldCheck,
    tone: "from-[#24170a] via-[#170e06] to-[#0c0702]",
    accent: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    title: "home.showcase.detailTitle",
    tag: "home.showcase.detailTag",
    icon: Layers3,
    tone: "from-[#1d0e24] via-[#120817] to-[#09040c]",
    accent: "text-purple-400",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
] as const;

export default function ShowcaseGallery() {
  const { t } = useI18n();

  return (
    <section id="showcase" className="space-y-8 sm:space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
            {t("home.showcase.eyebrow")}
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-950">
            {t("home.showcase.title")}
          </h2>
        </div>
        <p className="max-w-md text-base text-gray-600 leading-relaxed">
          {t("home.showcase.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {pieces.map(({ title, tag, icon: Icon, tone, accent, badge }) => (
          <article
            key={title}
            className={`group relative min-h-[280px] overflow-hidden rounded-3xl bg-gradient-to-b ${tone} p-8 text-white border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${badge}`}>
                {t(tag)}
              </span>
              <Icon className={`w-6 h-6 ${accent} group-hover:scale-110 transition-transform`} />
            </div>

            <div className="pt-12 space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                {t(title)}
              </h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
