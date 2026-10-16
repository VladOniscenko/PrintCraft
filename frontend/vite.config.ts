import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";
import { businessInfo } from "./src/config/businessInfo";
import {
  buildFaqJsonLd,
  buildHomepageJsonLd,
  buildStandardWebPageJsonLd,
  getValidatedOrigin,
  type SchemaGraph,
} from "./src/utils/seoStructuredData";

const origin = getValidatedOrigin(businessInfo.website);
const today = new Date().toISOString().split("T")[0];

const publicIndexableRoutes = [
  { subPath: "", priority: "1.0", changefreq: "weekly" },
  { subPath: "/faq", priority: "0.8", changefreq: "monthly" },
  { subPath: "/privacy", priority: "0.5", changefreq: "yearly" },
  { subPath: "/terms", priority: "0.5", changefreq: "yearly" },
  { subPath: "/refunds", priority: "0.5", changefreq: "yearly" },
  { subPath: "/shipping-policy", priority: "0.5", changefreq: "monthly" },
];

const crawlerFiles = {
  "/robots.txt": {
    contentType: "text/plain",
    source: `User-agent: *
Allow: /
Disallow: /admin
Disallow: /orders
Disallow: /profile
Disallow: /reset-password
Disallow: /*/admin
Disallow: /*/orders
Disallow: /*/profile
Disallow: /*/reset-password
Disallow: /api/

Sitemap: ${origin}/sitemap.xml
`,
  },
  "/sitemap.xml": {
    contentType: "application/xml",
    source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${publicIndexableRoutes
  .map(
    (r) => `  <url>
    <loc>${origin}/nl${r.subPath}</loc>
    <xhtml:link rel="alternate" hreflang="nl" href="${origin}/nl${r.subPath}" />
    <xhtml:link rel="alternate" hreflang="en" href="${origin}/en${r.subPath}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/nl${r.subPath}" />
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>
  <url>
    <loc>${origin}/en${r.subPath}</loc>
    <xhtml:link rel="alternate" hreflang="nl" href="${origin}/nl${r.subPath}" />
    <xhtml:link rel="alternate" hreflang="en" href="${origin}/en${r.subPath}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/nl${r.subPath}" />
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${(Number(r.priority) * 0.9).toFixed(1)}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`,
  },
};

const homeInitialHtmlNl = `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <header class="site-navbar px-5 py-3.5 flex items-center justify-between border-b border-[#d8e6df] bg-white/80">
    <a href="/nl" class="font-black text-xl text-[#0f766e]">${businessInfo.name}</a>
    <nav class="flex items-center gap-4 text-sm font-medium">
      <a href="/nl" class="text-[#0f766e] font-bold">Home</a>
      <a href="/nl/faq" class="text-gray-700 hover:text-[#0f766e]">FAQ</a>
      <a href="/nl/checkout" class="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500">Offerte Aanvragen</a>
    </nav>
  </header>
  <main class="site-main px-4 py-12 space-y-12 max-w-5xl mx-auto w-full">
    <section class="text-center space-y-5">
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">3D Print Service Nederland · Rotterdam</p>
      <h1 class="text-4xl sm:text-5xl font-black text-[#17231f] tracking-tight">
        Professionele 3D Print Service Nederland
      </h1>
      <p class="text-base sm:text-lg text-[#4a5f58] max-w-2xl mx-auto leading-relaxed">
        Upload je 3D-bestand (.STL of .3MF), kies uit hoogwaardig PLA, slagvast PETG of flexibel TPU en ontvang direct een offerte op maat. Snelle levering binnen 2-5 werkdagen in heel Nederland.
      </p>
      <div class="flex flex-wrap justify-center gap-4 pt-3">
        <a href="/nl/checkout" class="px-7 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500">
          Direct Offerte Aanvragen
        </a>
        <a href="/nl/faq" class="px-6 py-3.5 rounded-2xl font-semibold text-sm bg-white border border-[#d8e6df] text-gray-800 hover:bg-gray-50">
          Veelgestelde Vragen
        </a>
      </div>
    </section>
    <section class="space-y-6">
      <h2 class="text-2xl font-black text-[#17231f]">Hoe Onze 3D Print Service Werkt</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <article class="p-6 rounded-2xl border border-[#d8e6df] bg-white shadow-sm space-y-3">
          <span class="text-sm font-black text-amber-600">01</span>
          <h3 class="text-xl font-black text-[#17231f]">Upload 3D-Model (.STL / .3MF)</h3>
          <p class="text-sm leading-6 text-[#5f736d]">Sleep je bestand in onze 3D configurator voor automatische afmetings- en volumeberekening.</p>
        </article>
        <article class="p-6 rounded-2xl border border-[#d8e6df] bg-white shadow-sm space-y-3">
          <span class="text-sm font-black text-amber-600">02</span>
          <h3 class="text-xl font-black text-[#17231f]">Kies Filament &amp; Eigenschappen</h3>
          <p class="text-sm leading-6 text-[#5f736d]">Kies uit duurzaam PLA, slagvast PETG of flexibel TPU in diverse kleuren met transparante prijzen.</p>
        </article>
        <article class="p-6 rounded-2xl border border-[#d8e6df] bg-white shadow-sm space-y-3">
          <span class="text-sm font-black text-amber-600">03</span>
          <h3 class="text-xl font-black text-[#17231f]">Precisie Printen &amp; Bezorging</h3>
          <p class="text-sm leading-6 text-[#5f736d]">Geprint met ±0.1mm nauwkeurigheid en binnen 2-5 werkdagen zorgvuldig verpakt bezorgd.</p>
        </article>
      </div>
    </section>
    <section class="rounded-[2rem] bg-[#102b25] p-6 text-white sm:p-10 space-y-6">
      <h2 class="text-2xl sm:text-3xl font-black">Ondersteunde Materialen &amp; Filamenten</h2>
      <div class="grid gap-4 md:grid-cols-3 text-gray-900">
        <div class="rounded-2xl border p-5 bg-emerald-50 text-emerald-900">
          <p class="text-xs font-black uppercase tracking-widest opacity-70">PLA</p>
          <h3 class="mt-1 text-xl font-black">Dagelijks Gebruik</h3>
          <p class="mt-2 text-sm leading-6">Ideaal voor prototypes, organizers, schaalmodellen en decoratieve prints.</p>
        </div>
        <div class="rounded-2xl border p-5 bg-sky-50 text-sky-900">
          <p class="text-xs font-black uppercase tracking-widest opacity-70">PETG</p>
          <h3 class="mt-1 text-xl font-black">Extra Sterk &amp; Weerbestendig</h3>
          <p class="mt-2 text-sm leading-6">Voor functionele behuizingen en onderdelen die mechanische belasting en vocht moeten doorstaan.</p>
        </div>
        <div class="rounded-2xl border p-5 bg-amber-50 text-amber-900">
          <p class="text-xs font-black uppercase tracking-widest opacity-70">TPU</p>
          <h3 class="mt-1 text-xl font-black">Flexibel &amp; Schokabsorberend</h3>
          <p class="mt-2 text-sm leading-6">Voor grips, beschermhoezen, pakkingen en onderdelen die moeten buigen.</p>
        </div>
      </div>
    </section>
  </main>
  <footer class="mt-auto border-t border-[#d8e6df] bg-white px-6 py-6 text-center text-xs text-[#5f736d]">
    <div class="flex flex-wrap justify-center gap-6 mb-3">
      <a href="/nl/privacy" class="hover:text-emerald-700">Privacybeleid</a>
      <a href="/nl/terms" class="hover:text-emerald-700">Algemene Voorwaarden</a>
      <a href="/nl/refunds" class="hover:text-emerald-700">Retourbeleid</a>
      <a href="/nl/shipping-policy" class="hover:text-emerald-700">Verzendbeleid</a>
      <a href="/nl/faq" class="hover:text-emerald-700">FAQ</a>
    </div>
    <p>© 2026 ${businessInfo.name}. Professionele 3D Print Service Nederland.</p>
  </footer>
</div>
`.trim();

const homeInitialHtmlEn = `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <header class="site-navbar px-5 py-3.5 flex items-center justify-between border-b border-[#d8e6df] bg-white/80">
    <a href="/en" class="font-black text-xl text-[#0f766e]">${businessInfo.name}</a>
    <nav class="flex items-center gap-4 text-sm font-medium">
      <a href="/en" class="text-[#0f766e] font-bold">Home</a>
      <a href="/en/faq" class="text-gray-700 hover:text-[#0f766e]">FAQ</a>
      <a href="/en/checkout" class="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500">Get Quote</a>
    </nav>
  </header>
  <main class="site-main px-4 py-12 space-y-12 max-w-5xl mx-auto w-full">
    <section class="text-center space-y-5">
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">3D Printing Service Netherlands · Rotterdam</p>
      <h1 class="text-4xl sm:text-5xl font-black text-[#17231f] tracking-tight">
        Professional 3D Printing Service Netherlands
      </h1>
      <p class="text-base sm:text-lg text-[#4a5f58] max-w-2xl mx-auto leading-relaxed">
        Upload your 3D file (.STL or .3MF), choose premium PLA, impact-resistant PETG or flexible TPU, and get an instant custom quote. Fast delivery within 2-5 business days across the Netherlands.
      </p>
      <div class="flex flex-wrap justify-center gap-4 pt-3">
        <a href="/en/checkout" class="px-7 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500">
          Get Instant 3D Quote
        </a>
        <a href="/en/faq" class="px-6 py-3.5 rounded-2xl font-semibold text-sm bg-white border border-[#d8e6df] text-gray-800 hover:bg-gray-50">
          Frequently Asked Questions
        </a>
      </div>
    </section>
    <section class="space-y-6">
      <h2 class="text-2xl font-black text-[#17231f]">How Our 3D Printing Service Works</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <article class="p-6 rounded-2xl border border-[#d8e6df] bg-white shadow-sm space-y-3">
          <span class="text-sm font-black text-amber-600">01</span>
          <h3 class="text-xl font-black text-[#17231f]">Upload 3D Model (.STL / .3MF)</h3>
          <p class="text-sm leading-6 text-[#5f736d]">Drop your model into our 3D configurator for instant volume, size and geometry validation.</p>
        </article>
        <article class="p-6 rounded-2xl border border-[#d8e6df] bg-white shadow-sm space-y-3">
          <span class="text-sm font-black text-amber-600">02</span>
          <h3 class="text-xl font-black text-[#17231f]">Choose Filament &amp; Specs</h3>
          <p class="text-sm leading-6 text-[#5f736d]">Pick from daily PLA, industrial PETG or shock-absorbing TPU in various colors with live pricing.</p>
        </article>
        <article class="p-6 rounded-2xl border border-[#d8e6df] bg-white shadow-sm space-y-3">
          <span class="text-sm font-black text-amber-600">03</span>
          <h3 class="text-xl font-black text-[#17231f]">Precision Printing &amp; Delivery</h3>
          <p class="text-sm leading-6 text-[#5f736d]">Manufactured with ±0.1mm precision and shipped securely within 2-5 business days across the Netherlands.</p>
        </article>
      </div>
    </section>
    <section class="rounded-[2rem] bg-[#102b25] p-6 text-white sm:p-10 space-y-6">
      <h2 class="text-2xl sm:text-3xl font-black">Supported Materials &amp; Filaments</h2>
      <div class="grid gap-4 md:grid-cols-3 text-gray-900">
        <div class="rounded-2xl border p-5 bg-emerald-50 text-emerald-900">
          <p class="text-xs font-black uppercase tracking-widest opacity-70">PLA</p>
          <h3 class="mt-1 text-xl font-black">Daily Use &amp; Prototyping</h3>
          <p class="mt-2 text-sm leading-6">Ideal for rapid prototypes, visual architectural models, organizers, and decorative prints.</p>
        </div>
        <div class="rounded-2xl border p-5 bg-sky-50 text-sky-900">
          <p class="text-xs font-black uppercase tracking-widest opacity-70">PETG</p>
          <h3 class="mt-1 text-xl font-black">Strong &amp; Weather-Resistant</h3>
          <p class="mt-2 text-sm leading-6">Great for mechanical housings, outdoor applications, and functional end-use parts.</p>
        </div>
        <div class="rounded-2xl border p-5 bg-amber-50 text-amber-900">
          <p class="text-xs font-black uppercase tracking-widest opacity-70">TPU</p>
          <h3 class="mt-1 text-xl font-black">Flexible &amp; Shock-Absorbing</h3>
          <p class="mt-2 text-sm leading-6">Engineered for vibration dampers, custom seals, durable protective sleeves, and flexible hinges.</p>
        </div>
      </div>
    </section>
  </main>
  <footer class="mt-auto border-t border-[#d8e6df] bg-white px-6 py-6 text-center text-xs text-[#5f736d]">
    <div class="flex flex-wrap justify-center gap-6 mb-3">
      <a href="/en/privacy" class="hover:text-emerald-700">Privacy Policy</a>
      <a href="/en/terms" class="hover:text-emerald-700">Terms of Service</a>
      <a href="/en/refunds" class="hover:text-emerald-700">Refund Policy</a>
      <a href="/en/shipping-policy" class="hover:text-emerald-700">Shipping Policy</a>
      <a href="/en/faq" class="hover:text-emerald-700">FAQ</a>
    </div>
    <p>© 2026 ${businessInfo.name}. Professional 3D Printing Service Netherlands.</p>
  </footer>
</div>
`.trim();

const preRenderPages: Record<
  string,
  {
    lang: "nl" | "en";
    subPath: string;
    title: string;
    description: string;
    keywords: string;
    jsonLd: SchemaGraph;
    initialHtml: string;
  }
> = {
  "/nl": {
    lang: "nl",
    subPath: "",
    title: `3D Print Service Nederland | ${businessInfo.name} - Snel & Op Maat`,
    description:
      "Professionele 3D print service in Nederland. Upload je 3D-bestand (STL/3MF), kies PLA, PETG of TPU en ontvang direct een offerte. Snelle levering binnen 2-5 werkdagen.",
    keywords:
      "3D print service Nederland, 3D printen Rotterdam, online 3D print service, maatwerk 3D print, FDM printen, PLA PETG TPU, prototype printen",
    jsonLd: buildHomepageJsonLd(
      `${origin}/nl`,
      `3D Print Service Nederland | ${businessInfo.name} - Snel & Op Maat`,
      "Professionele 3D print service in Nederland. Upload je 3D-bestand (STL/3MF), kies PLA, PETG of TPU en ontvang direct een offerte. Snelle levering binnen 2-5 werkdagen.",
      "nl",
    ),
    initialHtml: homeInitialHtmlNl,
  },
  "/en": {
    lang: "en",
    subPath: "",
    title: `Professional 3D Printing Service Netherlands | ${businessInfo.name} - Fast & Custom`,
    description:
      "Professional 3D printing service in the Netherlands. Upload your 3D file (.STL / .3MF), choose PLA, PETG or TPU, and get an instant quote. Fast delivery within 2-5 business days.",
    keywords:
      "3D printing service Netherlands, 3D printing Rotterdam, online 3D print service, custom 3D prints, FDM printing, PLA PETG TPU, prototype printing",
    jsonLd: buildHomepageJsonLd(
      `${origin}/en`,
      `Professional 3D Printing Service Netherlands | ${businessInfo.name} - Fast & Custom`,
      "Professional 3D printing service in the Netherlands. Upload your 3D file (.STL / .3MF), choose PLA, PETG or TPU, and get an instant quote. Fast delivery within 2-5 business days.",
      "en",
    ),
    initialHtml: homeInitialHtmlEn,
  },
  "/nl/faq": {
    lang: "nl",
    subPath: "/faq",
    title: `Veelgestelde Vragen 3D Printen | ${businessInfo.name} FAQ`,
    description:
      "Vragen over 3D-printen, materialen (PLA/PETG/TPU), levertijden (2-5 werkdagen), bestandstypen (STL/3MF) of prijzen? Bekijk hier alle antwoorden.",
    keywords:
      "3D print FAQ Nederland, vragen 3D printen, levertijd 3D print, kosten 3D printen, bestandstypen STL 3MF",
    jsonLd: buildFaqJsonLd(
      `${origin}/nl/faq`,
      `Veelgestelde Vragen 3D Printen | ${businessInfo.name} FAQ`,
      "Vragen over 3D-printen, materialen (PLA/PETG/TPU), levertijden (2-5 werkdagen), bestandstypen (STL/3MF) of prijzen? Bekijk hier alle antwoorden.",
      "nl",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <header class="site-navbar px-5 py-3.5 flex items-center justify-between border-b border-[#d8e6df] bg-white/80">
    <a href="/nl" class="font-black text-xl text-[#0f766e]">${businessInfo.name}</a>
    <nav class="flex items-center gap-4 text-sm font-medium">
      <a href="/nl" class="text-gray-700 hover:text-[#0f766e]">Home</a>
      <a href="/nl/faq" class="text-[#0f766e] font-bold">FAQ</a>
      <a href="/nl/checkout" class="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500">Offerte Aanvragen</a>
    </nav>
  </header>
  <main class="site-main max-w-4xl px-4 py-12 mx-auto w-full space-y-8">
    <div class="text-center space-y-3">
      <h1 class="text-3xl sm:text-4xl font-black text-[#17231f]">Veelgestelde Vragen 3D Printen</h1>
      <p class="text-base text-[#5f736d]">Vragen over 3D printen, levering of materialen? We helpen je graag.</p>
    </div>
    <div class="space-y-4">
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">Welke 3D-bestanden accepteren jullie?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">We accepteren de meest gebruikte bestandsformaten: .STL, .OBJ en .3MF. Andere formaten kun je meestal exporteren naar STL.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">Wat kost een maatwerk print?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">De prijs hangt af van grootte, infill en materiaal. Vraag een offerte aan voor een exacte prijs zonder verborgen kosten.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">Hoe lang duurt levering?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">Meestal printen en verzenden we binnen 2 tot 5 werkdagen. Levertijd hangt af van je locatie in Nederland.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">Ik heb een idee maar geen 3D-bestand. Kunnen jullie helpen?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">Ja. Deel schetsen of voorbeelden en we helpen met het maken van een printbaar model.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">Zijn prints voedselveilig?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">Standaard printmaterialen zijn meestal niet bedoeld voor direct voedselcontact. We adviseren graag over veiliger afwerking.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">Wat als mijn print beschadigd aankomt?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">Als je item beschadigd aankomt of grote printfouten heeft, stuur binnen 3 dagen een foto en we regelen een herprint.</p>
      </div>
    </div>
    <div class="p-8 bg-white rounded-2xl border border-[#d8e6df] text-center space-y-4">
      <p class="text-sm text-[#5f736d]">Nog een specifieke vraag over jouw 3D-model, gewenste materialen of toleranties?</p>
      <div class="flex flex-wrap justify-center gap-4">
        <a href="mailto:${businessInfo.email}" class="px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-600">${businessInfo.email}</a>
        <a href="/nl/checkout" class="px-6 py-3 rounded-xl bg-gray-100 text-gray-800 font-bold text-sm hover:bg-gray-200">Vraag een Offerte Aan</a>
      </div>
    </div>
  </main>
</div>
`.trim(),
  },
  "/en/faq": {
    lang: "en",
    subPath: "/faq",
    title: `Frequently Asked Questions 3D Printing | ${businessInfo.name} FAQ`,
    description:
      "Questions about 3D printing, materials (PLA/PETG/TPU), turnaround times (2-5 business days), file formats (STL/3MF) or pricing? Find all answers here.",
    keywords:
      "3D printing FAQ Netherlands, 3D printing questions, 3D print lead time, 3D printing cost, STL 3MF file formats",
    jsonLd: buildFaqJsonLd(
      `${origin}/en/faq`,
      `Frequently Asked Questions 3D Printing | ${businessInfo.name} FAQ`,
      "Questions about 3D printing, materials (PLA/PETG/TPU), turnaround times (2-5 business days), file formats (STL/3MF) or pricing? Find all answers here.",
      "en",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <header class="site-navbar px-5 py-3.5 flex items-center justify-between border-b border-[#d8e6df] bg-white/80">
    <a href="/en" class="font-black text-xl text-[#0f766e]">${businessInfo.name}</a>
    <nav class="flex items-center gap-4 text-sm font-medium">
      <a href="/en" class="text-gray-700 hover:text-[#0f766e]">Home</a>
      <a href="/en/faq" class="text-[#0f766e] font-bold">FAQ</a>
      <a href="/en/checkout" class="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500">Get Quote</a>
    </nav>
  </header>
  <main class="site-main max-w-4xl px-4 py-12 mx-auto w-full space-y-8">
    <div class="text-center space-y-3">
      <h1 class="text-3xl sm:text-4xl font-black text-[#17231f]">Frequently Asked Questions 3D Printing</h1>
      <p class="text-base text-[#5f736d]">Have questions about 3D printing, turnaround times, or materials? We are here to help.</p>
    </div>
    <div class="space-y-4">
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">Which 3D file formats do you accept?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">We support standard 3D formats including .STL, .OBJ and .3MF files. Most CAD packages can export directly to .STL or .3MF.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">How much does custom 3D printing cost?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">Pricing depends on part dimensions, infill percentage and material. Upload your file to our configurator for an instant transparent quote.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">What is your turnaround and delivery time?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">Most custom prints are manufactured and shipped within 2 to 5 business days across the Netherlands.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">I have an idea but no 3D file. Can you help?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">Yes! Send us sketches, specifications or drawings and we will assist you in modeling a printable 3D design.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">Are 3D printed parts food-safe?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">Standard FDM filaments are not certified for direct food contact. We can advise on food-grade coatings and post-processing.</p>
      </div>
      <div class="p-6 bg-white rounded-2xl border border-[#d8e6df] shadow-sm">
        <h2 class="text-lg font-bold text-[#17231f] mb-2">What if my print arrives damaged or defective?</h2>
        <p class="text-sm text-[#5f736d] leading-relaxed">If your print arrives damaged or has manufacturing defects, send us photos within 3 days and we will reprint it for free.</p>
      </div>
    </div>
    <div class="p-8 bg-white rounded-2xl border border-[#d8e6df] text-center space-y-4">
      <p class="text-sm text-[#5f736d]">Have a specific project question or custom volume requirements?</p>
      <div class="flex flex-wrap justify-center gap-4">
        <a href="mailto:${businessInfo.email}" class="px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-600">${businessInfo.email}</a>
        <a href="/en/checkout" class="px-6 py-3 rounded-xl bg-gray-100 text-gray-800 font-bold text-sm hover:bg-gray-200">Request Custom Quote</a>
      </div>
    </div>
  </main>
</div>
`.trim(),
  },
  "/nl/privacy": {
    lang: "nl",
    subPath: "/privacy",
    title: `Privacybeleid | ${businessInfo.name}`,
    description: `Privacybeleid van ${businessInfo.name}. Hoe wij persoonsgegevens en geüploade 3D-bestanden beveiligen en verwerken conform de AVG.`,
    keywords: "privacy policy, AVG, GDPR, data protection",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/nl/privacy`,
      `Privacybeleid | ${businessInfo.name}`,
      `Privacybeleid van ${businessInfo.name}.`,
      "nl",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <main class="site-main max-w-4xl px-4 py-12 mx-auto w-full space-y-6">
    <h1 class="text-3xl font-black text-[#17231f]">Privacybeleid</h1>
    <p class="text-sm text-[#5f736d] leading-relaxed">Wij hechten veel waarde aan de bescherming van je persoonsgegevens en de intellectuele eigendom van je geüploade 3D-modellen conform de Algemene Verordening Gegevensbescherming (AVG/GDPR).</p>
  </main>
</div>
`.trim(),
  },
  "/en/privacy": {
    lang: "en",
    subPath: "/privacy",
    title: `Privacy Policy | ${businessInfo.name}`,
    description: `Privacy Policy of ${businessInfo.name}. How we protect personal data and uploaded 3D files in full compliance with GDPR.`,
    keywords: "privacy policy, GDPR, data protection, custom 3D prints privacy",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/en/privacy`,
      `Privacy Policy | ${businessInfo.name}`,
      `Privacy Policy of ${businessInfo.name}.`,
      "en",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <main class="site-main max-w-4xl px-4 py-12 mx-auto w-full space-y-6">
    <h1 class="text-3xl font-black text-[#17231f]">Privacy Policy</h1>
    <p class="text-sm text-[#5f736d] leading-relaxed">We strictly protect your personal information and uploaded 3D design files in compliance with the General Data Protection Regulation (GDPR).</p>
  </main>
</div>
`.trim(),
  },
  "/nl/terms": {
    lang: "nl",
    subPath: "/terms",
    title: `Algemene Voorwaarden | ${businessInfo.name}`,
    description: `Algemene voorwaarden van ${businessInfo.name} voor 3D-printdiensten, offertes, bestellingen en maatwerkproductie.`,
    keywords: "terms of service, algemene voorwaarden, 3D printing terms",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/nl/terms`,
      `Algemene Voorwaarden | ${businessInfo.name}`,
      `Algemene voorwaarden van ${businessInfo.name}.`,
      "nl",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <main class="site-main max-w-4xl px-4 py-12 mx-auto w-full space-y-6">
    <h1 class="text-3xl font-black text-[#17231f]">Algemene Voorwaarden</h1>
    <p class="text-sm text-[#5f736d] leading-relaxed">Algemene voorwaarden voor maatwerk 3D-printdiensten, levertijden, aansprakelijkheid en bestellingen via ${businessInfo.name}.</p>
  </main>
</div>
`.trim(),
  },
  "/en/terms": {
    lang: "en",
    subPath: "/terms",
    title: `Terms of Service | ${businessInfo.name}`,
    description: `Terms and Conditions of ${businessInfo.name} governing custom 3D printing services, instant quotes, production and delivery.`,
    keywords: "terms of service, 3D printing terms and conditions, Netherlands 3D print",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/en/terms`,
      `Terms of Service | ${businessInfo.name}`,
      `Terms and Conditions of ${businessInfo.name}.`,
      "en",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <main class="site-main max-w-4xl px-4 py-12 mx-auto w-full space-y-6">
    <h1 class="text-3xl font-black text-[#17231f]">Terms of Service</h1>
    <p class="text-sm text-[#5f736d] leading-relaxed">Terms and conditions covering custom manufacturing orders, tolerances, turnaround and delivery through ${businessInfo.name}.</p>
  </main>
</div>
`.trim(),
  },
  "/nl/refunds": {
    lang: "nl",
    subPath: "/refunds",
    title: `Retour- en Terugbetalingsbeleid | ${businessInfo.name}`,
    description: `Informatie over onze kwaliteitsgarantie, gratis herprints bij printfouten en ons beleid rond maatwerkbestellingen.`,
    keywords: "refund policy, retourbeleid, garantie 3D printen",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/nl/refunds`,
      `Retour- en Terugbetalingsbeleid | ${businessInfo.name}`,
      `Retour- en Terugbetalingsbeleid van ${businessInfo.name}.`,
      "nl",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <main class="site-main max-w-4xl px-4 py-12 mx-auto w-full space-y-6">
    <h1 class="text-3xl font-black text-[#17231f]">Retour- en Terugbetalingsbeleid</h1>
    <p class="text-sm text-[#5f736d] leading-relaxed">Kwaliteitsbelofte: Mocht een print fabricagefouten vertonen of beschadigd arriveren, verzorgen wij kosteloos een herprint.</p>
  </main>
</div>
`.trim(),
  },
  "/en/refunds": {
    lang: "en",
    subPath: "/refunds",
    title: `Refund & Returns Policy | ${businessInfo.name}`,
    description: `Information about our quality guarantee, free reprints for manufacturing defects, and custom order policy.`,
    keywords: "refund policy, returns, 3D printing quality guarantee",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/en/refunds`,
      `Refund & Returns Policy | ${businessInfo.name}`,
      `Refund & Returns Policy of ${businessInfo.name}.`,
      "en",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <main class="site-main max-w-4xl px-4 py-12 mx-auto w-full space-y-6">
    <h1 class="text-3xl font-black text-[#17231f]">Refund &amp; Returns Policy</h1>
    <p class="text-sm text-[#5f736d] leading-relaxed">Quality Promise: If any print arrives with manufacturing defects or shipping damage, we reprint and ship it free of charge.</p>
  </main>
</div>
`.trim(),
  },
  "/nl/shipping-policy": {
    lang: "nl",
    subPath: "/shipping-policy",
    title: `Verzendbeleid & Levering | ${businessInfo.name}`,
    description: `Verzendinformatie van ${businessInfo.name}. Snelle levering binnen 2-5 werkdagen in heel Nederland met betrouwbare pakketbezorging.`,
    keywords: "shipping policy, verzendbeleid, levertijd 3D printen Nederland",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/nl/shipping-policy`,
      `Verzendbeleid & Levering | ${businessInfo.name}`,
      `Verzendbeleid van ${businessInfo.name}.`,
      "nl",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <main class="site-main max-w-4xl px-4 py-12 mx-auto w-full space-y-6">
    <h1 class="text-3xl font-black text-[#17231f]">Verzendbeleid &amp; Levering</h1>
    <p class="text-sm text-[#5f736d] leading-relaxed">Wij leveren in heel Nederland met een gemiddelde doorlooptijd van 2 tot 5 werkdagen na orderbevestiging.</p>
  </main>
</div>
`.trim(),
  },
  "/en/shipping-policy": {
    lang: "en",
    subPath: "/shipping-policy",
    title: `Shipping & Delivery Policy | ${businessInfo.name}`,
    description: `Shipping policy of ${businessInfo.name}. Fast turnaround and reliable delivery within 2-5 business days across the Netherlands.`,
    keywords: "shipping policy, Netherlands 3D print delivery, lead time",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/en/shipping-policy`,
      `Shipping & Delivery Policy | ${businessInfo.name}`,
      `Shipping policy of ${businessInfo.name}.`,
      "en",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <main class="site-main max-w-4xl px-4 py-12 mx-auto w-full space-y-6">
    <h1 class="text-3xl font-black text-[#17231f]">Shipping &amp; Delivery Policy</h1>
    <p class="text-sm text-[#5f736d] leading-relaxed">We deliver across the Netherlands with an average turnaround time of 2 to 5 business days after order confirmation.</p>
  </main>
</div>
`.trim(),
  },
};

export default defineConfig(({ mode }) => {
  const frontendEnv = loadEnv(mode, process.cwd(), "");
  const rootEnv = loadEnv(mode, path.resolve(process.cwd(), ".."), "");
  const devApiOrigin =
    frontendEnv.VITE_DEV_API_ORIGIN || rootEnv.VITE_DEV_API_ORIGIN;

  if (mode !== "production" && !devApiOrigin) {
    throw new Error("VITE_DEV_API_ORIGIN must be set in frontend env file.");
  }

  const server = {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    ...(devApiOrigin
      ? {
          proxy: {
            "/api": {
              target: devApiOrigin,
              changeOrigin: true,
              secure: false,
            },
            "/uploads": {
              target: devApiOrigin,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : {}),
  };

  const homepageJsonLdString = JSON.stringify(
    buildHomepageJsonLd(
      `${origin}/nl`,
      `3D Print Service Nederland | ${businessInfo.name} - Snel & Op Maat`,
      "Professionele 3D print service in Nederland. Upload je 3D-bestand (STL/3MF), kies PLA, PETG of TPU en ontvang direct een offerte. Snelle levering binnen 2-5 werkdagen.",
      "nl",
    ),
    null,
    2,
  );

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "business-metadata",
        transformIndexHtml(html) {
          const values: Record<string, string> = {
            __BUSINESS_NAME__: businessInfo.name,
            __BUSINESS_HOME_URL__: `${origin}/nl`,
            __BUSINESS_ALTERNATE_NL__: `${origin}/nl`,
            __BUSINESS_ALTERNATE_EN__: `${origin}/en`,
            __BUSINESS_ALTERNATE_DEFAULT__: `${origin}/nl`,
            __BUSINESS_OG_IMAGE__: `${origin}/uploads/hero/materials.svg`,
            __BUSINESS_HOMEPAGE_JSONLD__: homepageJsonLdString,
            __INITIAL_HTML__: homeInitialHtmlNl,
          };
          for (const [token, value] of Object.entries(values)) {
            html = html.replaceAll(token, value);
          }
          return html;
        },
        configureServer(devServer) {
          devServer.middlewares.use((request, response, next) => {
            const file =
              crawlerFiles[
                request.url?.split("?")[0] as keyof typeof crawlerFiles
              ];
            if (!file) return next();
            response.setHeader(
              "Content-Type",
              `${file.contentType}; charset=utf-8`,
            );
            response.end(file.source);
          });
        },
        generateBundle() {
          for (const [url, file] of Object.entries(crawlerFiles)) {
            this.emitFile({
              type: "asset",
              fileName: url.slice(1),
              source: file.source,
            });
          }
        },
        closeBundle() {
          const distDir = path.resolve(process.cwd(), "dist");
          const indexHtmlPath = path.join(distDir, "index.html");
          if (!fs.existsSync(indexHtmlPath)) return;

          const baseHtml = fs.readFileSync(indexHtmlPath, "utf-8");

          for (const [routePath, routeData] of Object.entries(preRenderPages)) {
            const pageDir = path.join(distDir, routePath.replace(/^\//, ""));
            fs.mkdirSync(pageDir, { recursive: true });

            const routeCanonical = `${origin}${routePath}`;
            const alternateNl = `${origin}/nl${routeData.subPath}`;
            const alternateEn = `${origin}/en${routeData.subPath}`;
            const alternateDefault = `${origin}/nl${routeData.subPath}`;
            const htmlLang = routeData.lang === "en" ? "en" : "nl";
            const ogLocale = routeData.lang === "en" ? "en_US" : "nl_NL";

            let pageHtml = baseHtml;

            // Remove root redirect script & noscript refresh tag from pre-rendered localized pages
            pageHtml = pageHtml.replace(
              /<noscript>\s*<meta\s+http-equiv="refresh"[\s\S]*?<\/noscript>/i,
              "",
            );
            pageHtml = pageHtml.replace(
              /<script>\s*\(function\(\)\s*\{[\s\S]*?p\s*===\s*["']\/["'][\s\S]*?<\/script>/i,
              "",
            );

            // Replace html tag lang attribute
            pageHtml = pageHtml.replace(
              /<html\b[^>]*>/i,
              `<html lang="${htmlLang}">`,
            );

            // Replace title
            pageHtml = pageHtml.replace(
              /<title>.*?<\/title>/i,
              `<title>${routeData.title}</title>`,
            );

            // Replace meta description
            pageHtml = pageHtml.replace(
              /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
              `<meta name="description" content="${routeData.description}" />`,
            );

            // Replace meta keywords
            pageHtml = pageHtml.replace(
              /<meta\s+name="keywords"\s+content=".*?"\s*\/?>/i,
              `<meta name="keywords" content="${routeData.keywords}" />`,
            );

            // Replace canonical
            pageHtml = pageHtml.replace(
              /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i,
              `<link rel="canonical" href="${routeCanonical}" />`,
            );

            // Replace reciprocal alternate links
            pageHtml = pageHtml.replace(
              /<link\s+rel="alternate"\s+hreflang="nl"\s+href=".*?"\s*\/?>/i,
              `<link rel="alternate" hreflang="nl" href="${alternateNl}" />`,
            );
            pageHtml = pageHtml.replace(
              /<link\s+rel="alternate"\s+hreflang="en"\s+href=".*?"\s*\/?>/i,
              `<link rel="alternate" hreflang="en" href="${alternateEn}" />`,
            );
            pageHtml = pageHtml.replace(
              /<link\s+rel="alternate"\s+hreflang="x-default"\s+href=".*?"\s*\/?>/i,
              `<link rel="alternate" hreflang="x-default" href="${alternateDefault}" />`,
            );

            // Replace og:url
            pageHtml = pageHtml.replace(
              /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i,
              `<meta property="og:url" content="${routeCanonical}" />`,
            );

            // Replace og:locale
            pageHtml = pageHtml.replace(
              /<meta\s+property="og:locale"\s+content=".*?"\s*\/?>/i,
              `<meta property="og:locale" content="${ogLocale}" />`,
            );

            // Replace og:title
            pageHtml = pageHtml.replace(
              /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
              `<meta property="og:title" content="${routeData.title}" />`,
            );

            // Replace og:description
            pageHtml = pageHtml.replace(
              /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
              `<meta property="og:description" content="${routeData.description}" />`,
            );

            // Replace twitter:title
            pageHtml = pageHtml.replace(
              /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i,
              `<meta name="twitter:title" content="${routeData.title}" />`,
            );

            // Replace twitter:description
            pageHtml = pageHtml.replace(
              /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i,
              `<meta name="twitter:description" content="${routeData.description}" />`,
            );

            // Replace JSON-LD
            pageHtml = pageHtml.replace(
              /<script\s+type="application\/ld\+json"\s+id="seo-jsonld">[\s\S]*?<\/script>/i,
              `<script type="application/ld+json" id="seo-jsonld">\n${JSON.stringify(routeData.jsonLd, null, 2)}\n    </script>`,
            );

            // Replace #root inner HTML
            pageHtml = pageHtml.replace(
              /<div id="root">[\s\S]*?<\/div>/i,
              `<div id="root">${routeData.initialHtml}</div>`,
            );

            fs.writeFileSync(path.join(pageDir, "index.html"), pageHtml, "utf-8");
          }
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/three")) return "three-vendor";
            if (
              id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom")
            ) {
              return "react-vendor";
            }
            if (id.includes("node_modules/react-router-dom"))
              return "router-vendor";
            if (id.includes("node_modules/lucide-react")) return "icons-vendor";
            if (id.includes("node_modules/@dnd-kit")) return "dnd-kit-vendor";
            if (id.includes("node_modules/axios")) return "network-vendor";
          },
        },
      },
    },
    server,
  };
});
