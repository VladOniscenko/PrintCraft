import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { businessInfo } from "../config/businessInfo";
import {
  buildFaqJsonLd,
  buildHomepageJsonLd,
  buildStandardWebPageJsonLd,
  getValidatedOrigin,
} from "../utils/seoStructuredData";

export type RouteSeo = {
  title: string;
  description: string;
  keywords: string;
  index: boolean;
};

function upsertMetaByName(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function upsertMetaByProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function upsertCanonical(url: string) {
  let link = document.querySelector(
    "link[rel='canonical']",
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.href = url;
}

function removeCanonical() {
  const link = document.querySelector("link[rel='canonical']");
  if (link) {
    link.remove();
  }
}

function upsertJsonLd(
  pathname: string,
  canonicalUrl: string,
  language: "en" | "nl",
  pageTitle: string,
  pageDescription: string,
  isIndexable: boolean,
) {
  const existing = document.getElementById("seo-jsonld");
  if (existing) {
    existing.remove();
  }

  if (!isIndexable) {
    return;
  }

  let schemaGraph;
  if (pathname === "/") {
    schemaGraph = buildHomepageJsonLd(
      canonicalUrl,
      pageTitle,
      pageDescription,
      language,
    );
  } else if (pathname === "/faq") {
    schemaGraph = buildFaqJsonLd(
      canonicalUrl,
      pageTitle,
      pageDescription,
      language,
    );
  } else if (
    ["/privacy", "/terms", "/refunds", "/shipping-policy"].includes(pathname)
  ) {
    schemaGraph = buildStandardWebPageJsonLd(
      canonicalUrl,
      pageTitle,
      pageDescription,
      language,
    );
  }

  if (!schemaGraph) {
    return;
  }

  const script = document.createElement("script");
  script.id = "seo-jsonld";
  script.type = "application/ld+json";
  script.text = JSON.stringify(schemaGraph, null, 2);
  document.head.appendChild(script);
}

export function normalizePathname(rawPath: string): string {
  const cleaned = rawPath.split("?")[0]?.split("#")[0]?.trim() || "/";
  if (cleaned.length > 1 && cleaned.endsWith("/")) {
    return cleaned.slice(0, -1).toLowerCase();
  }
  return cleaned.toLowerCase();
}

export default function SeoManager() {
  const location = useLocation();
  const { t, language } = useI18n();

  useEffect(() => {
    const isNl = language === "nl";
    const origin = getValidatedOrigin(businessInfo.website);
    const ogImage = `${origin}/uploads/hero/materials.svg`;

    // 1. Static SEO definition for known public and internal routes
    const seoByRoute: Record<string, RouteSeo> = {
      "/": {
        title: isNl
          ? `3D Print Service Nederland | ${businessInfo.name} - Snel & Op Maat`
          : `3D Printing Service Netherlands | ${businessInfo.name} - Fast & Custom`,
        description: isNl
          ? `Professionele 3D print service in Nederland. Upload je 3D-bestand (STL/3MF), kies PLA, PETG of TPU en ontvang direct een offerte. Snelle levering binnen 2-5 werkdagen.`
          : `Professional 3D printing service in the Netherlands. Upload your 3D model (STL/3MF), choose PLA, PETG or TPU, and get an instant quote. Fast 2-5 business days delivery.`,
        keywords: isNl
          ? `3D print service Nederland, 3D printen Rotterdam, online 3D print service, maatwerk 3D print, FDM printen, PLA PETG TPU, prototype printen`
          : `3D printing service Netherlands, 3D print Rotterdam, custom 3D printing, FDM 3D prints, STL printing quote, rapid prototyping`,
        index: true,
      },
      "/faq": {
        title: isNl
          ? `Veelgestelde Vragen 3D Printen | ${businessInfo.name} FAQ`
          : `3D Printing FAQ | ${businessInfo.name} Frequently Asked Questions`,
        description: isNl
          ? `Vragen over 3D-printen, materialen (PLA/PETG/TPU), levertijden (2-5 werkdagen), bestandstypen (STL/3MF) of prijzen? Bekijk hier alle antwoorden.`
          : `Questions about 3D printing, materials (PLA/PETG/TPU), turnaround times (2-5 days), file formats (STL/3MF), or pricing? Find all answers here.`,
        keywords: isNl
          ? `3D print FAQ Nederland, vragen 3D printen, levertijd 3D print, kosten 3D printen, bestandstypen STL 3MF`
          : `3D print FAQ Netherlands, 3D printing questions, lead times, 3D printing cost, accepted file types STL 3MF`,
        index: true,
      },
      "/privacy": {
        title: isNl
          ? `Privacybeleid | ${businessInfo.name}`
          : `Privacy Policy | ${businessInfo.name}`,
        description: isNl
          ? `Privacybeleid van ${businessInfo.name}. Hoe wij persoonsgegevens en geüploade 3D-bestanden beveiligen en verwerken conform de AVG.`
          : `Privacy Policy of ${businessInfo.name}. How we protect and process personal data and uploaded 3D files under GDPR.`,
        keywords: "privacy policy, AVG, GDPR, data protection",
        index: true,
      },
      "/terms": {
        title: isNl
          ? `Algemene Voorwaarden | ${businessInfo.name}`
          : `Terms of Service | ${businessInfo.name}`,
        description: isNl
          ? `Algemene voorwaarden van ${businessInfo.name} voor 3D-printdiensten, offertes, bestellingen en maatwerkproductie.`
          : `Terms of Service of ${businessInfo.name} for 3D printing services, quotes, orders and custom manufacturing.`,
        keywords: "terms of service, algemene voorwaarden, 3D printing terms",
        index: true,
      },
      "/refunds": {
        title: isNl
          ? `Retour- en Terugbetalingsbeleid | ${businessInfo.name}`
          : `Refund and Return Policy | ${businessInfo.name}`,
        description: isNl
          ? `Informatie over onze kwaliteitsgarantie, gratis herprints bij printfouten en ons beleid rond maatwerkbestellingen.`
          : `Information about our quality guarantee, free reprints for defective prints, and return policy on custom orders.`,
        keywords: "refund policy, retourbeleid, garantie 3D printen",
        index: true,
      },
      "/shipping-policy": {
        title: isNl
          ? `Verzendbeleid & Levering | ${businessInfo.name}`
          : `Shipping Policy & Delivery Times | ${businessInfo.name}`,
        description: isNl
          ? `Verzendinformatie van ${businessInfo.name}. Snelle levering binnen 2-5 werkdagen in heel Nederland met betrouwbare pakketbezorging.`
          : `Shipping information for ${businessInfo.name}. Fast delivery within 2-5 business days across the Netherlands.`,
        keywords: "shipping policy, verzendbeleid, levertijd 3D printen Nederland",
        index: true,
      },
      // Non-indexable transactional funnel
      "/checkout": {
        title: `${t("hero.ctaQuote") || (isNl ? "Offerte Aanvragen" : "Request a Quote")} | ${businessInfo.name}`,
        description: `${t("hero.ctaQuote") || "Quote"} ${businessInfo.name}`,
        keywords: "3D print quote",
        index: false,
      },
      // Non-indexable auth routes
      "/login": {
        title: `${t("nav.logIn")} | ${businessInfo.name}`,
        description: `${t("nav.logIn")} ${businessInfo.name}`,
        keywords: `${businessInfo.name} login`,
        index: false,
      },
      "/signup": {
        title: `${t("nav.getStarted")} | ${businessInfo.name}`,
        description: `${t("nav.getStarted")} ${businessInfo.name}`,
        keywords: `${businessInfo.name} signup`,
        index: false,
      },
      "/forgot-password": {
        title: `${t("forgot.title")} | ${businessInfo.name}`,
        description: `${t("forgot.title")} ${businessInfo.name}`,
        keywords: `${businessInfo.name} forgot password`,
        index: false,
      },
      "/reset-password": {
        title: `${t("reset.title")} | ${businessInfo.name}`,
        description: `${t("reset.title")} ${businessInfo.name}`,
        keywords: `${businessInfo.name} reset password`,
        index: false,
      },
      // Authenticated user routes
      "/orders": {
        title: `${t("nav.myOrders")} | ${businessInfo.name}`,
        description: `${t("nav.myOrders")} ${businessInfo.name}`,
        keywords: "orders",
        index: false,
      },
      "/profile": {
        title: `${t("nav.myProfile")} | ${businessInfo.name}`,
        description: `${t("nav.myProfile")} ${businessInfo.name}`,
        keywords: "profile",
        index: false,
      },
      // Admin routes
      "/admin": {
        title: `${t("admin.nav.dashboard")} | ${businessInfo.name}`,
        description: `${t("admin.nav.dashboard")} ${businessInfo.name}`,
        keywords: "admin dashboard",
        index: false,
      },
      "/admin/orders": {
        title: `${t("admin.nav.orders")} | ${businessInfo.name}`,
        description: `${t("admin.nav.orders")} ${businessInfo.name}`,
        keywords: "admin orders",
        index: false,
      },
      "/admin/payments": {
        title: `${t("admin.nav.payments")} | ${businessInfo.name}`,
        description: `${t("admin.nav.payments")} ${businessInfo.name}`,
        keywords: "admin payments",
        index: false,
      },
      "/admin/models": {
        title: `${t("admin.nav.models")} | ${businessInfo.name}`,
        description: `${t("admin.nav.models")} ${businessInfo.name}`,
        keywords: "admin models",
        index: false,
      },
      "/admin/users": {
        title: `${t("admin.nav.users")} | ${businessInfo.name}`,
        description: `${t("admin.nav.users")} ${businessInfo.name}`,
        keywords: "admin users",
        index: false,
      },
      "/admin/filaments": {
        title: `${t("admin.nav.filaments")} | ${businessInfo.name}`,
        description: `${t("admin.nav.filaments")} ${businessInfo.name}`,
        keywords: "admin filaments",
        index: false,
      },
      "/admin/hero-slides": {
        title: `${t("admin.nav.heroSlides")} | ${businessInfo.name}`,
        description: `${t("admin.nav.heroSlides")} ${businessInfo.name}`,
        keywords: "admin hero slides",
        index: false,
      },
    };

    const pathname = normalizePathname(location.pathname);

    const knownDynamicPatterns = [
      "/orders/:id",
      "/admin/orders/:id",
      "/admin/models/view/:fileName",
      "/admin/users/:id",
    ];

    const isKnownDynamicRoute = knownDynamicPatterns.some((pattern) =>
      Boolean(matchPath({ path: pattern, end: true }, pathname)),
    );

    const isKnownExactRoute = Object.prototype.hasOwnProperty.call(
      seoByRoute,
      pathname,
    );

    const isKnownRoute = isKnownExactRoute || isKnownDynamicRoute;

    const notFoundSeo: RouteSeo = {
      title: isNl
        ? `Pagina niet gevonden | ${businessInfo.name}`
        : `Page Not Found | ${businessInfo.name}`,
      description: isNl
        ? `De opgevraagde pagina kon niet worden gevonden. Keer terug naar ${businessInfo.name} voor 3D-printdiensten.`
        : `The requested page could not be found. Return to ${businessInfo.name} for 3D printing services.`,
      keywords: "404, not found",
      index: false,
    };

    const isAdmin = pathname.startsWith("/admin");
    const isOrderDetail = pathname.startsWith("/orders/");

    const routeSeo: RouteSeo = !isKnownRoute
      ? notFoundSeo
      : isAdmin
        ? (seoByRoute[pathname] || {
            title: `${t("breadcrumb.admin")} | ${businessInfo.name}`,
            description: `${t("breadcrumb.admin")} ${businessInfo.name}`,
            keywords: "admin",
            index: false,
          })
        : isOrderDetail
          ? { ...seoByRoute["/orders"], index: false }
          : seoByRoute[pathname] || notFoundSeo;

    // Set Document Language (always reflect active user language)
    document.documentElement.lang = isNl ? "nl-NL" : "en";
    document.title = routeSeo.title;

    // Robots meta directive
    upsertMetaByName("description", routeSeo.description);
    upsertMetaByName("keywords", routeSeo.keywords);
    upsertMetaByName("author", businessInfo.name);
    upsertMetaByName(
      "robots",
      routeSeo.index ? "index, follow" : "noindex, nofollow",
    );

    // Canonical handling: Only generate a canonical for verified, indexable routes.
    // Prevent misleading canonical on 404s or private non-indexed pages.
    const canonicalUrl = `${origin}${pathname === "/" ? "/" : pathname}`;
    if (routeSeo.index) {
      upsertCanonical(canonicalUrl);
    } else {
      removeCanonical();
    }

    // Open Graph Metadata
    upsertMetaByProperty("og:site_name", businessInfo.name);
    upsertMetaByProperty("og:title", routeSeo.title);
    upsertMetaByProperty("og:description", routeSeo.description);
    upsertMetaByProperty("og:type", "website");
    upsertMetaByProperty("og:locale", isNl ? "nl_NL" : "en_US");
    upsertMetaByProperty("og:url", routeSeo.index ? canonicalUrl : origin);
    upsertMetaByProperty("og:image", ogImage);

    // Twitter Card Metadata
    upsertMetaByName("twitter:card", "summary_large_image");
    upsertMetaByName("twitter:title", routeSeo.title);
    upsertMetaByName("twitter:description", routeSeo.description);
    upsertMetaByName("twitter:image", ogImage);

    // Structured Data (JSON-LD)
    upsertJsonLd(
      pathname,
      canonicalUrl,
      language,
      routeSeo.title,
      routeSeo.description,
      routeSeo.index,
    );
  }, [language, location.pathname, t]);

  return null;
}
