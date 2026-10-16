import { businessInfo } from "../config/businessInfo";

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

  const faqItems =
    language === "nl"
      ? [
          {
            q: "Welke 3D-bestanden accepteren jullie?",
            a: "We accepteren de meest gebruikte bestandsformaten: .STL, .OBJ en .3MF. Andere formaten kun je meestal exporteren naar STL.",
          },
          {
            q: "Wat kost een maatwerk print?",
            a: "De prijs hangt af van grootte, infill en materiaal. Vraag een offerte aan voor een exacte prijs zonder verborgen kosten.",
          },
          {
            q: "Hoe lang duurt levering?",
            a: "Meestal printen en verzenden we binnen 2 tot 5 werkdagen. Levertijd hangt af van je locatie.",
          },
          {
            q: "Ik heb een idee maar geen 3D-bestand. Kunnen jullie helpen?",
            a: "Ja. Deel schetsen of voorbeelden en we helpen met het maken van een printbaar model.",
          },
          {
            q: "Zijn prints voedselveilig?",
            a: "Standaard printmaterialen zijn meestal niet bedoeld voor direct voedselcontact. We adviseren graag over veiliger afwerking.",
          },
          {
            q: "Wat als mijn print beschadigd aankomt?",
            a: "Als je item beschadigd aankomt of grote printfouten heeft, stuur binnen 3 dagen een foto en we regelen een herprint.",
          },
        ]
      : [
          {
            q: "What type of 3D files do you accept?",
            a: "We accept the most common 3D files: .STL, .OBJ, and .3MF. If you have a different file type from your design software, you can usually use the Export or Save As option to convert it before uploading.",
          },
          {
            q: "How much does a custom print cost?",
            a: "Price depends on size, infill, and material. Use Get a Quote for an exact no-hidden-fee price.",
          },
          {
            q: "How long will it take to get my item?",
            a: "Usually we print and ship within 2 to 5 business days. Shipping depends on location.",
          },
          {
            q: "I have an idea but no 3D file. Can you help?",
            a: "Yes. Share sketches or references and we can help create a printable model.",
          },
          {
            q: "Are printed parts food-safe?",
            a: "Standard printed plastics are usually not recommended for direct food contact. We can advise safer finishing options when needed.",
          },
          {
            q: "What if my print arrives damaged?",
            a: "If your item arrives damaged or with major issues, send a photo within 3 days and we will reprint and reship it.",
          },
        ];

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

