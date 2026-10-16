import { businessInfo } from "../config/businessInfo";
import { dutchCities, getCityName } from "../config/dutchCities";
import { seoApplications } from "../config/seoApplications";
import { getValidatedOrigin } from "./seoStructuredData";

export interface ArdHost {
  displayName: string;
  identifier: string;
}

export interface ArdEntry {
  identifier: string;
  displayName: string;
  type: string;
  url: string;
  description: string;
  representativeQueries: string[];
}

export interface ArdCatalog {
  specVersion: "1.0";
  host: ArdHost;
  entries: ArdEntry[];
}

export function getDomainFromOrigin(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return "printmy3d.work";
  }
}

/**
 * Automatically generates an Agentic Resource Discovery (ARD) compliant catalog
 * manifest containing entries for every indexable URL on the site.
 */
export function generateAiCatalog(
  originUrl: string = businessInfo.website,
): ArdCatalog {
  const origin = getValidatedOrigin(originUrl);
  const domain = getDomainFromOrigin(origin);

  const entries: ArdEntry[] = [
    {
      identifier: `urn:air:${domain}:docs:llmstxt`,
      displayName: `${businessInfo.name} LLM Guidance`,
      type: 'text/markdown; profile="urn:air:agent-skills"',
      url: `${origin}/llms.txt`,
      description:
        "Agent guidance and overview of 3D printing capabilities, technical materials, tolerances, and solutions.",
      representativeQueries: [
        "What 3D printing materials are offered?",
        "How fast can prototypes be manufactured and delivered?",
        "3D printing service technical guidelines in the Netherlands",
      ],
    },
    {
      identifier: `urn:air:${domain}:docs:llms-full`,
      displayName: `${businessInfo.name} Full LLM Documentation`,
      type: 'text/markdown; profile="urn:air:agent-skills"',
      url: `${origin}/llms-full.txt`,
      description:
        "Comprehensive documentation of all 3D printing solutions, regional Dutch city services, material specs, and FAQs.",
      representativeQueries: [
        "Complete 3D printing documentation",
        "Technical material specs PLA PETG TPU",
        "Full 3D printing service directory Netherlands",
      ],
    },
    {
      identifier: `urn:air:${domain}:service:instant-quote`,
      displayName: `${businessInfo.name} Instant Quote & Upload`,
      type: "text/html",
      url: `${origin}/nl/checkout`,
      description:
        "Automated CAD/STL/3MF inspection and instant quotation tool for on-demand 3D printing.",
      representativeQueries: [
        "Upload STL for instant 3D print quote",
        "Check 3D file printability and order",
        "Instant 3D printing pricing calculator",
      ],
    },
    {
      identifier: `urn:air:${domain}:service:home`,
      displayName: `${businessInfo.name} - 3D Print Service Rotterdam & Nederland (B2C, Studenten & B2B)`,
      type: "text/html",
      url: `${origin}/nl`,
      description:
        "Allround 3D print service in Rotterdam en heel Nederland voor particulieren (B2C), hobbyisten, studenten én bedrijven (B2B). Geen minimale ordergrootte: van enkelstuks, cosplay props, studenten afstudeerprojecten en vervangende onderdelen tot industriële prototypes en kleinseries.",
      representativeQueries: [
        "3D print service Rotterdam",
        "3D print shop Rotterdam",
        "3D printen particulier Rotterdam",
        "3D printen studenten Rotterdam",
        "Cosplay 3D printen miniaturen",
        "3D print service Nederland",
        "Online 3D printen bestellen",
        "3D print op maat zonder minimum",
      ],
    },
  ];

  // 1. Add all Core Engineering Solutions
  for (const app of seoApplications) {
    entries.push({
      identifier: `urn:air:${domain}:service:${app.key}`,
      displayName: app.names.nl,
      type: "text/html",
      url: `${origin}/nl/oplossingen/${app.slug}`,
      description: app.description.nl,
      representativeQueries: [
        app.tagline.nl,
        app.heroTitle.nl,
        ...app.metaKeywords.nl
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
          .slice(0, 2),
      ].slice(0, 4),
    });
  }

  // 2. Add all Regional City Landing Pages
  for (const city of dutchCities) {
    const cityName = getCityName(city, "nl");
    entries.push({
      identifier: `urn:air:${domain}:city:${city.slug}`,
      displayName: `3D Print Service ${cityName}`,
      type: "text/html",
      url: `${origin}/nl/3d-print-service/${city.slug}`,
      description: `Professionele industriële FDM 3D-printservice in ${cityName} (${city.province}) met snelle levering binnen 2-5 werkdagen via PostNL Zakelijk.`,
      representativeQueries: [
        `3D print service ${cityName}`,
        `3D printen in ${cityName}`,
        `Prototype laten printen ${cityName}`,
        `3D printing service ${cityName}`,
      ],
    });
  }

  // 3. Add Knowledge Base, FAQs & Policy Pages
  entries.push(
    {
      identifier: `urn:air:${domain}:docs:faq`,
      displayName: "Veelgestelde Vragen & Technische Kennisbank",
      type: "text/html",
      url: `${origin}/nl/faq`,
      description:
        "Veelgestelde vragen over FDM printtoleranties, minimale wanddiktes, bestandseisen en materiaalkeuze (PLA, PETG, TPU, ABS).",
      representativeQueries: [
        "3D printen veelgestelde vragen",
        "Wat zijn de toleranties van FDM printen?",
        "Minimale wanddikte 3D print",
      ],
    },
    {
      identifier: `urn:air:${domain}:info:shipping-policy`,
      displayName: "Verzend- en Leveringsbeleid PostNL",
      type: "text/html",
      url: `${origin}/nl/shipping-policy`,
      description:
        "Informatie over verzending, verpakking en levering binnen 2 tot 5 werkdagen via PostNL Zakelijk in heel Nederland en België.",
      representativeQueries: [
        "Wat is de levertijd van 3D prints?",
        "PostNL bezorging 3D print service",
      ],
    },
    {
      identifier: `urn:air:${domain}:info:privacy`,
      displayName: "Privacybeleid & Bescherming CAD Bestanden",
      type: "text/html",
      url: `${origin}/nl/privacy`,
      description:
        "Privacybeleid en strikte vertrouwelijkheidswaarborgen voor geüploade 3D CAD/STEP-modellen en klantgegevens.",
      representativeQueries: [
        "Vertrouwelijke behandeling 3D CAD bestanden",
        "Privacybeleid 3D printen",
      ],
    },
    {
      identifier: `urn:air:${domain}:info:terms`,
      displayName: "Algemene Voorwaarden",
      type: "text/html",
      url: `${origin}/nl/terms`,
      description:
        "Algemene leverings- en betalingsvoorwaarden voor zakelijke en particuliere 3D printopdrachten.",
      representativeQueries: [
        "Leveringsvoorwaarden 3D print service",
        "Garantie op 3D prints",
      ],
    },
    {
      identifier: `urn:air:${domain}:info:refunds`,
      displayName: "Retourbeleid & Kwaliteitsgarantie",
      type: "text/html",
      url: `${origin}/nl/refunds`,
      description:
        "Kwaliteitsgarantie, tolerantiebeoordeling en herfabricagebeleid voor maatwerk 3D-geprinte onderdelen.",
      representativeQueries: [
        "Retourbeleid maatwerk 3D printen",
        "Herfabricage garantie 3D prints",
      ],
    },
  );

  return {
    specVersion: "1.0",
    host: {
      displayName: businessInfo.name,
      identifier: domain,
    },
    entries,
  };
}

/**
 * Generates llms.txt adhering to the llmstxt.org specification,
 * dynamically linking to all core solutions, cities, and tools.
 */
export function generateLlmsTxt(
  originUrl: string = businessInfo.website,
): string {
  const origin = getValidatedOrigin(originUrl);

  const solutionLinks = seoApplications
    .map(
      (app) =>
        `- [${app.names.nl}](${origin}/nl/oplossingen/${app.slug}): ${app.heroSubtitle.nl}`,
    )
    .join("\n");

  const cityLinks = dutchCities
    .map(
      (c) =>
        `- [3D Print Service ${getCityName(c, "nl")}](${origin}/nl/3d-print-service/${c.slug}): Lokale 3D-printservice voor ${getCityName(c, "nl")} (${c.province}) met snelle bezorging.`,
    )
    .join("\n");

  return `# ${businessInfo.name} - 3D Print Service Rotterdam & Nederland

> Allround professionele 3D-printservice gevestigd in Rotterdam, leverend door heel Nederland. Geschikt voor particulieren (B2C), hobbyisten, studenten én bedrijven (B2B). Geen minimale bestelgrootte: van 1 enkel uniek stuk of cosplay prop tot productieseries van 500+ onderdelen in hoogwaardig PLA, PETG, ABS en TPU.

## Bedrijfsinformatie & Kernwaarden

- Bedrijfsnaam: ${businessInfo.name}
- Website: ${origin}
- Locatie: ${businessInfo.address.locality}, Nederland
- Levertijd: Binnen 2 tot 5 werkdagen geleverd in heel Nederland en België (PostNL)
- Doelgroepen: Particulieren, hobbyisten, studenten, scholen, MKB & industriële bedrijven
- Minimale bestelgrootte: Geen minimum (enkelstuks van harte welkom)
- Bestandsformaten: STL, 3MF, OBJ, STEP

## Doelgroepen & Markten (Voor Wie Wij Printen)

- **Particulieren & Consumenten (B2C)**: Enkelstuks 3D-printen zonder minimale bestelgrootte. Kapotte plastic onderdelen namaken (reverse engineering van niet meer verkrijgbare onderdelen), huishoudelijke reparaties, custom gadgets, gepersonaliseerde cadeaus en interieurdecoratie.
- **Hobbyisten, Makers & Cosplay**: Cosplay rekwisieten, miniaturen, bordspellen accessoires, drone frames, RC-onderdelen en HueForge meerkleurige wandreliëfs. Directe ondersteuning voor modellen van Thingiverse, Printables en MakerWorld.
- **Studenten & Onderwijs**: Afstudeerprojecten, proof-of-concept prototypes, architectuurmaquettes en ontwerponderzoek voor studenten (o.a. TU Delft, Hogeschool Rotterdam, Erasmus Universiteit Rotterdam, etc.). Snel, betaalbaar en flexibel.
- **Bedrijven & MKB (B2B)**: Functionele prototypes, machine-onderdelen, montagemallen en kalibers (jigs & fixtures), behuizingen en serieproductie (10–500+ stuks) met zakelijke facturatie (BTW) en NDA geheimhouding.

## Kernoplossingen & Diensten

${solutionLinks}

## Materialen & Specificaties

- PLA: Biologisch afbreekbaar polymeer voor esthetische modellen, concept-prototypes en visuele controles (±0.1mm tolerantie).
- PETG: Slagvast, UV-bestendig en chemisch resistent materiaal (tot 75°C) voor industriële componenten en buitenmontage.
- TPU: Flexibel elastomeer met hoge slijtvastheid (Shore 95A) voor trillingsdempers, afdichtingen en flexibele koppelingen.
- ABS: Hittebestendig en taai thermoplastisch materiaal voor veeleisende mechanische toepassingen.

## Regionale Dekking (Steden in Nederland)

${cityLinks}

## Direct Offerte Aanvragen & Bestandsinspectie

- [Offerte Configurator](${origin}/nl/checkout): Upload uw STL of 3MF bestand voor automatische geometrie-inspectie en directe orderverwerking.

## Kennisbank, Beleid & Klantenservice

- [Veelgestelde Vragen (FAQ)](${origin}/nl/faq): Technische richtlijnen voor wanddiktes, toleranties en bestandsoptimalisatie.
- [Verzendbeleid](${origin}/nl/shipping-policy): Informatie over verzending binnen 2-5 werkdagen met PostNL.
- [Privacybeleid](${origin}/nl/privacy): Vertrouwelijke bescherming van persoonsgegevens en CAD-bestanden.
- [Algemene Voorwaarden](${origin}/nl/terms): Leverings- en betalingsvoorwaarden voor zakelijke en particuliere opdrachten.
- [Retourbeleid](${origin}/nl/refunds): Richtlijnen voor kwaliteitsgarantie en herfabricage van maatwerkproducten.

## Volledige Documentatie (LLMs Full)

- [Volledige Documentatie](${origin}/llms-full.txt): Compleet geconsolideerd tekstbestand met alle technische specificaties, FAQs en stedeninformatie.
`;
}

/**
 * Generates llms-full.txt providing full-text documentation of all solutions,
 * detailed technical material specifications, FAQs, and city coordinates.
 */
export function generateLlmsFullTxt(
  originUrl: string = businessInfo.website,
): string {
  const origin = getValidatedOrigin(originUrl);

  const solutionSections = seoApplications
    .map((app) => {
      const benefits = app.benefits.nl.map((b) => `  * ${b}`).join("\n");
      const faqs = app.faqs.nl
        .map((f) => `  **V: ${f.q}**\n  *A: ${f.a}*`)
        .join("\n\n");

      return `### ${app.names.nl}
- URL: ${origin}/nl/oplossingen/${app.slug}
- Badge: ${app.badge.nl}
- Tagline: ${app.tagline.nl}
- Doorlooptijd: ${app.leadTime}
- Nauwkeurigheid: ${app.precision}
- Aanbevolen Materialen: ${app.recommendedMaterials.join(", ")}

**Beschrijving:**
${app.description.nl}

**Belangrijkste Voordelen:**
${benefits}

**Veelgestelde Vragen:**
${faqs}
`;
    })
    .join("\n---\n\n");

  const cityDirectory = dutchCities
    .map(
      (c) =>
        `- **${getCityName(c, "nl")}** (${c.province}): [${origin}/nl/3d-print-service/${c.slug}](${origin}/nl/3d-print-service/${c.slug})${
          c.geo ? ` | Geo: Lat ${c.geo.lat}, Lng ${c.geo.lng}` : ""
        }`,
    )
    .join("\n");

  return `# ${businessInfo.name} - Volledige Documentatie voor LLMs & AI Agents

> Dit document bevat de complete, geconsolideerde specificaties, oplossingen, materialen en geografische dekking van ${businessInfo.name}.

---

## 1. Algemene Bedrijfsinformatie

- **Bedrijfsnaam**: ${businessInfo.name}
- **Website**: ${origin}
- **Hoofdkantoor**: ${businessInfo.address.locality}, Nederland
- **Klantenservice**: ${businessInfo.email}
- **Openingstijden**: ${businessInfo.openingHours.dayLabels.nl}, ${businessInfo.openingHours.opens} - ${businessInfo.openingHours.closes}
- **Logistieke partner**: PostNL Zakelijk (levering binnen 2-5 werkdagen in heel Nederland & België)
- **Doelgroepen**: Particulieren & Consumenten (B2C), Hobbyisten & Cosplayers, Studenten & Onderwijs, Bedrijven & MKB (B2B)
- **Minimale Bestelgrootte**: Geen minimum (enkelstuks van harte welkom)
- **Ondersteunde bestandsformaten**: STL, 3MF, OBJ, STEP

### Doelgroepenspecificatie
1. **Particulieren (B2C)**: Reproductie van kapotte plastic huishoudonderdelen, witgoed-onderdelen, autoonderdelen, unieke cadeaus en decoraties.
2. **Hobbyisten & Makers**: Cosplay props en helmen, miniaturen voor bordspellen/tabletop gaming, RC- en drone-onderdelen, multi-color HueForge kunstwerken.
3. **Studenten & Onderwijs**: Snel en voordelig printen van architectuurmaquettes, afstudeerprojecten en proof-of-concept prototypes (populair bij studenten van TU Delft, Hogeschool Rotterdam, Erasmus Universiteit Rotterdam, etc.).
4. **Bedrijven & MKB (B2B)**: Functionele prototypes, machinebouw onderdelen, montagemallen en kalibers (jigs & fixtures), behuizingen en kleine series (10-500+ stuks) met BTW-factuur en optionele NDA.

---

## 2. Technische Materiaalspecificaties

| Materiaal | Max. Temperatuur | Slagvastheid | Flexibiliteit | Typische Toepassing |
|---|---|---|---|---|
| **PLA** | ~55°C | Gemiddeld | Star / Rigide | Conceptprototypes, visuele modellen, pasvormcontroles |
| **PETG** | ~75°C | Hoog | Taai / Slagvast | Machine-onderdelen, reserveonderdelen, elektronica behuizingen |
| **TPU (95A)** | ~80°C | Zeer Hoog | Rubberachtig / Flexibel | Afdichtingen, trillingsdempers, flexibele koppelingen, bumpers |
| **ABS** | ~90°C | Zeer Hoog | Slagvast | Hittebestendige behuizingen, mechanische constructies |

**Standaard Toleranties**:
- FDM precisie: ±0.1mm passingstolerantie op gekalibreerde industriële printers
- Minimale wanddikte: 1.2mm (aanbevolen: 2.0mm voor dragende structuren)
- Minimale detailgrootte: 0.4mm

---

## 3. Uitgebreide Oplossingen & Diensten

${solutionSections}

---

## 4. Regionale Dekking (28 Nederlandse Steden)

${cityDirectory}

---

## 5. Bestelproces & Geautomatiseerde Offerte

1. **Bestand Uploaden**: Bezoek [${origin}/nl/checkout](${origin}/nl/checkout) en upload een STL-, 3MF- of STEP-bestand.
2. **Geometrie-inspectie**: Ons geautomatiseerde systeem inspecteert volume, wanddiktes en printbaarheid.
3. **Materiaalkeuze**: Selecteer PLA, PETG of TPU en gewenste kleur.
4. **Directe Prijs**: Real-time berekening zonder wachttijd.
5. **Productie & Verzending**: Productie gestart binnen 24 uur, verzonden via PostNL Zakelijk met Track & Trace.
`;
}
