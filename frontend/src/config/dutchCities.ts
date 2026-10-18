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
  { slug: "amsterdam", names: { nl: "Amsterdam", en: "Amsterdam", tr: "Amsterdam", ru: "Амстердам", ar: "أمستردام" }, province: "Noord-Holland", geo: { lat: 52.3676, lng: 4.9041 } },
  { slug: "rotterdam", names: { nl: "Rotterdam", en: "Rotterdam", tr: "Rotterdam", ru: "Роттердам", ar: "روتردام" }, province: "Zuid-Holland", geo: { lat: 51.9244, lng: 4.4777 } },
  { slug: "den-haag", names: { nl: "Den Haag", en: "The Hague", tr: "Lahey", ru: "Гаага", ar: "لاهاي" }, province: "Zuid-Holland", geo: { lat: 52.0705, lng: 4.3007 } },
  { slug: "utrecht", names: { nl: "Utrecht", en: "Utrecht", tr: "Utrecht", ru: "Утрехт", ar: "أوتريخت" }, province: "Utrecht", geo: { lat: 52.0907, lng: 5.1214 } },
  { slug: "eindhoven", names: { nl: "Eindhoven", en: "Eindhoven", tr: "Eindhoven", ru: "Эйндховен", ar: "أيندهوفن" }, province: "Noord-Brabant", geo: { lat: 51.4416, lng: 5.4697 } },
  { slug: "tilburg", names: { nl: "Tilburg", en: "Tilburg", tr: "Tilburg", ru: "Тилбург", ar: "تيلبورغ" }, province: "Noord-Brabant", geo: { lat: 51.5555, lng: 5.0913 } },
  { slug: "groningen", names: { nl: "Groningen", en: "Groningen", tr: "Groningen", ru: "Гронинген", ar: "خرونينغن" }, province: "Groningen", geo: { lat: 53.2194, lng: 6.5665 } },
  { slug: "almere", names: { nl: "Almere", en: "Almere", tr: "Almere", ru: "Алмере", ar: "ألميرا" }, province: "Flevoland", geo: { lat: 52.3508, lng: 5.2647 } },
  { slug: "breda", names: { nl: "Breda", en: "Breda", tr: "Breda", ru: "Бреда", ar: "بريدا" }, province: "Noord-Brabant", geo: { lat: 51.5719, lng: 4.7683 } },
  { slug: "nijmegen", names: { nl: "Nijmegen", en: "Nijmegen", tr: "Nijmegen", ru: "Неймеген", ar: "نايميخن" }, province: "Gelderland", geo: { lat: 51.8126, lng: 5.8372 } },
  { slug: "apeldoorn", names: { nl: "Apeldoorn", en: "Apeldoorn", tr: "Apeldoorn", ru: "Апелдорн", ar: "أبلدورن" }, province: "Gelderland", geo: { lat: 52.2112, lng: 5.9699 } },
  { slug: "haarlem", names: { nl: "Haarlem", en: "Haarlem", tr: "Haarlem", ru: "Харлем", ar: "هارلم" }, province: "Noord-Holland", geo: { lat: 52.3874, lng: 4.6462 } },
  { slug: "arnhem", names: { nl: "Arnhem", en: "Arnhem", tr: "Arnhem", ru: "Арнем", ar: "أرنهيم" }, province: "Gelderland", geo: { lat: 51.9851, lng: 5.8987 } },
  { slug: "enschede", names: { nl: "Enschede", en: "Enschede", tr: "Enschede", ru: "Энсхеде", ar: "أنسخديه" }, province: "Overijssel", geo: { lat: 52.2215, lng: 6.8937 } },
  { slug: "amersfoort", names: { nl: "Amersfoort", en: "Amersfoort", tr: "Amersfoort", ru: "Амерсфорт", ar: "أمرسفورت" }, province: "Utrecht", geo: { lat: 52.1561, lng: 5.3878 } },
  { slug: "zaanstad", names: { nl: "Zaanstad", en: "Zaanstad", tr: "Zaanstad", ru: "Занстад", ar: "زانستاد" }, province: "Noord-Holland", geo: { lat: 52.4420, lng: 4.8292 } },
  { slug: "s-hertogenbosch", names: { nl: "'s-Hertogenbosch", en: "'s-Hertogenbosch", tr: "'s-Hertogenbosch", ru: "Хертогенбос", ar: "سيرتوخيمبوس" }, province: "Noord-Brabant", geo: { lat: 51.6978, lng: 5.3037 } },
  { slug: "haarlemmermeer", names: { nl: "Haarlemmermeer", en: "Haarlemmermeer", tr: "Haarlemmermeer", ru: "Харлеммермер", ar: "هارلمرمير" }, province: "Noord-Holland", geo: { lat: 52.3025, lng: 4.6889 } },
  { slug: "zwolle", names: { nl: "Zwolle", en: "Zwolle", tr: "Zwolle", ru: "Зволле", ar: "زوولا" }, province: "Overijssel", geo: { lat: 52.5168, lng: 6.0830 } },
  { slug: "zoetermeer", names: { nl: "Zoetermeer", en: "Zoetermeer", tr: "Zoetermeer", ru: "Зутермер", ar: "زوترمير" }, province: "Zuid-Holland", geo: { lat: 52.0607, lng: 4.4940 } },
  { slug: "leiden", names: { nl: "Leiden", en: "Leiden", tr: "Leiden", ru: "Лейден", ar: "لايدن" }, province: "Zuid-Holland", geo: { lat: 52.1601, lng: 4.4970 } },
  { slug: "leeuwarden", names: { nl: "Leeuwarden", en: "Leeuwarden", tr: "Leeuwarden", ru: "Леуварден", ar: "ليوواردن" }, province: "Friesland", geo: { lat: 53.2012, lng: 5.7999 } },
  { slug: "dordrecht", names: { nl: "Dordrecht", en: "Dordrecht", tr: "Dordrecht", ru: "Дордрехт", ar: "دوردريخت" }, province: "Zuid-Holland", geo: { lat: 51.8133, lng: 4.6901 } },
  { slug: "maastricht", names: { nl: "Maastricht", en: "Maastricht", tr: "Maastricht", ru: "Маастрихт", ar: "ماستريخت" }, province: "Limburg", geo: { lat: 50.8514, lng: 5.6910 } },
  { slug: "ede", names: { nl: "Ede", en: "Ede", tr: "Ede", ru: "Эде", ar: "إيدي" }, province: "Gelderland", geo: { lat: 52.0442, lng: 5.6661 } },
  { slug: "delft", names: { nl: "Delft", en: "Delft", tr: "Delft", ru: "Делфт", ar: "دلفت" }, province: "Zuid-Holland", geo: { lat: 52.0116, lng: 4.3571 } },
  { slug: "deventer", names: { nl: "Deventer", en: "Deventer", tr: "Deventer", ru: "Девентер", ar: "ديفينتر" }, province: "Overijssel", geo: { lat: 52.2550, lng: 6.1625 } },
  { slug: "alkmaar", names: { nl: "Alkmaar", en: "Alkmaar", tr: "Alkmaar", ru: "Алкмар", ar: "ألكمار" }, province: "Noord-Holland", geo: { lat: 52.6324, lng: 4.7534 } },
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
