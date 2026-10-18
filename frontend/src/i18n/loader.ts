/// <reference types="vite/client" />
import type { SupportedLanguage } from "./config";
import type { TranslationNamespace, TranslationSchema } from "./schema";

// Core namespaces eager imports (NL, EN, TR, RU, AR) for shell, SEO, home landing, navigation, and badges
import enCommon from "../locales/en/common.json";
import nlCommon from "../locales/nl/common.json";
import trCommon from "../locales/tr/common.json";
import ruCommon from "../locales/ru/common.json";
import arCommon from "../locales/ar/common.json";

import enNav from "../locales/en/nav.json";
import nlNav from "../locales/nl/nav.json";
import trNav from "../locales/tr/nav.json";
import ruNav from "../locales/ru/nav.json";
import arNav from "../locales/ar/nav.json";

import enFooter from "../locales/en/footer.json";
import nlFooter from "../locales/nl/footer.json";
import trFooter from "../locales/tr/footer.json";
import ruFooter from "../locales/ru/footer.json";
import arFooter from "../locales/ar/footer.json";

import enHome from "../locales/en/home.json";
import nlHome from "../locales/nl/home.json";
import trHome from "../locales/tr/home.json";
import ruHome from "../locales/ru/home.json";
import arHome from "../locales/ar/home.json";

import enHero from "../locales/en/hero.json";
import nlHero from "../locales/nl/hero.json";
import trHero from "../locales/tr/hero.json";
import ruHero from "../locales/ru/hero.json";
import arHero from "../locales/ar/hero.json";

import enRecent from "../locales/en/recent.json";
import nlRecent from "../locales/nl/recent.json";
import trRecent from "../locales/tr/recent.json";
import ruRecent from "../locales/ru/recent.json";
import arRecent from "../locales/ar/recent.json";

import enFaq from "../locales/en/faq.json";
import nlFaq from "../locales/nl/faq.json";
import trFaq from "../locales/tr/faq.json";
import ruFaq from "../locales/ru/faq.json";
import arFaq from "../locales/ar/faq.json";

import enSeo from "../locales/en/seo.json";
import nlSeo from "../locales/nl/seo.json";
import trSeo from "../locales/tr/seo.json";
import ruSeo from "../locales/ru/seo.json";
import arSeo from "../locales/ar/seo.json";

import enCityPage from "../locales/en/cityPage.json";
import nlCityPage from "../locales/nl/cityPage.json";
import trCityPage from "../locales/tr/cityPage.json";
import ruCityPage from "../locales/ru/cityPage.json";
import arCityPage from "../locales/ar/cityPage.json";

import enOrderStatus from "../locales/en/orderStatus.json";
import nlOrderStatus from "../locales/nl/orderStatus.json";
import trOrderStatus from "../locales/tr/orderStatus.json";
import ruOrderStatus from "../locales/ru/orderStatus.json";
import arOrderStatus from "../locales/ar/orderStatus.json";

import enColors from "../locales/en/colors.json";
import nlColors from "../locales/nl/colors.json";
import trColors from "../locales/tr/colors.json";
import ruColors from "../locales/ru/colors.json";
import arColors from "../locales/ar/colors.json";

import enRoot from "../locales/en/root.json";
import nlRoot from "../locales/nl/root.json";
import trRoot from "../locales/tr/root.json";
import ruRoot from "../locales/ru/root.json";
import arRoot from "../locales/ar/root.json";

// Vite dynamic glob for on-demand page locale files (statically analyzed by Vite for chunk splitting)
const localeModules =
  typeof import.meta.glob === "function"
    ? import.meta.glob<Record<string, unknown>>("../locales/*/*.json")
    : {};

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
    home: enHome,
    hero: enHero,
    recent: enRecent,
    faq: enFaq,
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
    home: nlHome,
    hero: nlHero,
    recent: nlRecent,
    faq: nlFaq,
    seo: nlSeo,
    cityPage: nlCityPage,
    orderStatus: nlOrderStatus,
    colors: nlColors,
  },
  tr: {
    ...trRoot,
    common: trCommon,
    nav: trNav,
    footer: trFooter,
    home: trHome,
    hero: trHero,
    recent: trRecent,
    faq: trFaq,
    seo: trSeo,
    cityPage: trCityPage,
    orderStatus: trOrderStatus,
    colors: trColors,
  },
  ru: {
    ...ruRoot,
    common: ruCommon,
    nav: ruNav,
    footer: ruFooter,
    home: ruHome,
    hero: ruHero,
    recent: ruRecent,
    faq: ruFaq,
    seo: ruSeo,
    cityPage: ruCityPage,
    orderStatus: ruOrderStatus,
    colors: ruColors,
  },
  ar: {
    ...arRoot,
    common: arCommon,
    nav: arNav,
    footer: arFooter,
    home: arHome,
    hero: arHero,
    recent: arRecent,
    faq: arFaq,
    seo: arSeo,
    cityPage: arCityPage,
    orderStatus: arOrderStatus,
    colors: arColors,
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
    try {
      listener();
    } catch (err) {
      console.error("Error in translation listener:", err);
    }
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
