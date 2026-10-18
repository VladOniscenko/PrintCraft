/// <reference types="vite/client" />
import type { SupportedLanguage } from "./config";
import type { TranslationNamespace, TranslationSchema } from "./schema";

// Core namespaces eager imports (NL and EN) for shell, SEO, navigation, and badges
import enCommon from "../locales/en/common.json";
import nlCommon from "../locales/nl/common.json";
import enNav from "../locales/en/nav.json";
import nlNav from "../locales/nl/nav.json";
import enFooter from "../locales/en/footer.json";
import nlFooter from "../locales/nl/footer.json";
import enSeo from "../locales/en/seo.json";
import nlSeo from "../locales/nl/seo.json";
import enCityPage from "../locales/en/cityPage.json";
import nlCityPage from "../locales/nl/cityPage.json";
import enOrderStatus from "../locales/en/orderStatus.json";
import nlOrderStatus from "../locales/nl/orderStatus.json";
import enColors from "../locales/en/colors.json";
import nlColors from "../locales/nl/colors.json";
import enRoot from "../locales/en/root.json";
import nlRoot from "../locales/nl/root.json";

// Vite dynamic glob for all locale files (statically analyzed by Vite for chunk splitting)
const localeModules =
  typeof import.meta.glob === "function"
    ? import.meta.glob<Record<string, unknown>>("../locales/*/*.json")
    : {};

export const CORE_NAMESPACES: TranslationNamespace[] = [
  "common",
  "nav",
  "footer",
  "seo",
  "cityPage",
  "orderStatus",
  "colors",
];

// In-memory store typed with canonical TranslationSchema for full compile-time autocomplete
export const translationsStore: Record<
  SupportedLanguage,
  TranslationSchema
> = {
  en: {
    ...enRoot,
    common: enCommon,
    nav: enNav,
    footer: enFooter,
    seo: enSeo,
    cityPage: enCityPage,
    orderStatus: enOrderStatus,
    colors: enColors,
  },
  nl: {
    ...nlRoot,
    common: nlCommon,
    nav: nlNav,
    footer: nlFooter,
    seo: nlSeo,
    cityPage: nlCityPage,
    orderStatus: nlOrderStatus,
    colors: nlColors,
  },
} as unknown as Record<SupportedLanguage, TranslationSchema>;

const loadingPromises: Record<string, Promise<void> | undefined> = {};
const loadedListeners = new Set<() => void>();

export function subscribeTranslations(listener: () => void) {
  loadedListeners.add(listener);
  return () => {
    loadedListeners.delete(listener);
  };
}

function notifyListeners() {
  for (const listener of loadedListeners) {
    listener();
  }
}

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
  namespace: TranslationNamespace,
): Promise<void> {
  if (isNamespaceLoaded(lang, namespace)) {
    return;
  }

  const key = `${lang}/${namespace}`;
  const existing = loadingPromises[key];
  if (existing) {
    await existing;
    return;
  }

  const modulePath = `../locales/${lang}/${namespace}.json`;
  const importer = localeModules[modulePath];

  if (!importer) {
    console.warn(`Locale module not found: ${modulePath}`);
    return;
  }

  const promise = importer()
    .then((mod) => {
      const data =
        mod && "default" in mod && mod.default
          ? (mod.default as Record<string, unknown>)
          : (mod as Record<string, unknown>);
      (
        translationsStore[lang] as unknown as Record<string, unknown>
      )[namespace] = data;
      notifyListeners();
    })
    .catch((err: unknown) => {
      console.error(`Failed to load translations for ${key}:`, err);
    })
    .finally(() => {
      delete loadingPromises[key];
    });

  loadingPromises[key] = promise;
  await promise;
}

export async function loadNamespaces(
  lang: SupportedLanguage,
  namespaces: TranslationNamespace[],
): Promise<void> {
  await Promise.all(namespaces.map((ns) => loadNamespace(lang, ns)));
}

