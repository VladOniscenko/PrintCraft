import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  languageOptions,
  translations,
  isSupportedLanguage,
  resolveLanguage,
  defaultLanguage,
  htmlLangMap,
  getLanguageDirection,
  type SupportedLanguage,
  type TranslationKey,
  type TranslationNamespace,
} from "./translations";
import {
  subscribeTranslations,
  loadNamespaces,
  isNamespaceLoaded,
} from "./loader";

type I18nContextType = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  languageOptions: typeof languageOptions;
  localizePath: (path: string) => string;
  loadNamespaces: (namespaces: TranslationNamespace[]) => Promise<void>;
  isNamespaceLoaded: (namespace: TranslationNamespace) => boolean;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = "language";

export function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return defaultLanguage;
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  if (isSupportedLanguage(pathParts[0])) {
    return pathParts[0];
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isSupportedLanguage(stored)) return stored;

  if (
    typeof navigator !== "undefined" &&
    navigator.language &&
    navigator.language.startsWith("en")
  ) {
    return "en";
  }
  return defaultLanguage;
}

function getNestedTranslation(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
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
  const [version, setVersion] = useState(0);

  // Re-render when newly loaded namespaces arrive
  useEffect(() => {
    return subscribeTranslations(() => {
      setVersion((v) => v + 1);
    });
  }, []);

  // Extract language from URL path: /nl/... or /en/...
  const pathParts = location.pathname.split("/").filter(Boolean);
  const urlLang: SupportedLanguage | null = isSupportedLanguage(pathParts[0])
    ? pathParts[0]
    : null;

  const stored =
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const storedLang: SupportedLanguage = resolveLanguage(stored);

  // Active language prioritizes URL segment if valid, otherwise stored preference
  const language: SupportedLanguage = urlLang ?? storedLang;

  // Sync localStorage whenever a valid language appears in the URL
  useEffect(() => {
    if (urlLang) {
      localStorage.setItem(STORAGE_KEY, urlLang);
    }
  }, [urlLang]);

  // Dynamically update html lang and dir (LTR/RTL) attributes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = htmlLangMap[language] || language;
      document.documentElement.dir = getLanguageDirection(language);
    }
  }, [language]);

  const setLanguage = useCallback(
    (nextLanguage: SupportedLanguage) => {
      localStorage.setItem(STORAGE_KEY, nextLanguage);

      const parts = location.pathname.split("/").filter(Boolean);
      if (isSupportedLanguage(parts[0])) {
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
      if (isSupportedLanguage(parts[0])) {
        parts[0] = language;
        return "/" + parts.join("/");
      }
      return `/${language}/${parts.join("/")}`;
    },
    [language],
  );

  const loadNamespacesForLanguage = useCallback(
    (namespaces: TranslationNamespace[]) => {
      return loadNamespaces(language, namespaces);
    },
    [language],
  );

  const checkNamespaceLoaded = useCallback(
    (namespace: TranslationNamespace) => {
      return isNamespaceLoaded(language, namespace);
    },
    [language],
  );

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      let value = getNestedTranslation(translations[language], key);

      // Fallback to English if translation is missing in current language
      if (!value && language !== "en") {
        value = getNestedTranslation(translations.en, key);
      }

      // Fallback to Dutch (default canonical language) if still missing
      if (!value && language !== "nl") {
        value = getNestedTranslation(translations.nl, key);
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
    () => ({
      language,
      setLanguage,
      t,
      languageOptions,
      localizePath,
      loadNamespaces: loadNamespacesForLanguage,
      isNamespaceLoaded: checkNamespaceLoaded,
    }),
    [
      language,
      setLanguage,
      t,
      localizePath,
      loadNamespacesForLanguage,
      checkNamespaceLoaded,
      version,
    ],
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
