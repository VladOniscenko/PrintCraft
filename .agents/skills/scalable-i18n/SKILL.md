---
name: scalable-i18n
description: >-
  Enforces scalable internationalization (i18n) patterns across the repository.
  Strictly prohibits binary language ternaries (e.g. isNl ? ... : ..., lang === "nl"),
  hardcoded language suffixes (e.g. nameEn), and ad-hoc language conditionals.
---

# Scalable Internationalization (i18n) Skill & Standards

This project is built to support international expansion across multiple European languages (`nl`, `en`, `de`, `fr`, etc.).
Any code that assumes a binary language model (e.g., "either Dutch or English") will break when adding new languages and is strictly prohibited.

---

## 1. Prohibited Anti-Patterns (Never Do This)

### ❌ Anti-Pattern 1: Binary Ternary Conditionals for Localized Data
```ts
// STUPID & FORBIDDEN:
const cityName = isNl ? city.name : city.nameEn;
const label = language === "nl" ? "3D Print Diensten" : "3D Printing Services";
const country = lang === "nl" ? "Nederland" : "Netherlands";
const locale = isNl ? "nl_NL" : "en_US";
const htmlLang = isNl ? "nl-NL" : "en";
```
*Why this is prohibited*: If a user selects German (`de`), French (`fr`), or Spanish (`es`), these expressions fail silently or display the wrong language.

### ❌ Anti-Pattern 2: Language-Suffixed Object Properties
```ts
// FORBIDDEN:
interface City {
  slug: string;
  name: string;
  nameEn: string; // Hardcoded to English only
}
```
*Why this is prohibited*: Adding 5 more languages requires changing the interface to `nameDe`, `nameFr`, `nameEs`, breaking all consumers.

### ❌ Anti-Pattern 3: Hardcoded Language Validation
```ts
// FORBIDDEN:
if (lang === "en" || lang === "nl") ...
const preferred = stored === "en" ? "en" : "nl";
```
*Why this is prohibited*: Forces manual edits to route guards and redirects for every single new locale.

---

## 2. Prescribed Scalable Patterns (Always Do This)

### ✅ Pattern 1: Dictionary Types Keyed by `SupportedLanguage`
Whenever entities or configuration objects contain localized names, define them as a dictionary keyed by `SupportedLanguage`:
```ts
import type { SupportedLanguage } from "../i18n/translations";

export interface DutchCity {
  slug: string;
  names: Record<SupportedLanguage, string>;
  province: string;
}

export function getCityName(city: DutchCity, lang: SupportedLanguage): string {
  return city.names[lang] || city.names.nl || city.names.en;
}
```
*Result*: TypeScript's compiler (`tsc -b`) guarantees at build time that every city has a translation for all supported languages.

### ✅ Pattern 2: Global Scalable Maps for Platform Identifiers
In `src/i18n/translations.ts`:
```ts
export const supportedLanguages = ["nl", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
export const defaultLanguage: SupportedLanguage = "nl";

export const htmlLangMap: Record<SupportedLanguage, string> = {
  nl: "nl-NL",
  en: "en",
};

export const ogLocaleMap: Record<SupportedLanguage, string> = {
  nl: "nl_NL",
  en: "en_US",
};
```
Consumers simply use:
```ts
document.documentElement.lang = htmlLangMap[activeLang] || activeLang;
upsertMetaByProperty("og:locale", ogLocaleMap[activeLang] || "en_US");
```

### ✅ Pattern 3: Dynamic Language Resolution Helpers
Use `isSupportedLanguage` and `resolveLanguage`:
```ts
export function isSupportedLanguage(lang: unknown): lang is SupportedLanguage {
  return typeof lang === "string" && (supportedLanguages as readonly string[]).includes(lang);
}

export function resolveLanguage(lang: unknown): SupportedLanguage {
  if (isSupportedLanguage(lang)) {
    return lang;
  }
  return defaultLanguage;
}
```
In Route Guards and Redirects:
```tsx
const preferred = resolveLanguage(localStorage.getItem("language"));

if (!isSupportedLanguage(lang)) {
  return <NotFound />;
}
```

### ✅ Pattern 4: Centralized Copy in `translations.ts`
All descriptive strings (including schema text, catalog names, and service descriptions) must live in `translations.ts`:
```ts
const tSource = translations[language] || translations[defaultLanguage];
const catalogName = tSource.seo.schema.catalogName;
```

### ✅ Pattern 5: Dynamic Iteration for Sitemaps and Alternate Links
Never hardcode two languages when generating tags or sitemaps. Loop over `supportedLanguages`:
```ts
for (const sLang of supportedLanguages) {
  upsertHreflang(sLang, `${origin}/${sLang}${subRouteSuffix}`);
}
upsertHreflang("x-default", `${origin}/${defaultLanguage}${subRouteSuffix}`);
```

---

## 3. How to Add a New Language

When adding a new language (e.g., German `de`):
1. Add `"de"` to `supportedLanguages` in `src/i18n/translations.ts`.
2. Add `"de"` entries to `htmlLangMap`, `ogLocaleMap`, and `languageOptions`.
3. Add the `de` translations object to `translations`.
4. Run `npm run check:i18n`.
   TypeScript will automatically identify every entity dictionary (e.g. `dutchCities`) that needs the new language key.
5. `npm run build` will automatically generate pre-rendered pages, schema, and sitemap entries for the new language with 0 extra configuration!

