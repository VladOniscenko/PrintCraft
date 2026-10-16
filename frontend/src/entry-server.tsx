import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "./i18n/I18nContext";
import {
  supportedLanguages,
  defaultLanguage,
  htmlLangMap,
  ogLocaleMap,
  resolveLanguage,
  type SupportedLanguage,
} from "./i18n/translations";
import { businessInfo } from "./config/businessInfo";
import { parsePath, getRouteSeo } from "./components/SeoManager";
import {
  buildCityJsonLd,
  buildFaqJsonLd,
  buildHomepageJsonLd,
  buildStandardWebPageJsonLd,
  getValidatedOrigin,
  type SchemaGraph,
} from "./utils/seoStructuredData";
import { getDutchCityBySlug, type DutchCity } from "./config/dutchCities";
import Home from "./components/Home";
import FAQ from "./components/FAQ";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import RefundPolicy from "./components/RefundPolicy";
import ShippingPolicy from "./components/ShippingPolicy";
import CityLandingPage from "./components/CityLandingPage";

export type RenderResult = {
  html: string;
  headTags: string;
  langAttr: string;
};

export function renderPage(url: string): RenderResult {
  const { urlLang, unlocalizedPath } = parsePath(url);
  const activeLang: SupportedLanguage = resolveLanguage(urlLang);
  const origin = getValidatedOrigin(businessInfo.website);

  const routeSeo = getRouteSeo(unlocalizedPath, activeLang);

  let PageComponent: React.ComponentType;
  let cityObj: DutchCity | undefined = undefined;

  if (unlocalizedPath.startsWith("/3d-print-service/")) {
    const slug = unlocalizedPath.replace("/3d-print-service/", "").split("/")[0];
    cityObj = getDutchCityBySlug(slug);
    if (cityObj) {
      const targetSlug = cityObj.slug;
      PageComponent = () => <CityLandingPage citySlug={targetSlug} />;
    } else {
      PageComponent = Home;
    }
  } else {
    switch (unlocalizedPath) {
      case "/":
        PageComponent = Home;
        break;
      case "/faq":
        PageComponent = FAQ;
        break;
      case "/privacy":
        PageComponent = PrivacyPolicy;
        break;
      case "/terms":
        PageComponent = TermsOfService;
        break;
      case "/refunds":
        PageComponent = RefundPolicy;
        break;
      case "/shipping-policy":
        PageComponent = ShippingPolicy;
        break;
      default:
        PageComponent = Home;
        break;
    }
  }

  const appHtml = renderToString(
    <MemoryRouter initialEntries={[url]}>
      <I18nProvider>
        <PageComponent />
      </I18nProvider>
    </MemoryRouter>,
  );

  const subRouteSuffix = unlocalizedPath === "/" ? "" : unlocalizedPath;
  const canonicalUrl = `${origin}/${activeLang}${subRouteSuffix}`;
  const ogImage = `${origin}/uploads/hero/materials.svg`;

  let jsonLdGraph: SchemaGraph | null = null;
  if (cityObj) {
    jsonLdGraph = buildCityJsonLd(
      canonicalUrl,
      cityObj,
      activeLang,
      routeSeo.title,
      routeSeo.description,
    );
  } else if (unlocalizedPath === "/") {
    jsonLdGraph = buildHomepageJsonLd(
      canonicalUrl,
      routeSeo.title,
      routeSeo.description,
      activeLang,
    );
  } else if (unlocalizedPath === "/faq") {
    jsonLdGraph = buildFaqJsonLd(
      canonicalUrl,
      routeSeo.title,
      routeSeo.description,
      activeLang,
    );
  } else if (
    ["/privacy", "/terms", "/refunds", "/shipping-policy"].includes(
      unlocalizedPath,
    )
  ) {
    jsonLdGraph = buildStandardWebPageJsonLd(
      canonicalUrl,
      routeSeo.title,
      routeSeo.description,
      activeLang,
    );
  }

  const headTags = [
    `<title>${routeSeo.title}</title>`,
    `<meta name="description" content="${routeSeo.description.replace(/"/g, "&quot;")}" />`,
    `<meta name="keywords" content="${routeSeo.keywords.replace(/"/g, "&quot;")}" />`,
    `<meta name="robots" content="${routeSeo.index ? "index, follow" : "noindex, nofollow"}" />`,
    `<meta name="author" content="${businessInfo.name.replace(/"/g, "&quot;")}" />`,
    `<link rel="canonical" href="${canonicalUrl}" />`,
    ...supportedLanguages.map(
      (sLang) =>
        `<link rel="alternate" hreflang="${sLang}" href="${origin}/${sLang}${subRouteSuffix}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${origin}/${defaultLanguage}${subRouteSuffix}" />`,
    `<meta property="og:site_name" content="${businessInfo.name.replace(/"/g, "&quot;")}" />`,
    `<meta property="og:title" content="${routeSeo.title.replace(/"/g, "&quot;")}" />`,
    `<meta property="og:description" content="${routeSeo.description.replace(/"/g, "&quot;")}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="${ogLocaleMap[activeLang] || "en_US"}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${routeSeo.title.replace(/"/g, "&quot;")}" />`,
    `<meta name="twitter:description" content="${routeSeo.description.replace(/"/g, "&quot;")}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    jsonLdGraph
      ? `<script type="application/ld+json" id="seo-jsonld">\n${JSON.stringify(jsonLdGraph, null, 2)}\n    </script>`
      : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  return {
    html: appHtml,
    headTags,
    langAttr: htmlLangMap[activeLang] || activeLang,
  };
}
