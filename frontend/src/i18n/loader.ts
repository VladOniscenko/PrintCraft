/// <reference types="vite/client" />
import type { SupportedLanguage } from "./config";
import type { TranslationNamespace, TranslationSchema } from "./schema";

import en from "../locales/en";
import nl from "../locales/nl";
import tr from "../locales/tr";
import ru from "../locales/ru";
import ar from "../locales/ar";

// Direct in-memory store containing complete translation schema for all 5 languages
export const translationsStore: Record<
  SupportedLanguage,
  TranslationSchema
> = {
  en,
  nl,
  tr,
  ru,
  ar,
};

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

export function subscribeTranslations(_listener: () => void) {
  // All namespaces are present in-memory synchronously from application initialization.
  return () => {};
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
  _lang: SupportedLanguage,
  _namespace: TranslationNamespace,
): Promise<void> {
  return Promise.resolve();
}

export async function loadNamespaces(
  _lang: SupportedLanguage,
  _namespaces: TranslationNamespace[],
): Promise<void> {
  return Promise.resolve();
}
