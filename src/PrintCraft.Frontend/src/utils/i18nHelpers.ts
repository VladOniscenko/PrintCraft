import { defaultLanguage } from "../i18n/translations";

/**
 * Resolves a multilingual dictionary value with scalable fallback:
 * 1. Requested language
 * 2. Default language ("nl")
 * 3. English ("en")
 * 4. First available non-empty entry
 * 5. Fallback string
 */
export function getLocalizedText(
  dict?: Record<string, string> | null,
  lang: string = defaultLanguage,
  fallback = "",
): string {
  if (!dict) return fallback;
  return (
    dict[lang] ||
    dict[defaultLanguage] ||
    dict["en"] ||
    Object.values(dict).find((v) => typeof v === "string" && v.trim().length > 0) ||
    fallback
  );
}

/**
 * Resolves a multilingual list with scalable fallback.
 */
export function getLocalizedList(
  dict?: Record<string, string[]> | null,
  lang: string = defaultLanguage,
  fallback: string[] = [],
): string[] {
  if (!dict) return fallback;
  return (
    dict[lang] ||
    dict[defaultLanguage] ||
    dict["en"] ||
    Object.values(dict).find((v) => Array.isArray(v) && v.length > 0) ||
    fallback
  );
}

/**
 * Resolves a multilingual FAQ list with scalable fallback.
 */
export function getLocalizedFaqs<T>(
  dict?: Record<string, T[]> | null,
  lang: string = defaultLanguage,
  fallback: T[] = [],
): T[] {
  if (!dict) return fallback;
  return (
    dict[lang] ||
    dict[defaultLanguage] ||
    dict["en"] ||
    Object.values(dict).find((v) => Array.isArray(v) && v.length > 0) ||
    fallback
  );
}
