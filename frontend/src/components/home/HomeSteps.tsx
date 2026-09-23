import { Box, PackageCheck, SlidersHorizontal } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Upload of beschrijf",
    text: "Deel je bestand of vertel wat je wilt laten maken.",
    icon: Box,
  },
  {
    number: "02",
    title: "Kies je materiaal",
    text: "Selecteer de eigenschappen die belangrijk zijn voor jouw toepassing.",
    icon: SlidersHorizontal,
  },
  {
    number: "03",
    title: "Wij printen & bezorgen",
    text: "We stemmen de details af, printen zorgvuldig en sturen het naar je op.",
    icon: PackageCheck,
  },
];

export default function HomeSteps() {
  return (
    <section className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          Van idee naar onderdeel
        </p>
        <h2 className="site-heading mt-2 text-4xl font-black">
          Zo simpel is het
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
            <h3 className="mt-5 text-xl font-black text-[#17231f]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f736d]">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
