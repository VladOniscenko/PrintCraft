export const supportedLanguages = ["nl", "en", "tr", "ru", "ar"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
export const defaultLanguage: SupportedLanguage = "nl";

export const rtlLanguages: readonly SupportedLanguage[] = ["ar"] as const;

export function isRtlLanguage(lang: unknown): boolean {
  return (
    typeof lang === "string" &&
    (rtlLanguages as readonly string[]).includes(lang)
  );
}

export function getLanguageDirection(lang: unknown): "rtl" | "ltr" {
  return isRtlLanguage(lang) ? "rtl" : "ltr";
}

export function isSupportedLanguage(lang: unknown): lang is SupportedLanguage {
  return (
    typeof lang === "string" &&
    (supportedLanguages as readonly string[]).includes(lang)
  );
}

export function resolveLanguage(lang: unknown): SupportedLanguage {
  if (isSupportedLanguage(lang)) {
    return lang;
  }
  return defaultLanguage;
}

export const htmlLangMap: Record<SupportedLanguage, string> = {
  nl: "nl-NL",
  en: "en",
  tr: "tr-TR",
  ru: "ru-RU",
  ar: "ar-SA",
};

export const ogLocaleMap: Record<SupportedLanguage, string> = {
  nl: "nl_NL",
  en: "en_US",
  tr: "tr_TR",
  ru: "ru_RU",
  ar: "ar_SA",
};

export const languageOptions: Array<{
  code: SupportedLanguage;
  label: string;
}> = [
  { code: "nl", label: "NL" },
  { code: "en", label: "EN" },
  { code: "tr", label: "TR" },
  { code: "ru", label: "RU" },
  { code: "ar", label: "AR" },
];

export const languageFlagMap: Record<SupportedLanguage, string> = {
  nl: "🇳🇱",
  en: "🇬🇧",
  tr: "🇹🇷",
  ru: "🇷🇺",
  ar: "🇸🇦",
};

export const languageLabelMap: Record<SupportedLanguage, string> = {
  nl: "Nederlands",
  en: "English",
  tr: "Türkçe",
  ru: "Русский",
  ar: "العربية",
};
