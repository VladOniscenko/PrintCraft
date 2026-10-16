import { createServer } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.resolve(root, "dist");
const indexHtmlPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexHtmlPath)) {
  console.error("dist/index.html not found, skipping prerender");
  process.exit(0);
}

const baseHtml = fs.readFileSync(indexHtmlPath, "utf-8");

const vite = await createServer({
  root,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});

const { renderPage } = await vite.ssrLoadModule("/src/prerender.tsx");
const { businessInfo } = await vite.ssrLoadModule("/src/config/businessInfo.ts");
const {
  buildFaqJsonLd,
  buildHomepageJsonLd,
  buildStandardWebPageJsonLd,
  getValidatedOrigin,
} = await vite.ssrLoadModule("/src/utils/seoStructuredData.ts");

const origin = getValidatedOrigin(businessInfo.website);

const preRenderPages = {
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
  },
  "/en/faq": {
    lang: "en",
    subPath: "/faq",
    title: `3D Printing FAQ | ${businessInfo.name} Frequently Asked Questions`,
    description:
      "Questions about 3D printing, materials (PLA/PETG/TPU), turnaround times (2-5 days), file formats (STL/3MF), or pricing? Find all answers here.",
    keywords:
      "3D print FAQ Netherlands, 3D printing questions, lead times, 3D printing cost, accepted file types STL 3MF",
    jsonLd: buildFaqJsonLd(
      `${origin}/en/faq`,
      `3D Printing FAQ | ${businessInfo.name} Frequently Asked Questions`,
      "Questions about 3D printing, materials (PLA/PETG/TPU), turnaround times (2-5 days), file formats (STL/3MF), or pricing? Find all answers here.",
      "en",
    ),
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
  },
};

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

  pageHtml = pageHtml.replace(
    /<noscript>\s*<meta\s+http-equiv="refresh"[\s\S]*?<\/noscript>/i,
    "",
  );
  pageHtml = pageHtml.replace(
    /<script>\s*\(function\(\)\s*\{[\s\S]*?p\s*===\s*["']\/["'][\s\S]*?<\/script>/i,
    "",
  );
  pageHtml = pageHtml.replace(/<html\b[^>]*>/i, `<html lang="${htmlLang}">`);
  pageHtml = pageHtml.replace(/<title>.*?<\/title>/i, `<title>${routeData.title}</title>`);
  pageHtml = pageHtml.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
    `<meta name="description" content="${routeData.description}" />`,
  );
  pageHtml = pageHtml.replace(
    /<meta\s+name="keywords"\s+content=".*?"\s*\/?>/i,
    `<meta name="keywords" content="${routeData.keywords}" />`,
  );
  pageHtml = pageHtml.replace(
    /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i,
    `<link rel="canonical" href="${routeCanonical}" />`,
  );
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
  pageHtml = pageHtml.replace(
    /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:url" content="${routeCanonical}" />`,
  );
  pageHtml = pageHtml.replace(
    /<meta\s+property="og:locale"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:locale" content="${ogLocale}" />`,
  );
  pageHtml = pageHtml.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:title" content="${routeData.title}" />`,
  );
  pageHtml = pageHtml.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:description" content="${routeData.description}" />`,
  );
  pageHtml = pageHtml.replace(
    /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${routeData.title}" />`,
  );
  pageHtml = pageHtml.replace(
    /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${routeData.description}" />`,
  );
  pageHtml = pageHtml.replace(
    /<script\s+type="application\/ld\+json"\s+id="seo-jsonld">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json" id="seo-jsonld">\n${JSON.stringify(routeData.jsonLd, null, 2)}\n    </script>`,
  );

  const dynamicHtml = renderPage(routePath);
  pageHtml = pageHtml.replace("<!--INITIAL_HTML-->", dynamicHtml);

  fs.writeFileSync(path.join(pageDir, "index.html"), pageHtml, "utf-8");
}

await vite.close();

// Clean up root index.html
fs.writeFileSync(indexHtmlPath, baseHtml.replace("<!--INITIAL_HTML-->", ""), "utf-8");
console.log("✅ Dynamic pre-rendering complete for crawlers!");

