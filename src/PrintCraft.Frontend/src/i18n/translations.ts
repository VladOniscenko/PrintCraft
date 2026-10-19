import { translationsStore } from "./loader";

export {
  supportedLanguages,
  defaultLanguage,
  isSupportedLanguage,
  resolveLanguage,
  htmlLangMap,
  ogLocaleMap,
  languageOptions,
  languageFlagMap,
  languageLabelMap,
  rtlLanguages,
  isRtlLanguage,
  getLanguageDirection,
  type SupportedLanguage,
} from "./config";

export {
  type TranslationKey,
  type TranslationNamespace,
  type TranslationSchema,
} from "./schema";

export const translations = translationsStore;
