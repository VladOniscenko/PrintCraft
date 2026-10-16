import type { SupportedLanguage } from "../i18n/translations";

export interface SeoApplicationFaq {
  q: string;
  a: string;
}

export interface SeoApplication {
  slug: string;
  key: "replacementParts" | "enclosures" | "jigsFixtures" | "prototyping";
  names: Record<SupportedLanguage, string>;
  tagline: Record<SupportedLanguage, string>;
  badge: Record<SupportedLanguage, string>;
  heroTitle: Record<SupportedLanguage, string>;
  heroSubtitle: Record<SupportedLanguage, string>;
  description: Record<SupportedLanguage, string>;
  benefits: Record<SupportedLanguage, string[]>;
  recommendedMaterials: string[];
  leadTime: string;
  precision: string;
  metaTitle: Record<SupportedLanguage, string>;
  metaDescription: Record<SupportedLanguage, string>;
  metaKeywords: Record<SupportedLanguage, string>;
  faqs: Record<SupportedLanguage, SeoApplicationFaq[]>;
}

export const seoApplications: SeoApplication[] = [
  {
    slug: "vervangende-onderdelen-printen",
    key: "replacementParts",
    names: {
      nl: "Vervangende Onderdelen Printen",
      en: "Replacement Parts 3D Printing",
    },
    tagline: {
      nl: "Kapot plastic onderdeel namaken of reserveonderdelen 3D-printen",
      en: "Reproduce broken plastic parts and discontinued components",
    },
    badge: {
      nl: "Reverse Engineering & Spare Parts",
      en: "Reverse Engineering & Spare Parts",
    },
    heroTitle: {
      nl: "Vervangend Onderdeel 3D Printen & Namaken",
      en: "Replacement Part 3D Printing & Reproduction",
    },
    heroSubtitle: {
      nl: "Is er een plastic onderdeel van een apparaat, machine, oldtimer of gereedschap afgebroken? Wij reproduceren niet meer leverbare onderdelen in slijtvast PETG of rubberachtig TPU.",
      en: "Broken plastic gear, clip, knob, or machine mount? We reproduce discontinued parts with high-strength PETG or impact-absorbing TPU delivered in 2-5 days.",
    },
    description: {
      nl: "Bespaar hoge vervangingskosten van complete apparaten. Met 3D-printen en reverse engineering maken we exacte replica's van gebroken kunststof tandwielen, behuizingsklemmen, handgrepen en industriële reserveonderdelen.",
      en: "Avoid replacing entire machines due to a single broken plastic component. We manufacture exact functional replicas of gears, clips, brackets, and machine components on demand.",
    },
    benefits: {
      nl: [
        "Geen minimale afname: enkelstuks vanaf €9,95 tot kleine series",
        "Slijtvast en hittebestendig PETG tot 75°C",
        "Flexibele pakkingen en stootranden in TPU rubber",
        "Direct online prijsindicatie en snelle PostNL bezorging",
      ],
      en: [
        "No minimum order quantity: single units from €9.95 to batch runs",
        "Wear-resistant, high-strength PETG heat resistant up to 75°C",
        "Flexible rubber gaskets and impact bumpers in TPU",
        "Instant online quote calculation and fast 2-5 business days dispatch",
      ],
    },
    recommendedMaterials: ["PETG", "TPU", "PLA"],
    leadTime: "2-5 werkdagen / business days",
    precision: "±0.1mm industriële tolerantie",
    metaTitle: {
      nl: "Vervangend Onderdeel 3D Printen | Kapot Plastic Namaken | Print My 3D",
      en: "Replacement Part 3D Printing | Reverse Engineering Parts | Print My 3D",
    },
    metaDescription: {
      nl: "Kapot plastic onderdeel namaken of reserveonderdeel 3D-printen? Upload je bestand of foto voor een directe offerte. Slijtvast PETG & TPU, snelle levering in Nederland.",
      en: "3D print replacement parts for appliances, tools, and machines. Upload your file for an instant quote. Durable PETG and flexible TPU with 2-5 days delivery.",
    },
    metaKeywords: {
      nl: "vervangend onderdeel 3D printen, kapot plastic onderdeel namaken, reserveonderdelen 3D printen, tandwiel 3D printen, reserveonderdeel namaken, reverse engineering 3D printen",
      en: "replacement part 3D printing, discontinued plastic parts 3D print, broken plastic repair, custom spare parts, 3D print broken bracket",
    },
    faqs: {
      nl: [
        {
          q: "Hoe kan ik een kapot onderdeel namaken als ik geen 3D-bestand heb?",
          a: "Je kunt duidelijke foto's met afmetingen (liniaal of schuifmaat) opsturen via ons offerteformulier. We beoordelen direct of we het onderdeel kunnen modelleren (reverse engineering) en printen.",
        },
        {
          q: "Welk materiaal is het beste voor mechanische reserveonderdelen?",
          a: "Voor dragende onderdelen, beugels en tandwielen raden we PETG aan vanwege de hoge taaiheid en temperatuurbestendigheid. Voor afdichtingen en stootdempers gebruiken we flexibel TPU.",
        },
        {
          q: "Wat kost het printen van een vervangend onderdeel?",
          a: "Als je al een 3D-model (STL/STEP) hebt, begint de printprijs vaak al vanaf €9,95 afhankelijk van volume en materiaal.",
        },
      ],
      en: [
        {
          q: "How can I reproduce a broken component if I do not have a 3D model?",
          a: "You can submit clear photos with key dimensions (using calipers or a ruler) through our quote page. We evaluate whether our engineering team can model (reverse engineer) and print it.",
        },
        {
          q: "Which material is best for functional replacement components?",
          a: "For load-bearing brackets and mechanical gears, PETG is ideal due to its impact toughness and heat resistance. For seals and bumpers, flexible TPU rubber is recommended.",
        },
        {
          q: "What does printing a replacement part cost?",
          a: "With a ready 3D file (STL/STEP), pricing typically starts from €9.95 depending on component weight and chosen filament.",
        },
      ],
    },
  },
  {
    slug: "elektronica-behuizingen-op-maat",
    key: "enclosures",
    names: {
      nl: "Elektronica Behuizingen op Maat",
      en: "Custom Electronics Enclosures",
    },
    tagline: {
      nl: "Maatwerk PCB casings, sensor mounts en DIN-rail behuizingen",
      en: "Custom PCB casings, sensor housings, and DIN-rail enclosures",
    },
    badge: {
      nl: "Custom Enclosures & Mounts",
      en: "Custom Enclosures & Mounts",
    },
    heroTitle: {
      nl: "Elektronica Behuizing 3D Printen op Maat",
      en: "Custom Electronics Enclosure 3D Printing",
    },
    heroSubtitle: {
      nl: "Perfect passende behuizingen voor printplaten (PCB), Raspberry Pi, ESP32, sensoren en industriële IoT-hardware met snap-fit deksels en schroefdraadinzetstukken.",
      en: "Precision-engineered enclosures for PCBs, IoT devices, Raspberry Pi, ESP32, and industrial hardware with snap-fit lids and brass threaded inserts.",
    },
    description: {
      nl: "Standaard behuizingen passen zelden exact. Met 3D-printen produceren we op maat gemaakte behuizingen inclusief kabeldoorvoeren, display-uitsparingen, ventilatiesleuven en montagelippen in vlamvertragende of hittebestendige materialen.",
      en: "Off-the-shelf project boxes rarely match custom PCBs. We manufacture tailored enclosures featuring custom connector cutouts, ventilation grills, mounting flanges, and heat-set inserts.",
    },
    benefits: {
      nl: [
        "Exacte uitsparingen voor USB, HDMI, kabels en connectoren",
        "Ondersteuning voor messing schroefdraad (threaded heat-set inserts)",
        "Snap-fit of schroefdeksels met stofdichte passing",
        "Hittebestendig PETG voor continue belasting en voedingen",
      ],
      en: [
        "Precise cutouts for USB, power ports, antennas, and displays",
        "Support for brass threaded heat-set inserts (M2–M5)",
        "Snap-fit and screw-down lid options with snug tolerances",
        "Heat-resistant PETG suitable for internal electronics and power units",
      ],
    },
    recommendedMaterials: ["PETG", "PLA", "TPU"],
    leadTime: "2-5 werkdagen / business days",
    precision: "±0.1mm passingstolerantie",
    metaTitle: {
      nl: "Elektronica Behuizing 3D Printen | PCB Casing op Maat | Print My 3D",
      en: "Custom Electronics Enclosure 3D Print | PCB Casing | Print My 3D",
    },
    metaDescription: {
      nl: "Elektronica behuizing op maat 3D-printen? Upload je CAD-bestand voor een directe offerte. Snap-fits, connector-uitsparingen en messing inserts in PETG.",
      en: "Custom 3D printed electronics enclosures and PCB cases. Upload your CAD/STEP model for an instant quote with connector cutouts and brass inserts.",
    },
    metaKeywords: {
      nl: "elektronica behuizing 3D printen, custom electronics enclosure, PCB casing 3D print, bevestigingsbeugel op maat, DIN rail behuizing printen, sensor mount 3D print",
      en: "custom electronics enclosure 3D print, PCB casing 3D print, custom mounts 3D printing, DIN rail enclosure, sensor housing 3D print",
    },
    faqs: {
      nl: [
        {
          q: "Kunnen jullie messing schroefdraad (threaded inserts) aanbrengen?",
          a: "Ja, we kunnen gaten ontwerpen voor M2, M3, M4 of M5 messing inserts en deze desgewenst insmelten voor herhaaldelijk vastschroeven zonder dat het plastic uitslijt.",
        },
        {
          q: "Is PETG geschikt voor warme elektronica componenten?",
          a: "Zeker. PETG behoudt zijn vorm tot ongeveer 75°C en biedt goede elektrische isolatie en vlamvertraging vergeleken met standaard PLA.",
        },
      ],
      en: [
        {
          q: "Do you install brass heat-set threaded inserts?",
          a: "Yes! We can dimension holes for M2, M3, M4, or M5 brass inserts and heat-press them for durable machine screws and repeated opening.",
        },
        {
          q: "Is PETG suitable for electronics generating heat?",
          a: "Yes. PETG retains dimensional stability up to approximately 75°C and provides excellent electrical insulation.",
        },
      ],
    },
  },
  {
    slug: "mallen-kalibers-jigs-fixtures",
    key: "jigsFixtures",
    names: {
      nl: "Mallen, Kalibers & Jigs Fixtures",
      en: "Molds, Jigs & Assembly Fixtures",
    },
    tagline: {
      nl: "Productiegereedschap, montagemallen en boorkalibers voor werkplaats en fabriek",
      en: "Tooling, assembly jigs, inspection fixtures, and drill guides",
    },
    badge: {
      nl: "Tooling, Jigs & Fixtures",
      en: "Tooling, Jigs & Fixtures",
    },
    heroTitle: {
      nl: "Mallen en Kalibers 3D Printen (Jigs & Fixtures)",
      en: "3D Printed Jigs, Fixtures & Manufacturing Tooling",
    },
    heroSubtitle: {
      nl: "Versnel je assemblage- en inspectieprocessen met op maat gemaakte kalibers, montagemallen, gereedschapshouders en boorsjablonen binnen 2 tot 5 werkdagen.",
      en: "Speed up manufacturing, quality control, and assembly workflows with custom 3D printed jigs, inspection fixtures, and ergonomic tool mounts.",
    },
    description: {
      nl: "Traditioneel frezen van productiemallen kost weken en duizenden euro's. Met onze industriële 3D-print service produceren we slijtvaste mallen, laskalibers en montagesjablonen in PETG met ±0.1mm nauwkeurigheid tegen een fractie van de prijs.",
      en: "CNC milling assembly tooling often costs thousands of euros and takes weeks. Our high-precision FDM service produces rigid jigs, welding fixtures, and alignment gauges in days.",
    },
    benefits: {
      nl: [
        "Productietijd van weken teruggebracht naar 2-5 werkdagen",
        "Sterke PETG gereedschapshouders met hoge stijfheid",
        "Zachte TPU contactoppervlakken voorkomen krassen op kwetsbare delen",
        "Geen freesprogramma's of matrijskosten nodig",
      ],
      en: [
        "Turnaround reduced from weeks to 2-5 business days",
        "Rigid, chemical-resistant PETG suitable for workshop shop floors",
        "Soft TPU contact pads available to avoid marring finished products",
        "Zero tooling investment or CNC programming setup overhead",
      ],
    },
    recommendedMaterials: ["PETG", "TPU", "PLA"],
    leadTime: "2-5 werkdagen / business days",
    precision: "±0.1mm industriële herhaalnauwkeurigheid",
    metaTitle: {
      nl: "Mallen & Kalibers 3D Printen | Jigs & Fixtures Nederland | Print My 3D",
      en: "3D Printed Jigs & Fixtures | Tooling Manufacturing | Print My 3D",
    },
    metaDescription: {
      nl: "Mallen en kalibers 3D-printen (jigs & fixtures)? Productiegereedschap, boorsjablonen en montagemallen in sterk PETG. Snelle levering en facturatie voor bedrijven.",
      en: "Custom 3D printed jigs, fixtures, and drill guides. Accelerate workshop production with high-precision PETG tooling delivered in 2-5 business days.",
    },
    metaKeywords: {
      nl: "mallen en kalibers 3D printen, jigs & fixtures Nederland, montagemallen 3D print, boorsjabloon printen, gereedschapshouders PETG, productiegereedschap 3D print",
      en: "3D printed jigs and fixtures, manufacturing tooling 3D print, custom drill guide, assembly fixture, industrial tooling replacement",
    },
    faqs: {
      nl: [
        {
          q: "Hoe nauwkeurig zijn 3D-geprinte kalibers?",
          a: "Onze industriële FDM-printers zijn gekalibreerd voor toleranties tot ±0.1mm, ruim voldoende voor montagemallen, inspectiemallen en boorgeleidingen.",
        },
        {
          q: "Zijn de mallen bestand tegen oliën en chemicaliën op de werkvloer?",
          a: "PETG biedt uitstekende chemische resistentie tegen smeermiddelen, oliën en milde reinigingsmiddelen die in machinewerkplaatsen voorkomen.",
        },
      ],
      en: [
        {
          q: "What tolerances can be achieved on 3D printed assembly fixtures?",
          a: "Our tuned FDM systems achieve tolerances within ±0.1mm, ideal for quality control gauges, drill templates, and assembly fixtures.",
        },
        {
          q: "Are the fixtures resistant to oils and workshop chemicals?",
          a: "PETG exhibits high chemical resistance against oils, greases, and standard industrial cleaning solvents.",
        },
      ],
    },
  },
  {
    slug: "rapid-prototyping-kunststof",
    key: "prototyping",
    names: {
      nl: "Rapid Prototyping Kunststof",
      en: "Rapid Plastic Prototyping",
    },
    tagline: {
      nl: "Functionele prototypes, CAD/STEP validatie en nulserie pre-productie",
      en: "Functional prototypes, STEP/CAD validation, and pilot run production",
    },
    badge: {
      nl: "Engineering & Prototyping",
      en: "Engineering & Prototyping",
    },
    heroTitle: {
      nl: "Rapid Prototyping Kunststof in Nederland",
      en: "Rapid Plastic Prototyping in the Netherlands",
    },
    heroSubtitle: {
      nl: "Zet je CAD- of STEP-model direct om in een tastbaar, functioneel prototype. Valideer ergonomie, passing en sterkte binnen 2 tot 5 werkdagen vóór kostbare serieproductie.",
      en: "Convert CAD and STEP files into physical, functional prototypes. Test form, fit, and mechanical performance within 2 to 5 business days before tooling up.",
    },
    description: {
      nl: "Van eerste vormstudie tot mechanisch geteste nulserie: onze FDM rapid prototyping service ondersteunt ingenieursbureaus, startup hardware-ontwikkelaars en machinebouwers met snelle iteraties en zakelijke facturatie.",
      en: "From initial concept validation to functional pilot series: we support product development teams and machine builders with fast turnaround iterations and B2B invoicing.",
    },
    benefits: {
      nl: [
        "Ondersteunt directe upload van STEP-, 3MF- en STL-bestanden",
        "Geheimhouding gegarandeerd met optionele NDA",
        "Geen minimale afname: van 1 stuk tot 500+ pre-productie eenheden",
        "Officiële BTW-factuur voor bedrijven en instellingen",
      ],
      en: [
        "Direct upload support for STEP, 3MF, and STL models",
        "Strict confidentiality with NDA support for proprietary IP",
        "No minimum order quantity: test 1 part or launch a 500-unit pilot batch",
        "Official commercial VAT invoice with corporate payment terms",
      ],
    },
    recommendedMaterials: ["PLA", "PETG", "TPU"],
    leadTime: "2-5 werkdagen / business days",
    precision: "±0.1mm industriële tolerantie",
    metaTitle: {
      nl: "Rapid Prototyping Nederland | Kunststof Prototypes 3D Printen | Print My 3D",
      en: "Rapid Prototyping Netherlands | Functional 3D Prints | Print My 3D",
    },
    metaDescription: {
      nl: "Rapid prototyping service in Nederland voor ingenieurs en productontwikkelaars. Upload STEP/STL voor een directe offerte op functionele kunststof prototypes.",
      en: "Rapid prototyping service in the Netherlands for product designers and engineers. Upload STEP/STL models for instant pricing on functional plastic prototypes.",
    },
    metaKeywords: {
      nl: "rapid prototyping Nederland, functioneel kunststof prototype, zakelijk 3D printen, CAD STEP model laten printen, nulserie pre-productie, product prototype laten maken",
      en: "rapid prototyping services, B2B 3D printing service Netherlands, functional plastic prototypes, STEP CAD file manufacturing, small batch rapid prototyping",
    },
    faqs: {
      nl: [
        {
          q: "Kan ik direct een STEP- of CAD-assemblage uploaden voor prototyping?",
          a: "Ja, ons platform accepteert STEP-, STP-, STL- en 3MF-bestanden. We controleren wanddiktes en passingen direct in onze software.",
        },
        {
          q: "Kunnen jullie een geheimhoudingsovereenkomst (NDA) tekenen?",
          a: "Zeker. We tekenen regelmatig NDA's met R&D-afdelingen en startups voordat we vertrouwelijke bestanden in productie nemen.",
        },
      ],
      en: [
        {
          q: "Can I upload a STEP assembly directly for prototyping?",
          a: "Yes! Our platform supports STEP, STP, STL, and 3MF files. We analyze wall thickness, overhangs, and fits directly.",
        },
        {
          q: "Can you sign a Non-Disclosure Agreement (NDA) for prototypes?",
          a: "Yes, we routinely sign mutual or one-way NDAs with R&D departments and hardware startups prior to file transfer.",
        },
      ],
    },
  },
];

export function getApplicationName(
  app: SeoApplication,
  lang: SupportedLanguage,
): string {
  return app.names[lang] || app.names.nl || app.names.en;
}

export function getSeoApplicationBySlug(slug: string): SeoApplication | undefined {
  const normalized = slug.trim().toLowerCase();
  return seoApplications.find((app) => app.slug === normalized);
}

export function getAllApplicationSlugs(): string[] {
  return seoApplications.map((app) => app.slug);
}
