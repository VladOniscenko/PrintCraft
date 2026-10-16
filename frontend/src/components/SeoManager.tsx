import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import {
  translations,
  supportedLanguages,
  defaultLanguage,
  isSupportedLanguage,
  htmlLangMap,
  ogLocaleMap,
  type SupportedLanguage,
} from "../i18n/translations";
import { businessInfo } from "../config/businessInfo";
import {
  buildCityJsonLd,
  buildApplicationJsonLd,
  buildFaqJsonLd,
  buildHomepageJsonLd,
  buildStandardWebPageJsonLd,
  getValidatedOrigin,
} from "../utils/seoStructuredData";
import { getDutchCityBySlug, getCityName } from "../config/dutchCities";
import { getSeoApplicationBySlug } from "../config/seoApplications";

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

function upsertHreflang(hreflang: string, href: string) {
  let link = document.querySelector(
    `link[rel='alternate'][hreflang="${hreflang}"]`,
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", hreflang);
    document.head.appendChild(link);
  }
  link.href = href;
}

function removeHreflangs() {
  const links = document.querySelectorAll(
    "link[rel='alternate'][hreflang]",
  );
  links.forEach((link) => link.remove());
}

function upsertJsonLd(
  unlocalizedPath: string,
  canonicalUrl: string,
  language: SupportedLanguage,
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
  const appMatch = matchPath(
    { path: "/oplossingen/:slug", end: true },
    unlocalizedPath,
  );
  const cityMatch = matchPath(
    { path: "/3d-print-service/:city", end: true },
    unlocalizedPath,
  );

  if (appMatch?.params.slug) {
    const app = getSeoApplicationBySlug(appMatch.params.slug);
    if (app) {
      schemaGraph = buildApplicationJsonLd(
        canonicalUrl,
        app,
        language,
        pageTitle,
        pageDescription,
      );
    }
  } else if (cityMatch?.params.city) {
    const city = getDutchCityBySlug(cityMatch.params.city);
    if (city) {
      schemaGraph = buildCityJsonLd(
        canonicalUrl,
        city,
        language,
        pageTitle,
        pageDescription,
      );
    }
  } else if (unlocalizedPath === "/") {
    schemaGraph = buildHomepageJsonLd(
      canonicalUrl,
      pageTitle,
      pageDescription,
      language,
    );
  } else if (unlocalizedPath === "/faq") {
    schemaGraph = buildFaqJsonLd(
      canonicalUrl,
      pageTitle,
      pageDescription,
      language,
    );
  } else if (
    ["/privacy", "/terms", "/refunds", "/shipping-policy"].includes(
      unlocalizedPath,
    )
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

export function parsePath(rawPath: string): {
  urlLang: SupportedLanguage | null;
  unlocalizedPath: string;
} {
  const cleaned = rawPath.split("?")[0]?.split("#")[0]?.trim() || "/";
  const segments = cleaned.split("/").filter(Boolean);

  if (isSupportedLanguage(segments[0])) {
    const urlLang = segments[0];
    const remainder = segments.slice(1).join("/").toLowerCase();
    const unlocalizedPath = remainder ? `/${remainder}` : "/";
    return { urlLang, unlocalizedPath };
  }

  const normalized = segments.join("/").toLowerCase();
  return {
    urlLang: null,
    unlocalizedPath: normalized ? `/${normalized}` : "/",
  };
}

export function getRouteSeo(
  unlocalizedPath: string,
  lang: SupportedLanguage,
): RouteSeo {
  const appMatch = matchPath(
    { path: "/oplossingen/:slug", end: true },
    unlocalizedPath,
  );
  if (appMatch?.params.slug) {
    const app = getSeoApplicationBySlug(appMatch.params.slug);
    if (app) {
      return {
        title: app.metaTitle[lang] || app.metaTitle.nl,
        description: app.metaDescription[lang] || app.metaDescription.nl,
        keywords: app.metaKeywords[lang] || app.metaKeywords.nl,
        index: true,
      };
    }
  }

  const cityMatch = matchPath(
    { path: "/3d-print-service/:city", end: true },
    unlocalizedPath,
  );
  if (cityMatch?.params.city) {
    const city = getDutchCityBySlug(cityMatch.params.city);
    if (city) {
      const cityName = getCityName(city, lang);
      const tCity = translations[lang]?.cityPage || translations[defaultLanguage].cityPage;
      return {
        title: tCity.metaTitle
          .replaceAll("{city}", cityName)
          .replaceAll("{company}", businessInfo.name),
        description: tCity.metaDescription.replaceAll("{city}", cityName),
        keywords: tCity.metaKeywords.replaceAll("{city}", cityName),
        index: true,
      };
    }
  }

  const seoData = translations[lang]?.seo || translations[defaultLanguage].seo;
  const routeMap: Record<string, RouteSeo> = {
    "/": {
      title: seoData.home.title,
      description: seoData.home.description,
      keywords: seoData.home.keywords,
      index: true,
    },
    "/faq": {
      title: seoData.faq.title,
      description: seoData.faq.description,
      keywords: seoData.faq.keywords,
      index: true,
    },
    "/privacy": {
      title: seoData.privacy.title,
      description: seoData.privacy.description,
      keywords: seoData.privacy.keywords,
      index: true,
    },
    "/terms": {
      title: seoData.terms.title,
      description: seoData.terms.description,
      keywords: seoData.terms.keywords,
      index: true,
    },
    "/refunds": {
      title: seoData.refunds.title,
      description: seoData.refunds.description,
      keywords: seoData.refunds.keywords,
      index: true,
    },
    "/shipping-policy": {
      title: seoData.shippingPolicy.title,
      description: seoData.shippingPolicy.description,
      keywords: seoData.shippingPolicy.keywords,
      index: true,
    },
  };

  return (
    routeMap[unlocalizedPath] || {
      title: seoData.notFound.title,
      description: seoData.notFound.description,
      keywords: seoData.notFound.keywords,
      index: false,
    }
  );
}

export default function SeoManager() {
  const location = useLocation();
  const { t, language } = useI18n();

  useEffect(() => {
    const origin = getValidatedOrigin(businessInfo.website);
    const ogImage = `${origin}/uploads/hero/materials.svg`;

    const { urlLang, unlocalizedPath } = parsePath(location.pathname);
    const activeLang: SupportedLanguage = urlLang ?? language;

    // Dynamic SEO dictionary indexed by unlocalized route from translations
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
      "/privacy": {
        title: t("seo.privacy.title"),
        description: t("seo.privacy.description"),
        keywords: t("seo.privacy.keywords"),
        index: true,
      },
      "/terms": {
        title: t("seo.terms.title"),
        description: t("seo.terms.description"),
        keywords: t("seo.terms.keywords"),
        index: true,
      },
      "/refunds": {
        title: t("seo.refunds.title"),
        description: t("seo.refunds.description"),
        keywords: t("seo.refunds.keywords"),
        index: true,
      },
      "/shipping-policy": {
        title: t("seo.shippingPolicy.title"),
        description: t("seo.shippingPolicy.description"),
        keywords: t("seo.shippingPolicy.keywords"),
        index: true,
      },
      "/checkout": {
        title: `${t("hero.ctaQuote")} | ${businessInfo.name}`,
        description: `${t("hero.ctaQuote")} ${businessInfo.name}`,
        keywords: "3D print quote",
        index: false,
      },
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

    const knownDynamicPatterns = [
      "/3d-print-service/:city",
      "/orders/:id",
      "/admin/orders/:id",
      "/admin/models/view/:fileName",
      "/admin/users/:id",
    ];

    const isKnownDynamicRoute = knownDynamicPatterns.some((pattern) =>
      Boolean(matchPath({ path: pattern, end: true }, unlocalizedPath)),
    );

    const isKnownExactRoute = Object.prototype.hasOwnProperty.call(
      seoByRoute,
      unlocalizedPath,
    );

    const isKnownRoute = isKnownExactRoute || isKnownDynamicRoute;

    const notFoundSeo: RouteSeo = {
      title: t("seo.notFound.title"),
      description: t("seo.notFound.description"),
      keywords: t("seo.notFound.keywords"),
      index: false,
    };

    const isAdmin = unlocalizedPath.startsWith("/admin");
    const isOrderDetail = unlocalizedPath.startsWith("/orders/");

    let citySeo: RouteSeo | null = null;
    const cityMatch = matchPath(
      { path: "/3d-print-service/:city", end: true },
      unlocalizedPath,
    );
    if (cityMatch?.params.city) {
      const city = getDutchCityBySlug(cityMatch.params.city);
      if (city) {
        const cityName = getCityName(city, activeLang);
        citySeo = {
          title: t("cityPage.metaTitle", {
            city: cityName,
            company: businessInfo.name,
          }),
          description: t("cityPage.metaDescription", { city: cityName }),
          keywords: t("cityPage.metaKeywords", { city: cityName }),
          index: true,
        };
      }
    }

    const routeSeo: RouteSeo = !isKnownRoute
      ? notFoundSeo
      : cityMatch
        ? (citySeo || notFoundSeo)
        : isAdmin
          ? (seoByRoute[unlocalizedPath] || {
              title: `${t("breadcrumb.admin")} | ${businessInfo.name}`,
              description: `${t("breadcrumb.admin")} ${businessInfo.name}`,
              keywords: "admin",
              index: false,
            })
          : isOrderDetail
            ? { ...seoByRoute["/orders"], index: false }
            : seoByRoute[unlocalizedPath] || notFoundSeo;

    // Document language sync
    document.documentElement.lang = htmlLangMap[activeLang] || activeLang;
    document.title = routeSeo.title;

    // Meta directives
    upsertMetaByName("description", routeSeo.description);
    upsertMetaByName("keywords", routeSeo.keywords);
    upsertMetaByName("author", businessInfo.name);
    upsertMetaByName(
      "robots",
      routeSeo.index ? "index, follow" : "noindex, nofollow",
    );

    // Multilingual canonical and reciprocal hreflangs
    const isRootUrl = unlocalizedPath === "/" && !urlLang;
    const subRouteSuffix = unlocalizedPath === "/" ? "" : unlocalizedPath;
    const canonicalUrl = isRootUrl
      ? `${origin}/`
      : `${origin}/${activeLang}${subRouteSuffix}`;

    if (routeSeo.index) {
      upsertCanonical(canonicalUrl);

      // Reciprocal hreflangs
      for (const sLang of supportedLanguages) {
        upsertHreflang(sLang, `${origin}/${sLang}${subRouteSuffix}`);
      }
      upsertHreflang(
        "x-default",
        isRootUrl
          ? `${origin}/`
          : `${origin}/${defaultLanguage}${subRouteSuffix}`,
      );
    } else {
      removeCanonical();
      removeHreflangs();
    }

    // Open Graph
    upsertMetaByProperty("og:site_name", businessInfo.name);
    upsertMetaByProperty("og:title", routeSeo.title);
    upsertMetaByProperty("og:description", routeSeo.description);
    upsertMetaByProperty("og:type", "website");
    upsertMetaByProperty(
      "og:locale",
      ogLocaleMap[activeLang] || "en_US",
    );
    upsertMetaByProperty("og:url", routeSeo.index ? canonicalUrl : origin);
    upsertMetaByProperty("og:image", ogImage);

    // Twitter Card
    upsertMetaByName("twitter:card", "summary_large_image");
    upsertMetaByName("twitter:title", routeSeo.title);
    upsertMetaByName("twitter:description", routeSeo.description);
    upsertMetaByName("twitter:image", ogImage);

    // Structured Data (JSON-LD)
    upsertJsonLd(
      unlocalizedPath,
      canonicalUrl,
      activeLang,
      routeSeo.title,
      routeSeo.description,
      routeSeo.index,
    );
  }, [language, location.pathname, t]);

  return null;
}
