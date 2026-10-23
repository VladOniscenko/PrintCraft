import { Bolt, CircleDot, Waves } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";

const materials = [
  {
    name: "PLA",
    label: "home.materials.plaTitle",
    text: "home.materials.plaText",
    icon: CircleDot,
    badgeColor: "bg-emerald-100 text-emerald-800",
    hoverBorder: "hover:border-emerald-300",
  },
  {
    name: "PETG",
    label: "home.materials.petgTitle",
    text: "home.materials.petgText",
    icon: Bolt,
    badgeColor: "bg-sky-100 text-sky-800",
    hoverBorder: "hover:border-sky-300",
  },
  {
    name: "TPU",
    label: "home.materials.tpuTitle",
    text: "home.materials.tpuText",
    icon: Waves,
    badgeColor: "bg-amber-100 text-amber-800",
    hoverBorder: "hover:border-amber-300",
  },
] as const;

export default function MaterialFeatures() {
  const { t } = useI18n();

  return (
    <section id="materials" className="space-y-8 sm:space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
          {t("home.materials.eyebrow")}
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-950 dark:text-white">
          {t("home.materials.title")}
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {t("home.materials.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {materials.map(({ name, label, text, icon: Icon, badgeColor, hoverBorder }) => (
          <article
            key={name}
            className={`flex flex-col justify-between p-8 rounded-3xl bg-white dark:bg-[#0e1512] border border-gray-200/80 dark:border-white/10 ${hoverBorder} hover:shadow-xl transition-all duration-300 group`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeColor}`}>
                  {name}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-[#141e1a] border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-950 dark:text-white tracking-tight">
                  {t(label)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t(text)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
