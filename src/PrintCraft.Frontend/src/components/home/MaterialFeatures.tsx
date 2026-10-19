import { Ban, Bolt, CircleDot } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";

const materials = [
  {
    name: "PLA",
    label: "home.materials.plaTitle",
    text: "home.materials.plaText",
    icon: CircleDot,
    color: "bg-emerald-50 text-emerald-950 border-emerald-300",
  },
  {
    name: "PETG",
    label: "home.materials.petgTitle",
    text: "home.materials.petgText",
    icon: Bolt,
    color: "bg-sky-50 text-sky-950 border-sky-300",
  },
  {
    name: "TPU",
    label: "home.materials.tpuTitle",
    text: "home.materials.tpuText",
    icon: Ban,
    color: "bg-amber-50 text-amber-950 border-amber-300",
  },
] as const;

export default function MaterialFeatures() {
  const { t } = useI18n();
  return (
    <section className="rounded-[2rem] bg-[#102b25] p-6 text-white sm:p-10">
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
          {t("home.materials.eyebrow")}
        </p>
        <h2 className="mt-2 text-4xl font-black">
          {t("home.materials.title")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/65">
          {t("home.materials.subtitle")}
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {materials.map(({ name, label, text, icon: Icon, color }) => (
          <article key={name} className={`rounded-2xl border p-5 ${color}`}>
            <Icon size={25} />
            <p className="mt-6 text-xs font-black uppercase tracking-widest">
              {name}
            </p>
            <h3 className="mt-1 text-xl font-black">{t(label)}</h3>
            <p className="mt-3 text-sm leading-6 font-medium">{t(text)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
