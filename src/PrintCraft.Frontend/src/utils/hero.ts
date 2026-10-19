import type { HeroSlide } from "../types";
import type { SupportedLanguage } from "../i18n/translations";

export function getHeroSlideTitle(
  slide: HeroSlide,
  language: SupportedLanguage,
): string {
  if (slide.titles?.[language]?.trim()) {
    return slide.titles[language].trim();
  }
  if (language === "nl" && slide.titleNl?.trim()) {
    return slide.titleNl.trim();
  }
  if (slide.titles?.en?.trim()) {
    return slide.titles.en.trim();
  }
  return slide.title || "";
}

export function getHeroSlideSubtext(
  slide: HeroSlide,
  language: SupportedLanguage,
): string {
  if (slide.subtexts?.[language]?.trim()) {
    return slide.subtexts[language].trim();
  }
  if (language === "nl" && slide.subtextNl?.trim()) {
    return slide.subtextNl.trim();
  }
  if (slide.subtexts?.en?.trim()) {
    return slide.subtexts.en.trim();
  }
  return slide.subtext || "";
}

export function getHeroSlidePrice(
  slide: HeroSlide,
  language: SupportedLanguage,
): string {
  if (slide.priceTexts?.[language]?.trim()) {
    return slide.priceTexts[language].trim();
  }
  if (language === "nl" && slide.priceTextNl?.trim()) {
    return slide.priceTextNl.trim();
  }
  if (slide.priceTexts?.en?.trim()) {
    return slide.priceTexts.en.trim();
  }
  return slide.priceText || "";
}

export function getHeroSlideTooltip(
  slide: HeroSlide,
  language: SupportedLanguage,
): string | undefined {
  if (slide.instructionTooltips?.[language]?.trim()) {
    return slide.instructionTooltips[language].trim();
  }
  if (language === "nl" && slide.instructionTooltipNl?.trim()) {
    return slide.instructionTooltipNl.trim();
  }
  if (slide.instructionTooltips?.en?.trim()) {
    return slide.instructionTooltips.en.trim();
  }
  return slide.instructionTooltip?.trim() || undefined;
}

