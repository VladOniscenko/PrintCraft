import { Briefcase, GraduationCap, Sparkles, UserCheck } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";

export default function MarketAudiences() {
  const { t } = useI18n();

  const audiences = [
    {
      titleKey: "home.audiences.b2cTitle",
      tagKey: "home.audiences.b2cTag",
      descKey: "home.audiences.b2cDesc",
      icon: UserCheck,
      color: "from-emerald-950/80 via-[#072c21] to-[#041a13]",
      border: "border-emerald-500/30",
      tagColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      iconColor: "text-emerald-400",
    },
    {
      titleKey: "home.audiences.hobbyTitle",
      tagKey: "home.audiences.hobbyTag",
      descKey: "home.audiences.hobbyDesc",
      icon: Sparkles,
      color: "from-teal-950/80 via-[#062c2b] to-[#031919]",
      border: "border-teal-500/30",
      tagColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      iconColor: "text-teal-400",
    },
    {
      titleKey: "home.audiences.studentsTitle",
      tagKey: "home.audiences.studentsTag",
      descKey: "home.audiences.studentsDesc",
      icon: GraduationCap,
      color: "from-sky-950/80 via-[#08283b] to-[#041824]",
      border: "border-sky-500/30",
      tagColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
      iconColor: "text-sky-400",
    },
    {
      titleKey: "home.audiences.b2bTitle",
      tagKey: "home.audiences.b2bTag",
      descKey: "home.audiences.b2bDesc",
      icon: Briefcase,
      color: "from-amber-950/70 via-[#2e1d09] to-[#1a1005]",
      border: "border-amber-500/30",
      tagColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      iconColor: "text-amber-400",
    },
  ] as const;

  return (
    <section aria-labelledby="market-audiences-heading" className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
            {t("home.audiences.eyebrow")}
          </p>
          <h2 id="market-audiences-heading" className="site-heading mt-2 text-3xl sm:text-4xl font-black">
            {t("home.audiences.title")}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#5f736d]">
          {t("home.audiences.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {audiences.map(({ titleKey, tagKey, descKey, icon: Icon, color, border, tagColor, iconColor }) => (
          <article
            key={titleKey}
            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6 text-white border ${border} shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tagColor}`}>
                  {t(tagKey)}
                </span>
                <Icon size={26} className={iconColor} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-black tracking-tight text-white">
                {t(titleKey)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-200/90 font-normal">
                {t(descKey)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

