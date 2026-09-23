import { Box, Layers3, ShieldCheck, Sparkles } from "lucide-react";

const pieces = [
  {
    title: "Functionele onderdelen",
    tag: "Nauwkeurig",
    icon: Box,
    tone: "from-emerald-900 to-teal-600",
  },
  {
    title: "Productprototypes",
    tag: "Snel getest",
    icon: Sparkles,
    tone: "from-slate-900 to-cyan-700",
  },
  {
    title: "Sterke behuizingen",
    tag: "Sterk",
    icon: ShieldCheck,
    tone: "from-amber-900 to-orange-600",
  },
  {
    title: "Detailwerk",
    tag: "Strak afgewerkt",
    icon: Layers3,
    tone: "from-stone-900 to-rose-700",
  },
];

export default function ShowcaseGallery() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            PrintCraft studio
          </p>
          <h2 className="site-heading mt-2 text-4xl font-black">
            Wat we voor je kunnen maken
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#5f736d]">
          Van een eerste idee tot een onderdeel dat elke dag moet presteren. Jij
          levert de richting, wij maken het tastbaar.
        </p>
      </div>
      <div className="grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-3 md:grid-flow-row md:grid-cols-4 md:overflow-visible">
        {pieces.map(({ title, tag, icon: Icon, tone }) => (
          <article
            key={title}
            className={`group relative min-h-64 overflow-hidden rounded-2xl bg-gradient-to-br ${tone} p-5 text-white shadow-lg transition-transform hover:-translate-y-1`}
          >
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border-[18px] border-white/10" />
            <Icon size={32} className="relative text-white/80" />
            <div className="relative mt-24">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                {tag}
              </span>
              <h3 className="mt-3 text-xl font-black">{title}</h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
