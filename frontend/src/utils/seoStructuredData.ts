import { businessInfo } from "../config/businessInfo";
import {
  translations,
  htmlLangMap,
  defaultLanguage,
  type SupportedLanguage,
} from "../i18n/translations";
import {
  dutchCities,
  getCityName,
  type DutchCity,
} from "../config/dutchCities";
import {
  getApplicationName,
  type SeoApplication,
} from "../config/seoApplications";

export interface SchemaGraph {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
}

export function buildBreadcrumbsJsonLd(
  canonicalUrl: string,
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumbs`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getValidatedOrigin(website: string): string {
  try {
    return new URL(website).origin;
  } catch {
    return "https://printmy3d.work";
  }
}

export function buildHomepageJsonLd(
  canonicalUrl: string,
  pageTitle: string,
  pageDescription: string,
  language: SupportedLanguage,
): SchemaGraph {
  const origin = getValidatedOrigin(businessInfo.website);
  const inLang = htmlLangMap[language] || language;
  const ogImage = `${origin}/uploads/hero/materials.svg`;
  const tSource = translations[language] || translations[defaultLanguage];
  const schemaT = tSource.seo.schema;
  const localizedCountry =
    businessInfo.address.countryName[language] ||
    businessInfo.address.countryName.nl;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: origin,
      name: businessInfo.name,
      description: schemaT.siteDescription,
      inLanguage: inLang,
      publisher: {
        "@id": `${origin}/#business`,
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${origin}/#business`,
      name: businessInfo.name,
      url: origin,
      email: businessInfo.email,
      image: ogImage,
      knowsAbout: [
        "3D Printing Rotterdam",
        "Particulier 3D Printen",
        "Studenten 3D Printen",
        "Hobby & Cosplay 3D Printing",
        "Rapid Prototyping",
        "FDM 3D Printing",
        "B2B Serial Production",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: businessInfo.address.locality,
        addressCountry: businessInfo.address.countryCode,
      },
      areaServed: [
        {
          "@type": "Country",
          name: localizedCountry,
        },
        ...dutchCities.map((c) => ({
          "@type": "City",
          name: getCityName(c, language),
          ...(c.geo && {
            geo: {
              "@type": "GeoCoordinates",
              latitude: c.geo.lat,
              longitude: c.geo.lng,
            },
          }),
        })),
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: businessInfo.openingHours.days,
          opens: businessInfo.openingHours.opens,
          closes: businessInfo.openingHours.closes,
        },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: schemaT.catalogName,
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: schemaT.fdmServiceName,
              description: schemaT.fdmServiceDesc,
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: schemaT.hueforgeServiceName,
              description: schemaT.hueforgeServiceDesc,
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: schemaT.replacementServiceName,
              description: schemaT.replacementServiceDesc,
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: schemaT.prototypingServiceName,
              description: schemaT.prototypingServiceDesc,
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: schemaT.toolingServiceName,
              description: schemaT.toolingServiceDesc,
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: schemaT.batchServiceName,
              description: schemaT.batchServiceDesc,
            },
          },
        ],
      },
    },
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: pageTitle,
      description: pageDescription,
      inLanguage: inLang,
      isPartOf: {
        "@id": `${origin}/#website`,
      },
      about: {
        "@id": `${origin}/#business`,
      },
    },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function buildFaqJsonLd(
  canonicalUrl: string,
  pageTitle: string,
  pageDescription: string,
  language: SupportedLanguage,
): SchemaGraph {
  const inLang = htmlLangMap[language] || language;
  const tSource = translations[language] || translations[defaultLanguage];
  const faqSource = tSource.faq;
  const faqItems: Array<{ q: string; a: string }> = [];
  for (let i = 1; i <= 20; i++) {
    const qKey = `q${i}` as keyof typeof faqSource;
    const aKey = `a${i}` as keyof typeof faqSource;
    const question = faqSource[qKey];
    const answer = faqSource[aKey];
    if (typeof question === "string" && typeof answer === "string") {
      faqItems.push({ q: question, a: answer });
    }
  }

  const origin = getValidatedOrigin(businessInfo.website);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: inLang,
        isPartOf: {
          "@id": `${origin}/#website`,
        },
      },
      buildBreadcrumbsJsonLd(canonicalUrl, [
        { name: tSource.nav.home, url: `${origin}/${language}` },
        { name: tSource.nav.faq, url: canonicalUrl },
      ]),
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        isPartOf: {
          "@id": `${canonicalUrl}#webpage`,
        },
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };
}

export function buildStandardWebPageJsonLd(
  canonicalUrl: string,
  pageTitle: string,
  pageDescription: string,
  language: SupportedLanguage,
): SchemaGraph {
  const origin = getValidatedOrigin(businessInfo.website);
  const inLang = htmlLangMap[language] || language;
  const tSource = translations[language] || translations[defaultLanguage];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: inLang,
        isPartOf: {
          "@id": `${origin}/#website`,
        },
      },
      buildBreadcrumbsJsonLd(canonicalUrl, [
        { name: tSource.nav.home, url: `${origin}/${language}` },
        { name: pageTitle, url: canonicalUrl },
      ]),
    ],
  };
}

export function buildCityJsonLd(
  canonicalUrl: string,
  city: DutchCity,
  language: SupportedLanguage,
  pageTitle: string,
  pageDescription: string,
): SchemaGraph {
  const origin = getValidatedOrigin(businessInfo.website);
  const inLang = htmlLangMap[language] || language;
  const ogImage = `${origin}/uploads/hero/materials.svg`;
  const cityName = getCityName(city, language);
  const tSource = translations[language] || translations[defaultLanguage];
  const cityPageT = tSource.cityPage;
  const schemaT = tSource.seo.schema;

  const faqItems = [
    {
      q: cityPageT.q1.replaceAll("{city}", cityName),
      a: cityPageT.a1.replaceAll("{city}", cityName),
    },
    {
      q: cityPageT.q2.replaceAll("{city}", cityName),
      a: cityPageT.a2.replaceAll("{city}", cityName),
    },
    {
      q: cityPageT.q3.replaceAll("{city}", cityName),
      a: cityPageT.a3.replaceAll("{city}", cityName),
    },
    {
      q: cityPageT.q4.replaceAll("{city}", cityName),
      a: cityPageT.a4.replaceAll("{city}", cityName),
    },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${origin}/#business`,
        name: businessInfo.name,
        url: origin,
        email: businessInfo.email,
        image: ogImage,
        address: {
          "@type": "PostalAddress",
          addressLocality: businessInfo.address.locality,
          addressCountry: businessInfo.address.countryCode,
        },
        areaServed: {
          "@type": "City",
          name: cityName,
          containedInPlace: {
            "@type": "AdministrativeArea",
            name: city.province,
          },
          ...(city.geo && {
            geo: {
              "@type": "GeoCoordinates",
              latitude: city.geo.lat,
              longitude: city.geo.lng,
            },
          }),
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: schemaT.catalogName,
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: schemaT.cityServiceTemplate.replaceAll(
                  "{city}",
                  cityName,
                ),
                description: pageDescription,
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: `${schemaT.prototypingServiceName} - ${cityName}`,
                description: schemaT.prototypingServiceDesc,
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: `${schemaT.toolingServiceName} - ${cityName}`,
                description: schemaT.toolingServiceDesc,
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: `${schemaT.batchServiceName} - ${cityName}`,
                description: schemaT.batchServiceDesc,
              },
            },
          ],
        },
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: inLang,
        isPartOf: {
          "@id": `${origin}/#website`,
        },
        about: {
          "@id": `${origin}/#business`,
        },
      },
      buildBreadcrumbsJsonLd(canonicalUrl, [
        { name: tSource.nav.home, url: `${origin}/${language}` },
        {
          name: tSource.cityPage.badge,
          url: `${origin}/${language}/#services`,
        },
        { name: cityName, url: canonicalUrl },
      ]),
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        isPartOf: {
          "@id": `${canonicalUrl}#webpage`,
        },
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };
}

export function buildApplicationJsonLd(
  canonicalUrl: string,
  app: SeoApplication,
  language: SupportedLanguage,
  pageTitle: string,
  pageDescription: string,
): SchemaGraph {
  const origin = getValidatedOrigin(businessInfo.website);
  const inLang = htmlLangMap[language] || language;
  const tSource = translations[language] || translations[defaultLanguage];
  const appName = getApplicationName(app, language);
  const localizedFaqs = app.faqs[language] || app.faqs[defaultLanguage] || [];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${canonicalUrl}#service`,
        name: appName,
        description: pageDescription,
        serviceType: "3D Printing & Manufacturing",
        provider: {
          "@type": "LocalBusiness",
          "@id": `${origin}/#business`,
          name: businessInfo.name,
        },
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: inLang,
        isPartOf: {
          "@id": `${origin}/#website`,
        },
        about: {
          "@id": `${canonicalUrl}#service`,
        },
      },
      buildBreadcrumbsJsonLd(canonicalUrl, [
        { name: tSource.nav.home, url: `${origin}/${language}` },
        {
          name: tSource.seo.schema.catalogName,
          url: `${origin}/${language}/#services`,
        },
        { name: appName, url: canonicalUrl },
      ]),
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        isPartOf: {
          "@id": `${canonicalUrl}#webpage`,
        },
        mainEntity: localizedFaqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };
}
