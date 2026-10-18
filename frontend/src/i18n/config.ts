export const supportedLanguages = ["nl", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
export const defaultLanguage: SupportedLanguage = "nl";

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
};

export const ogLocaleMap: Record<SupportedLanguage, string> = {
  nl: "nl_NL",
  en: "en_US",
};

export const languageOptions: Array<{
  code: SupportedLanguage;
  label: string;
}> = [
  { code: "nl", label: "NL" },
  { code: "en", label: "EN" },
];

export const languageFlagMap: Record<SupportedLanguage, string> = {
  nl: "🇳🇱",
  en: "🇬🇧",
};

export const languageLabelMap: Record<SupportedLanguage, string> = {
  nl: "Nederlands",
  en: "English",
};

