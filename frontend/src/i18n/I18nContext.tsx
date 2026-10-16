import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  languageOptions,
  translations,
  type SupportedLanguage,
} from "./translations";

type I18nContextType = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languageOptions: typeof languageOptions;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "language";

function getInitialLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "nl" || stored === "en") return stored;

  // Default to Dutch (NL) — primary language for the shop
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

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      // 1. Try to find the key in the current language
      let value = getNestedTranslation(translations[language], key);

      // 2. Fallback to English if it's missing in the current language
      if (!value) {
        value = getNestedTranslation(translations.en, key);
      }

      // 3. SAFE HIGHLIGHT: Return a string that stands out
      if (!value) {
        return `🔴 [${key}]`;
      }

      // 4. Interpolate variables if provided (e.g. {count})
      if (vars) {
        for (const [varKey, varVal] of Object.entries(vars)) {
          value = value.replaceAll(`{${varKey}}`, String(varVal));
        }
      }

      return value;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, languageOptions }),
    [language, t],
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
