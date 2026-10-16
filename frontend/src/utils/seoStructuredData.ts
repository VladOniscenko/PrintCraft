import { businessInfo } from "../config/businessInfo";
import { translations, type SupportedLanguage } from "../i18n/translations";

export interface SchemaGraph {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
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
  language: "en" | "nl",
): SchemaGraph {
  const origin = getValidatedOrigin(businessInfo.website);
  const inLang = language === "nl" ? "nl-NL" : "en";
  const ogImage = `${origin}/uploads/hero/materials.svg`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: origin,
      name: businessInfo.name,
      description:
        language === "nl"
          ? "Professionele 3D print service in Nederland voor prototypes, onderdelen en maatwerk prints."
          : "Professional 3D printing service in the Netherlands for prototypes, replacement parts and custom prints.",
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
      address: {
        "@type": "PostalAddress",
        addressLocality: businessInfo.address.locality,
        addressCountry: businessInfo.address.countryCode,
      },
      areaServed: {
        "@type": "Country",
        name: language === "nl" ? "Nederland" : "Netherlands",
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: businessInfo.openingHours.days,
          opens: businessInfo.openingHours.opens,
          closes: businessInfo.openingHours.closes,
        },
      ],
      priceRange: "€€",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name:
          language === "nl"
            ? "3D Print Diensten"
            : "3D Printing Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name:
                language === "nl"
                  ? "Maatwerk FDM 3D-Printen (PLA, PETG, TPU)"
                  : "Custom FDM 3D Printing (PLA, PETG, TPU)",
              description:
                language === "nl"
                  ? "Precisie 3D-printen van prototypes, behuizingen en functionele onderdelen met snelle levertijd."
                  : "Precision 3D printing of functional prototypes, enclosures and replacement parts with fast turnaround.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name:
                language === "nl"
                  ? "HueForge Filament Painting (3D Kunst & Reliëf)"
                  : "HueForge Filament Painting (3D Relief Art)",
              description:
                language === "nl"
                  ? "Meerkleurige 3D-reliëf schilderijen van 2D afbeeldingen met optische laagmenging."
                  : "Multi-color relief 3D art printing from 2D images using optical layer blending.",
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
  language: "en" | "nl",
): SchemaGraph {
  const origin = getValidatedOrigin(businessInfo.website);
  const inLang = language === "nl" ? "nl-NL" : "en";

  const faqSource = (translations[language as SupportedLanguage] || translations.en).faq;
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
  language: "en" | "nl",
): SchemaGraph {
  const origin = getValidatedOrigin(businessInfo.website);
  const inLang = language === "nl" ? "nl-NL" : "en";

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
    ],
  };
}

