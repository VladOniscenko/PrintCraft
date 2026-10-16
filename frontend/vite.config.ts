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
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/faq", priority: "0.8", changefreq: "monthly" },
  { path: "/privacy", priority: "0.5", changefreq: "yearly" },
  { path: "/terms", priority: "0.5", changefreq: "yearly" },
  { path: "/refunds", priority: "0.5", changefreq: "yearly" },
  { path: "/shipping-policy", priority: "0.5", changefreq: "monthly" },
];

const crawlerFiles = {
  "/robots.txt": {
    contentType: "text/plain",
    source: `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /orders\nDisallow: /profile\nDisallow: /reset-password\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`,
  },
  "/sitemap.xml": {
    contentType: "application/xml",
    source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicIndexableRoutes
      .map(
        (r) =>
          `  <url>\n    <loc>${new URL(r.path, origin).href}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`,
      )
      .join("\n")}\n</urlset>\n`,
  },
};

const homeInitialHtml = `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <header class="site-navbar px-5 py-3.5 flex items-center justify-between border-b border-[#d8e6df] bg-white/80">
    <a href="/" class="font-black text-xl text-[#0f766e]">${businessInfo.name}</a>
    <nav class="flex items-center gap-4 text-sm font-medium">
      <a href="/" class="text-[#0f766e] font-bold">Home</a>
      <a href="/faq" class="text-gray-700 hover:text-[#0f766e]">FAQ</a>
      <a href="/checkout" class="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500">Offerte Aanvragen</a>
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
        <a href="/checkout" class="px-7 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500">
          Direct Offerte Aanvragen
        </a>
        <a href="/faq" class="px-6 py-3.5 rounded-2xl font-semibold text-sm bg-white border border-[#d8e6df] text-gray-800 hover:bg-gray-50">
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
      <a href="/privacy" class="hover:text-emerald-700">Privacybeleid</a>
      <a href="/terms" class="hover:text-emerald-700">Algemene Voorwaarden</a>
      <a href="/refunds" class="hover:text-emerald-700">Retourbeleid</a>
      <a href="/shipping-policy" class="hover:text-emerald-700">Verzendbeleid</a>
      <a href="/faq" class="hover:text-emerald-700">FAQ</a>
    </div>
    <p>© 2026 ${businessInfo.name}. Professionele 3D Print Service Nederland.</p>
  </footer>
</div>
`.trim();

const preRenderPages: Record<
  string,
  {
    title: string;
    description: string;
    keywords: string;
    jsonLd: SchemaGraph;
    initialHtml: string;
  }
> = {
  "/faq": {
    title: `Veelgestelde Vragen 3D Printen | ${businessInfo.name} FAQ`,
    description:
      "Vragen over 3D-printen, materialen (PLA/PETG/TPU), levertijden (2-5 werkdagen), bestandstypen (STL/3MF) of prijzen? Bekijk hier alle antwoorden.",
    keywords:
      "3D print FAQ Nederland, vragen 3D printen, levertijd 3D print, kosten 3D printen, bestandstypen STL 3MF",
    jsonLd: buildFaqJsonLd(
      `${origin}/faq`,
      `Veelgestelde Vragen 3D Printen | ${businessInfo.name} FAQ`,
      "Vragen over 3D-printen, materialen (PLA/PETG/TPU), levertijden (2-5 werkdagen), bestandstypen (STL/3MF) of prijzen? Bekijk hier alle antwoorden.",
      "nl",
    ),
    initialHtml: `
<div class="min-h-screen bg-[#f4f8f6] text-[#17231f] flex flex-col font-sans">
  <header class="site-navbar px-5 py-3.5 flex items-center justify-between border-b border-[#d8e6df] bg-white/80">
    <a href="/" class="font-black text-xl text-[#0f766e]">${businessInfo.name}</a>
    <nav class="flex items-center gap-4 text-sm font-medium">
      <a href="/" class="text-gray-700 hover:text-[#0f766e]">Home</a>
      <a href="/faq" class="text-[#0f766e] font-bold">FAQ</a>
      <a href="/checkout" class="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500">Offerte Aanvragen</a>
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
        <a href="/checkout" class="px-6 py-3 rounded-xl bg-gray-100 text-gray-800 font-bold text-sm hover:bg-gray-200">Vraag een Offerte Aan</a>
      </div>
    </div>
  </main>
</div>
`.trim(),
  },
  "/privacy": {
    title: `Privacybeleid | ${businessInfo.name}`,
    description: `Privacybeleid van ${businessInfo.name}. Hoe wij persoonsgegevens en geüploade 3D-bestanden beveiligen en verwerken conform de AVG.`,
    keywords: "privacy policy, AVG, GDPR, data protection",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/privacy`,
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
  "/terms": {
    title: `Algemene Voorwaarden | ${businessInfo.name}`,
    description: `Algemene voorwaarden van ${businessInfo.name} voor 3D-printdiensten, offertes, bestellingen en maatwerkproductie.`,
    keywords: "terms of service, algemene voorwaarden, 3D printing terms",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/terms`,
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
  "/refunds": {
    title: `Retour- en Terugbetalingsbeleid | ${businessInfo.name}`,
    description: `Informatie over onze kwaliteitsgarantie, gratis herprints bij printfouten en ons beleid rond maatwerkbestellingen.`,
    keywords: "refund policy, retourbeleid, garantie 3D printen",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/refunds`,
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
  "/shipping-policy": {
    title: `Verzendbeleid & Levering | ${businessInfo.name}`,
    description: `Verzendinformatie van ${businessInfo.name}. Snelle levering binnen 2-5 werkdagen in heel Nederland met betrouwbare pakketbezorging.`,
    keywords: "shipping policy, verzendbeleid, levertijd 3D printen Nederland",
    jsonLd: buildStandardWebPageJsonLd(
      `${origin}/shipping-policy`,
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
      `${origin}/`,
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
            __BUSINESS_HOME_URL__: `${origin}/`,
            __BUSINESS_OG_IMAGE__: `${origin}/uploads/hero/materials.svg`,
            __BUSINESS_HOMEPAGE_JSONLD__: homepageJsonLdString,
            __INITIAL_HTML__: homeInitialHtml,
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
            const pageDir = path.join(distDir, routePath.slice(1));
            fs.mkdirSync(pageDir, { recursive: true });

            const routeCanonical = `${origin}${routePath}`;
            let pageHtml = baseHtml;

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

            // Replace og:url
            pageHtml = pageHtml.replace(
              /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i,
              `<meta property="og:url" content="${routeCanonical}" />`,
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
