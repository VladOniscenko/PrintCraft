import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";

type RouteSeo = {
  title: string;
  description: string;
  keywords: string;
  index: boolean;
};

function upsertMetaByName(name: string, content: string) {
  let meta = document.querySelector(`meta[name=\"${name}\"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function upsertMetaByProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property=\"${property}\"]`);
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

function upsertJsonLd(
  pathname: string,
  canonicalUrl: string,
  language: "en" | "nl",
  pageName: string,
) {
  const existing = document.getElementById("seo-jsonld");
  if (existing) {
    existing.remove();
  }

  if (pathname !== "/") {
    return;
  }

  const script = document.createElement("script");
  script.id = "seo-jsonld";
  script.type = "application/ld+json";
  script.text = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          name: "PrintCraft",
          url: window.location.origin,
          inLanguage: language === "nl" ? "nl-NL" : "en",
        },
        {
          "@type": "LocalBusiness",
          name: "PrintCraft",
          url: window.location.origin,
          areaServed: ["Netherlands"],
          address: {
            "@type": "PostalAddress",
            addressLocality: "Rotterdam",
            addressCountry: "NL",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 51.9244,
            longitude: 4.4777,
          },
          sameAs: [],
        },
        {
          "@type": "WebPage",
          name: pageName,
          url: canonicalUrl,
          inLanguage: language === "nl" ? "nl-NL" : "en",
        },
      ],
    },
    null,
    2,
  );
  document.head.appendChild(script);
}

export default function SeoManager() {
  const location = useLocation();
  const { t, language } = useI18n();

  useEffect(() => {
    const defaultSeo: RouteSeo = {
      title: t("seo.default.title"),
      description: t("seo.default.description"),
      keywords: t("seo.default.keywords"),
      index: true,
    };

    const seoByRoute: Record<string, RouteSeo> = {
      "/": {
        title: t("seo.home.title"),
        description: t("seo.home.description"),
        keywords: t("seo.home.keywords"),
        index: true,
      },
      "/faq": {
        title: t("seo.faq.title"),
        description: t("seo.faq.description"),
        keywords: t("seo.faq.keywords"),
        index: true,
      },
      "/login": {
        title: `${t("nav.logIn")} | PrintCraft`,
        description: `${t("nav.logIn")} PrintCraft`,
        keywords: "PrintCraft login",
        index: false,
      },
      "/signup": {
        title: `${t("nav.getStarted")} | PrintCraft`,
        description: `${t("nav.getStarted")} PrintCraft`,
        keywords: "PrintCraft signup",
        index: false,
      },
      "/quote": {
        title: `${t("hero.ctaQuote")} | PrintCraft`,
        description: `${t("hero.ctaQuote")} PrintCraft`,
        keywords: "3D print quote",
        index: false,
      },
      "/orders": {
        title: `${t("nav.myOrders")} | PrintCraft`,
        description: `${t("nav.myOrders")} PrintCraft`,
        keywords: "orders",
        index: false,
      },
      "/profile": {
        title: `${t("nav.myProfile")} | PrintCraft`,
        description: `${t("nav.myProfile")} PrintCraft`,
        keywords: "orders",
        index: false,
      },
    };

    const pathname = location.pathname;

    const knownDynamicPatterns = [
      "/orders/:id",
      "/orders/:id/models/:itemIndex",
      "/admin/orders/:id",
      "/admin/orders/:id/models/:itemIndex",
      "/admin/models/view/:fileName",
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
      title: t("seo.notFound.title"),
      description: t("seo.notFound.description"),
      keywords: t("seo.notFound.keywords"),
      index: false,
    };

    const isOrderDetail = pathname.startsWith("/orders/");
    const routeSeo = !isKnownRoute
      ? notFoundSeo
      : isOrderDetail
        ? { ...seoByRoute["/orders"], index: false }
        : seoByRoute[pathname] || defaultSeo;

    const canonicalUrl = `${window.location.origin}${pathname}`;

    document.documentElement.lang = language === "nl" ? "nl-NL" : "en";
    document.title = routeSeo.title;

    upsertMetaByName("description", routeSeo.description);
    upsertMetaByName("keywords", routeSeo.keywords);
    upsertMetaByName(
      "robots",
      routeSeo.index ? "index, follow" : "noindex, nofollow",
    );

    upsertMetaByProperty("og:title", routeSeo.title);
    upsertMetaByProperty("og:description", routeSeo.description);
    upsertMetaByProperty("og:url", canonicalUrl);
    upsertMetaByProperty("og:locale", language === "nl" ? "nl_NL" : "en_US");

    upsertMetaByName("twitter:title", routeSeo.title);
    upsertMetaByName("twitter:description", routeSeo.description);

    upsertCanonical(canonicalUrl);
    upsertJsonLd(pathname, canonicalUrl, language, routeSeo.title);
  }, [language, location.pathname, t]);

  return null;
}
