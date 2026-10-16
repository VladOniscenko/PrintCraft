import type { SupportedLanguage } from "../i18n/translations";

export interface DutchCity {
  slug: string;
  names: Record<SupportedLanguage, string>;
  province: string;
  geo?: {
    lat: number;
    lng: number;
  };
}

export const dutchCities: DutchCity[] = [
  { slug: "amsterdam", names: { nl: "Amsterdam", en: "Amsterdam" }, province: "Noord-Holland", geo: { lat: 52.3676, lng: 4.9041 } },
  { slug: "rotterdam", names: { nl: "Rotterdam", en: "Rotterdam" }, province: "Zuid-Holland", geo: { lat: 51.9244, lng: 4.4777 } },
  { slug: "den-haag", names: { nl: "Den Haag", en: "The Hague" }, province: "Zuid-Holland", geo: { lat: 52.0705, lng: 4.3007 } },
  { slug: "utrecht", names: { nl: "Utrecht", en: "Utrecht" }, province: "Utrecht", geo: { lat: 52.0907, lng: 5.1214 } },
  { slug: "eindhoven", names: { nl: "Eindhoven", en: "Eindhoven" }, province: "Noord-Brabant", geo: { lat: 51.4416, lng: 5.4697 } },
  { slug: "tilburg", names: { nl: "Tilburg", en: "Tilburg" }, province: "Noord-Brabant", geo: { lat: 51.5555, lng: 5.0913 } },
  { slug: "groningen", names: { nl: "Groningen", en: "Groningen" }, province: "Groningen", geo: { lat: 53.2194, lng: 6.5665 } },
  { slug: "almere", names: { nl: "Almere", en: "Almere" }, province: "Flevoland", geo: { lat: 52.3508, lng: 5.2647 } },
  { slug: "breda", names: { nl: "Breda", en: "Breda" }, province: "Noord-Brabant", geo: { lat: 51.5719, lng: 4.7683 } },
  { slug: "nijmegen", names: { nl: "Nijmegen", en: "Nijmegen" }, province: "Gelderland", geo: { lat: 51.8126, lng: 5.8372 } },
  { slug: "apeldoorn", names: { nl: "Apeldoorn", en: "Apeldoorn" }, province: "Gelderland", geo: { lat: 52.2112, lng: 5.9699 } },
  { slug: "haarlem", names: { nl: "Haarlem", en: "Haarlem" }, province: "Noord-Holland", geo: { lat: 52.3874, lng: 4.6462 } },
  { slug: "arnhem", names: { nl: "Arnhem", en: "Arnhem" }, province: "Gelderland", geo: { lat: 51.9851, lng: 5.8987 } },
  { slug: "enschede", names: { nl: "Enschede", en: "Enschede" }, province: "Overijssel", geo: { lat: 52.2215, lng: 6.8937 } },
  { slug: "amersfoort", names: { nl: "Amersfoort", en: "Amersfoort" }, province: "Utrecht", geo: { lat: 52.1561, lng: 5.3878 } },
  { slug: "zaanstad", names: { nl: "Zaanstad", en: "Zaanstad" }, province: "Noord-Holland", geo: { lat: 52.4420, lng: 4.8292 } },
  { slug: "s-hertogenbosch", names: { nl: "'s-Hertogenbosch", en: "'s-Hertogenbosch" }, province: "Noord-Brabant", geo: { lat: 51.6978, lng: 5.3037 } },
  { slug: "haarlemmermeer", names: { nl: "Haarlemmermeer", en: "Haarlemmermeer" }, province: "Noord-Holland", geo: { lat: 52.3025, lng: 4.6889 } },
  { slug: "zwolle", names: { nl: "Zwolle", en: "Zwolle" }, province: "Overijssel", geo: { lat: 52.5168, lng: 6.0830 } },
  { slug: "zoetermeer", names: { nl: "Zoetermeer", en: "Zoetermeer" }, province: "Zuid-Holland", geo: { lat: 52.0607, lng: 4.4940 } },
  { slug: "leiden", names: { nl: "Leiden", en: "Leiden" }, province: "Zuid-Holland", geo: { lat: 52.1601, lng: 4.4970 } },
  { slug: "leeuwarden", names: { nl: "Leeuwarden", en: "Leeuwarden" }, province: "Friesland", geo: { lat: 53.2012, lng: 5.7999 } },
  { slug: "dordrecht", names: { nl: "Dordrecht", en: "Dordrecht" }, province: "Zuid-Holland", geo: { lat: 51.8133, lng: 4.6901 } },
  { slug: "maastricht", names: { nl: "Maastricht", en: "Maastricht" }, province: "Limburg", geo: { lat: 50.8514, lng: 5.6910 } },
  { slug: "ede", names: { nl: "Ede", en: "Ede" }, province: "Gelderland", geo: { lat: 52.0442, lng: 5.6661 } },
  { slug: "delft", names: { nl: "Delft", en: "Delft" }, province: "Zuid-Holland", geo: { lat: 52.0116, lng: 4.3571 } },
  { slug: "deventer", names: { nl: "Deventer", en: "Deventer" }, province: "Overijssel", geo: { lat: 52.2550, lng: 6.1625 } },
  { slug: "alkmaar", names: { nl: "Alkmaar", en: "Alkmaar" }, province: "Noord-Holland", geo: { lat: 52.6324, lng: 4.7534 } },
];

export function getCityName(city: DutchCity, lang: SupportedLanguage): string {
  return city.names[lang] || city.names.nl || city.names.en;
}

export function getDutchCityBySlug(slug: string): DutchCity | undefined {
  const normalized = slug.trim().toLowerCase();
  return dutchCities.find((c) => c.slug === normalized);
}

export function getAllCitySlugs(): string[] {
  return dutchCities.map((c) => c.slug);
}
