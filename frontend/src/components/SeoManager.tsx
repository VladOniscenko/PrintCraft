import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { businessInfo } from "../config/businessInfo";

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
          name: businessInfo.name,
          url: businessInfo.website,
          inLanguage: language === "nl" ? "nl-NL" : "en",
        },
        {
          "@type": "LocalBusiness",
          name: businessInfo.name,
          url: businessInfo.website,
          email: businessInfo.email,
          telephone: businessInfo.phone,
          areaServed: [businessInfo.address.countryCode],
          address: {
            "@type": "PostalAddress",
            addressLocality: businessInfo.address.locality,
            addressCountry: businessInfo.address.countryCode,
          },
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: businessInfo.openingHours.days,
            opens: businessInfo.openingHours.opens,
            closes: businessInfo.openingHours.closes,
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
      "/checkout": {
        title: `${t("hero.ctaQuote")} | ${businessInfo.name}`,
        description: `${t("hero.ctaQuote")} ${businessInfo.name}`,
        keywords: "3D print quote",
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
        keywords: "orders",
        index: false,
      },
      "/privacy": {
        title: `${t("footer.privacy")} | ${businessInfo.name}`,
        description: `${t("footer.privacy")} ${businessInfo.name}`,
        keywords: "privacy policy",
        index: true,
      },
      "/terms": {
        title: `${t("footer.terms")} | ${businessInfo.name}`,
        description: `${t("footer.terms")} ${businessInfo.name}`,
        keywords: "terms of service",
        index: true,
      },
      "/refunds": {
        title: `${t("footer.refunds")} | ${businessInfo.name}`,
        description: `${t("footer.refunds")} ${businessInfo.name}`,
        keywords: "refund policy",
        index: true,
      },
      "/shipping-policy": {
        title: `${t("footer.shippingPolicy")} | ${businessInfo.name}`,
        description: `${t("footer.shippingPolicy")} ${businessInfo.name}`,
        keywords: "shipping policy",
        index: true,
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
    };

    const pathname = location.pathname;

    const knownDynamicPatterns = [
      "/orders/:id",
      "/orders/:id/models/:itemIndex",
      "/admin/orders/:id",
      "/admin/orders/:id/models/:itemIndex",
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
      title: t("seo.notFound.title"),
      description: t("seo.notFound.description"),
      keywords: t("seo.notFound.keywords"),
      index: false,
    };

    const isAdmin = pathname.startsWith("/admin");
    const isOrderDetail = pathname.startsWith("/orders/");
    const routeSeo = !isKnownRoute
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
          : seoByRoute[pathname] || defaultSeo;

    const canonicalUrl = new URL(pathname, businessInfo.website).href;

    document.documentElement.lang = language === "nl" ? "nl-NL" : "en";
    document.title = routeSeo.title;

    upsertMetaByName("description", routeSeo.description);
    upsertMetaByName("keywords", routeSeo.keywords);
    upsertMetaByName("author", businessInfo.name);
    upsertMetaByName(
      "robots",
      routeSeo.index ? "index, follow" : "noindex, nofollow",
    );

    upsertMetaByProperty("og:title", routeSeo.title);
    upsertMetaByProperty("og:site_name", businessInfo.name);
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
