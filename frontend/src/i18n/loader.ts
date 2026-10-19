/// <reference types="vite/client" />
import type { SupportedLanguage } from "./config";
import type { TranslationNamespace, TranslationSchema } from "./schema";

// In-memory translation store populated on demand per active language
export const translationsStore: Record<SupportedLanguage, TranslationSchema> =
  {} as Record<SupportedLanguage, TranslationSchema>;

const localeLoaders: Record<
  SupportedLanguage,
  () => Promise<{ default: TranslationSchema }>
> = {
  nl: () => import("../locales/nl"),
  en: () => import("../locales/en"),
  tr: () => import("../locales/tr"),
  ru: () => import("../locales/ru"),
  ar: () => import("../locales/ar"),
};

const loadingPromises: Partial<
  Record<SupportedLanguage, Promise<TranslationSchema>>
> = {};
const loadedListeners = new Set<() => void>();

export function subscribeTranslations(listener: () => void) {
  loadedListeners.add(listener);
  return () => {
    loadedListeners.delete(listener);
  };
}

function notifyListeners() {
  for (const listener of loadedListeners) {
    try {
      listener();
    } catch (err) {
      console.error("Error in translation listener:", err);
    }
  }
}

export function isLanguageLoaded(lang: SupportedLanguage): boolean {
  return Boolean(translationsStore[lang]);
}

export async function loadLanguage(
  lang: SupportedLanguage,
): Promise<TranslationSchema> {
  if (translationsStore[lang]) {
    return translationsStore[lang];
  }

  const existing = loadingPromises[lang];
  if (existing) {
    return existing;
  }

  const loader = localeLoaders[lang];
  if (!loader) {
    console.error(`Unsupported language for translation loader: ${lang}`);
    return {} as TranslationSchema;
  }

  const promise = loader()
    .then((mod) => {
      translationsStore[lang] = mod.default;
      notifyListeners();
      return mod.default;
    })
    .catch((err) => {
      console.error(`Failed to load translation chunk for ${lang}:`, err);
      return {} as TranslationSchema;
    })
    .finally(() => {
      delete loadingPromises[lang];
    });

  loadingPromises[lang] = promise;
  return promise;
}

export const CORE_NAMESPACES: TranslationNamespace[] = [
  "common",
  "nav",
  "footer",
  "home",
  "hero",
  "recent",
  "faq",
  "seo",
  "cityPage",
  "orderStatus",
  "colors",
];

export function isNamespaceLoaded(
  lang: SupportedLanguage,
  namespace: TranslationNamespace,
): boolean {
  return Boolean(
    (translationsStore[lang] as unknown as Record<string, unknown>)?.[
      namespace
    ],
  );
}

export async function loadNamespace(
  lang: SupportedLanguage,
  _namespace: TranslationNamespace,
): Promise<void> {
  if (!isLanguageLoaded(lang)) {
    await loadLanguage(lang);
  }
}

export async function loadNamespaces(
  lang: SupportedLanguage,
  _namespaces: TranslationNamespace[],
): Promise<void> {
  if (!isLanguageLoaded(lang)) {
    await loadLanguage(lang);
  }
}
