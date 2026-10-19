/**
 * Formatting and translation helper utilities for checkout, quotes, and materials.
 */

import type { TranslationKey } from "../i18n/translations";

/**
 * Translates single or comma/slash-separated color strings (e.g. "Black, Green, White" -> "Zwart, Groen, Wit").
 * Supports material suffixes like "Black PLA" -> "Zwart PLA" or "White PETG" -> "Wit PETG".
 */
export function translateColorText(
  colorText: string | undefined | null,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
): string {
  if (!colorText) return "";

  // Split by comma if multiple colors e.g. "Black, Green, White"
  const parts = colorText.split(",");
  const translatedParts = parts.map((part) => {
    const trimmed = part.trim();
    if (!trimmed) return "";

    // 1. Check if color has slash-separated subparts e.g. "Black / Red / Yellow / White"
    if (trimmed.includes("/")) {
      return trimmed
        .split("/")
        .map((sub) => translateColorText(sub.trim(), t))
        .join(" / ");
    }

    // 2. Check if color has a material suffix like " PLA" or " PETG" e.g. "Black PLA" -> "Zwart PLA"
    const materialMatch = trimmed.match(/^(.+?)\s+(PLA|PETG|TPU|ABS|ASA)$/i);
    let colorName = trimmed;
    let materialSuffix = "";
    if (materialMatch) {
      colorName = materialMatch[1].trim();
      materialSuffix = ` ${materialMatch[2].toUpperCase()}`;
    }

    // 3. Normalize key: e.g. "Deep Black" -> "deepBlack", "black" -> "black"
    const lower = colorName.toLowerCase();
    const camel = lower.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));

    let translated = t(`colors.${lower}` as TranslationKey);
    if (translated && !translated.startsWith("🔴")) {
      return `${translated}${materialSuffix}`;
    }

    translated = t(`colors.${camel}` as TranslationKey);
    if (translated && !translated.startsWith("🔴")) {
      return `${translated}${materialSuffix}`;
    }

    // 4. Check for direct match on the trimmed input itself if no material match was split
    if (materialSuffix) {
      const wholeLower = trimmed.toLowerCase();
      const wholeCamel = wholeLower.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));
      const wholeTrans =
        t(`colors.${wholeLower}` as TranslationKey) ||
        t(`colors.${wholeCamel}` as TranslationKey);
      if (wholeTrans && !wholeTrans.startsWith("🔴")) {
        return wholeTrans;
      }
    }

    return trimmed;
  });

  return translatedParts.filter(Boolean).join(", ");
}

/**
 * Localizes print quality description strings across standard CAD slicing and HueForge filament paintings.
 * E.g. "Best Quality (Filament Painting)" -> "Beste kwaliteit (Filament schilderij)"
 */
export function formatPrintQuality(
  quality: string | undefined | null,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
): string {
  if (!quality) return "";

  const qLower = quality.toLowerCase();

  // Filament painting quality formats
  if (qLower.includes("filament painting") || qLower.includes("filament schilderij")) {
    if (qLower.includes("best")) {
      return t("quote.qualityBestFilamentPainting");
    }
    if (qLower.includes("medium")) {
      return t("quote.qualityMediumFilamentPainting");
    }
    if (qLower.includes("draft") || qLower.includes("low")) {
      return t("quote.qualityDraftFilamentPainting");
    }
    return t("quote.qualityFilamentPainting");
  }

  // Standard 3D print qualities
  if (qLower.includes("0.12") || qLower.includes("detail") || qLower.includes("fine")) {
    return t("quote.qualityDetail");
  }
  if (qLower.includes("0.20") || qLower.includes("standard")) {
    return t("quote.qualityStandard");
  }
  if (qLower.includes("0.28") || qLower.includes("draft") || qLower.includes("fast")) {
    return t("quote.qualityDraft");
  }

  return quality;
}

