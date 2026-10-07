import React, { createContext, useContext, useMemo, useState } from "react";
import {
  languageOptions,
  translations,
  type SupportedLanguage,
} from "./translations";

type I18nContextType = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
  languageOptions: typeof languageOptions;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "language";

function getInitialLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "nl" || stored === "en") return stored;

  // Default to Dutch (NL) — the primary market.
  // Only serve English if the browser explicitly reports an English locale
  // and it does not also match Dutch (e.g. "en-NL" should still get Dutch).
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("en") && !browser.startsWith("en-nl")) return "en";
  return "nl";
}

function getNestedTranslation(
  obj: Record<string, any>,
  path: string,
): string | undefined {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }

  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] =
    useState<SupportedLanguage>(getInitialLanguage);

  const setLanguage = (nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  const t = (key: string): string => {
    // 1. Try to find the key in the current language
    const primaryValue = getNestedTranslation(translations[language], key);
    if (primaryValue) return primaryValue;

    // 2. Fallback to English if it's missing in the current language
    const fallbackValue = getNestedTranslation(translations.en, key);
    if (fallbackValue) return fallbackValue;

    // 3. SAFE HIGHLIGHT: Return a string that stands out
    return `🔴 [${key}]`;
  };

  const value = useMemo(
    () => ({ language, setLanguage, t, languageOptions }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
