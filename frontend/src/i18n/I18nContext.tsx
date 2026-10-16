import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  languageOptions,
  translations,
  type SupportedLanguage,
  type TranslationKey,
} from "./translations";

type I18nContextType = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  languageOptions: typeof languageOptions;
  localizePath: (path: string) => string;
};


const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "language";

export function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "nl";
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  if (pathParts[0] === "en" || pathParts[0] === "nl") {
    return pathParts[0];
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "nl" || stored === "en") return stored;

  if (
    typeof navigator !== "undefined" &&
    navigator.language &&
    navigator.language.startsWith("en")
  ) {
    return "en";
  }
  return "nl";
}

function getNestedTranslation(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (
      current === undefined ||
      current === null ||
      typeof current !== "object"
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract language from URL path: /nl/... or /en/...
  const pathParts = location.pathname.split("/").filter(Boolean);
  const urlLang: SupportedLanguage | null =
    pathParts[0] === "en" || pathParts[0] === "nl" ? pathParts[0] : null;

  const stored =
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const storedLang: SupportedLanguage = stored === "en" ? "en" : "nl";

  // Active language prioritizes URL segment if valid, otherwise stored preference
  const language: SupportedLanguage = urlLang ?? storedLang;

  // Sync localStorage whenever a valid language appears in the URL
  useEffect(() => {
    if (urlLang) {
      localStorage.setItem(STORAGE_KEY, urlLang);
    }
  }, [urlLang]);

  const setLanguage = useCallback(
    (nextLanguage: SupportedLanguage) => {
      localStorage.setItem(STORAGE_KEY, nextLanguage);

      const parts = location.pathname.split("/").filter(Boolean);
      if (parts[0] === "en" || parts[0] === "nl") {
        parts[0] = nextLanguage;
      } else {
        parts.unshift(nextLanguage);
      }
      const nextPath = "/" + parts.join("/");
      navigate(nextPath + location.search + location.hash);
    },
    [location.pathname, location.search, location.hash, navigate],
  );

  const localizePath = useCallback(
    (targetPath: string): string => {
      const cleanTarget = targetPath.trim();
      if (!cleanTarget || cleanTarget === "/") {
        return `/${language}`;
      }
      const parts = cleanTarget.split("/").filter(Boolean);
      if (parts[0] === "en" || parts[0] === "nl") {
        parts[0] = language;
        return "/" + parts.join("/");
      }
      return `/${language}/${parts.join("/")}`;
    },
    [language],
  );

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      let value = getNestedTranslation(translations[language], key);

      if (!value) {
        value = getNestedTranslation(translations.en, key);
      }

      if (!value) {
        return `🔴 [${key}]`;
      }

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
    () => ({ language, setLanguage, t, languageOptions, localizePath }),
    [language, setLanguage, t, localizePath],
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
