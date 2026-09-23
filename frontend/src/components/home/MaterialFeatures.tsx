import { Ban, Bolt, CircleDot } from "lucide-react";

const materials = [
  {
    name: "PLA",
    label: "Dagelijks gebruik",
    text: "Voor prototypes, organizers en onderdelen met een nette uitstraling.",
    icon: CircleDot,
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    name: "PETG",
    label: "Super sterk",
    text: "Voor functionele onderdelen die tegen warmte, vocht en belasting kunnen.",
    icon: Bolt,
    color: "bg-sky-50 text-sky-800 border-sky-200",
  },
  {
    name: "TPU",
    label: "Flexibel",
    text: "Voor grips, beschermers en onderdelen die moeten meebewegen.",
    icon: Ban,
    color: "bg-amber-50 text-amber-800 border-amber-200",
  },
];

export default function MaterialFeatures() {
  return (
    <section className="rounded-[2rem] bg-[#102b25] p-6 text-white sm:p-10">
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
          Materialen
        </p>
        <h2 className="mt-2 text-4xl font-black">Kies je kracht</h2>
        <p className="mt-3 text-sm leading-6 text-white/65">
          Nog niet zeker? Beschrijf je toepassing in je aanvraag. We helpen je
          met de juiste keuze.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {materials.map(({ name, label, text, icon: Icon, color }) => (
          <article key={name} className={`rounded-2xl border p-5 ${color}`}>
            <Icon size={25} />
            <p className="mt-6 text-xs font-black uppercase tracking-widest opacity-70">
              {name}
            </p>
            <h3 className="mt-1 text-xl font-black">{label}</h3>
            <p className="mt-3 text-sm leading-6 opacity-80">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
