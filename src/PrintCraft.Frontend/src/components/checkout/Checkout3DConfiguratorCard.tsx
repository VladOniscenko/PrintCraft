import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  RefreshCw,
  ArrowRight,
  Upload,
  Check,
} from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import type { OrderItem, Filament } from "../../types";
import { calculateIndicativePrice } from "../../utils/indicativePricing";
import { getFilamentHexColor } from "../../utils/filamentColors";
import { translateColorText } from "../../utils/formatters";

function hexNumberToCss(hex: number): string {
  return "#" + hex.toString(16).padStart(6, "0");
}

interface Checkout3DConfiguratorCardProps {
  item: OrderItem;
  filaments: Filament[];
  hasModel: boolean;
  onUpdateItem: <K extends keyof OrderItem>(field: K, value: OrderItem[K]) => void;
  onOpenFarmCatalog: () => void;
  onAddNewModel: () => void;
  onProceed: () => void;
  onUploadTrigger: () => void;
  canAddMoreModels?: boolean;
}

const QUALITY_OPTIONS = [
  {
    id: "Draft (0.24mm)",
    titleKey: "quote.qualityDraftTitle",
    subtitleKey: "quote.qualityDraftSubtitle",
    descKey: "quote.qualityDraftDesc",
  },
  {
    id: "Standard (0.20mm)",
    titleKey: "quote.qualityStandardTitle",
    subtitleKey: "quote.qualityStandardSubtitle",
    descKey: "quote.qualityStandardDesc",
  },
  {
    id: "High Quality (0.12mm)",
    titleKey: "quote.qualityHighTitle",
    subtitleKey: "quote.qualityHighSubtitle",
    descKey: "quote.qualityHighDesc",
  },
] as const;

const QUICK_QUANTITIES = [10, 100, 5000] as const;

const AVAILABLE_MATERIALS = ["PLA", "PETG", "ABS", "TPU"] as const;

const INFILL_OPTIONS = [
  { value: 15, key: "quote.infill15" },
  { value: 20, key: "quote.infill20" },
  { value: 40, key: "quote.infill40" },
  { value: 100, key: "quote.infill100" },
] as const;

export default function Checkout3DConfiguratorCard({
  item,
  filaments,
  hasModel,
  onUpdateItem,
  onOpenFarmCatalog,
  onAddNewModel,
  onProceed,
  onUploadTrigger,
  canAddMoreModels = true,
}: Checkout3DConfiguratorCardProps) {
  const { t } = useI18n();
  const [paramsExpanded, setParamsExpanded] = useState(false);

  const currentQuality = item.printQuality || "Standard (0.20mm)";
  const currentCount = Math.max(1, item.count || 1);
  const currentMaterial = item.material || "PLA";
  const currentColor = item.color || "Black";
  const currentInfill = item.infillPercent ?? 20;
  const currentSupports = !!item.supportsNeeded;

  // Filter available colors for active material
  const materialFilaments = filaments.filter(
    (f) =>
      f.material.toLowerCase() === currentMaterial.toLowerCase() &&
      f.inStock !== false,
  );
  const availableColors = Array.from(
    new Set(
      materialFilaments.length > 0
        ? materialFilaments.map((f) => f.color)
        : ["Black", "White", "Gray", "Red", "Blue", "Green", "Orange"],
    ),
  );

  // Live preliminary price calculation
  const calculatedPrice = calculateIndicativePrice({
    dimensionX: item.dimensionX ?? item.dimensionBaseX,
    dimensionY: item.dimensionY ?? item.dimensionBaseY,
    dimensionZ: item.dimensionZ ?? item.dimensionBaseZ,
    scaleFactor: item.scaleFactor ?? 1.0,
    infillPercent: currentInfill,
    quality: currentQuality,
    material: currentMaterial,
    supports: currentSupports,
    count: currentCount,
  });

  const handleQualitySelect = (qualityId: string) => {
    onUpdateItem("printQuality", qualityId);
  };

  const handleCountChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(5000, newCount));
    onUpdateItem("count", clamped);
  };

  const handleMaterialChange = (mat: string) => {
    onUpdateItem("material", mat);
    const validColors = filaments
      .filter((f) => f.material.toLowerCase() === mat.toLowerCase() && f.inStock !== false)
      .map((f) => f.color);
    if (validColors.length > 0 && !validColors.includes(currentColor)) {
      onUpdateItem("color", validColors[0]);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0e1512] rounded-3xl border border-gray-200/90 dark:border-white/10 p-6 sm:p-8 space-y-7 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {t("quote.configuratorTitle")}
        </h3>

        <button
          type="button"
          onClick={onOpenFarmCatalog}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/40 hover:bg-sky-100 transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>{t("quote.configuratorFarmCatalog")}</span>
        </button>
      </div>

      {/* 02 Surface Quality Segmented Cards */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {t("quote.surfaceQualityTitle")}
        </label>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {QUALITY_OPTIONS.map((opt) => {
            const isSelected = currentQuality.toLowerCase().includes(
              opt.id.toLowerCase().split(" ")[0],
            );

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleQualitySelect(opt.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer select-none ${
                  isSelected
                    ? "border-sky-500 bg-sky-50/70 dark:bg-sky-950/30 text-gray-900 dark:text-white shadow-2xs"
                    : "border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-700 dark:text-gray-300 bg-[#fbfbfd] dark:bg-white/5"
                }`}
              >
                <div className="space-y-0.5">
                  <span className="block text-xs sm:text-sm font-bold truncate">
                    {t(opt.titleKey as any)}
                  </span>
                  <span className="block text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                    {t(opt.subtitleKey as any)}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-center">
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-sky-500 bg-sky-500 text-white"
                        : "border-gray-300 dark:border-white/20"
                    }`}
                  >
                    {isSelected && <Check size={10} strokeWidth={3} />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 03 Quantity Stepper & Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <span>{t("quote.quantityTitle")}</span>
          <span className="font-normal lowercase tracking-normal text-gray-400">
            {t("quote.quantityRangeHint")}
          </span>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Stepper Control */}
          <div className="flex items-center border border-gray-200 dark:border-white/10 rounded-2xl bg-[#fbfbfd] dark:bg-white/5 p-1 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              disabled={currentCount <= 1}
              onClick={() => handleCountChange(currentCount - 1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label={t("quote.decreaseQuantity")}
            >
              <Minus size={16} />
            </button>

            <input
              type="number"
              min="1"
              max="5000"
              value={currentCount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) handleCountChange(val);
                else if (e.target.value === "") onUpdateItem("count", 1);
              }}
              className="w-16 sm:w-20 text-center font-bold text-base text-gray-900 dark:text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            <button
              type="button"
              disabled={currentCount >= 5000}
              onClick={() => handleCountChange(currentCount + 1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label={t("quote.increaseQuantity")}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Quick Select Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {QUICK_QUANTITIES.map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => handleCountChange(qty)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  currentCount === qty
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
                    : "border-gray-200/80 dark:border-white/10 bg-[#fbfbfd] dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
              >
                {t("quote.quantityPcsChip", { count: qty })}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Print Parameters */}
      <div className="border border-gray-200/70 dark:border-white/10 rounded-2xl bg-[#fbfbfd] dark:bg-white/5 overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setParamsExpanded(!paramsExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
            <span className="text-sky-600 dark:text-sky-400 font-extrabold text-base">
              {paramsExpanded ? "−" : "+"}
            </span>
            <span>{t("quote.printParametersAccordion")}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-normal">
            <span className="hidden sm:inline">
              {t("quote.printParametersSummary")}
            </span>
            {paramsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {paramsExpanded && (
          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/10 space-y-5 animate-in fade-in duration-150">
            {/* Material Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">
                {t("quote.materialSelection")}
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_MATERIALS.map((mat) => (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => handleMaterialChange(mat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      currentMaterial === mat
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700 shadow-2xs"
                        : "bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50"
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Swatches */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">
                {t("quote.colorSelection")}:{" "}
                <span className="font-normal text-gray-800 dark:text-gray-200">
                  {translateColorText(currentColor, t)}
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {availableColors.map((clr) => {
                  const hexNumber = getFilamentHexColor(clr);
                  const hexCss = hexNumberToCss(hexNumber);
                  const isSelected = currentColor.toLowerCase() === clr.toLowerCase();

                  return (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => onUpdateItem("color", clr)}
                      title={translateColorText(clr, t)}
                      className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "border-sky-500 scale-110 shadow-xs"
                          : "border-gray-300 dark:border-white/20 hover:scale-105"
                      }`}
                      style={{ backgroundColor: hexCss }}
                      aria-label={translateColorText(clr, t)}
                    >
                      {isSelected && (
                        <Check
                          size={12}
                          className={
                            hexCss.toLowerCase() === "#ffffff" ||
                            clr.toLowerCase().includes("white")
                              ? "text-black"
                              : "text-white"
                          }
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Infill Percentage */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">
                {t("quote.infillTitle")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INFILL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateItem("infillPercent", opt.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      currentInfill === opt.value
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-400 dark:border-sky-700 shadow-2xs"
                        : "bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50"
                    }`}
                  >
                    {t(opt.key as any)}
                  </button>
                ))}
              </div>
            </div>

            {/* Supports Toggle */}
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={currentSupports}
                onChange={(e) => onUpdateItem("supportsNeeded", e.target.checked)}
                className="w-4 h-4 rounded-md accent-sky-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t("quote.supportsToggle")}
              </span>
            </label>

            {/* Notes / Special Instructions */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">
                {t("quote.specialNotes")}
              </label>
              <textarea
                rows={2}
                value={item.notes || ""}
                onChange={(e) => onUpdateItem("notes", e.target.value)}
                placeholder={t("quote.notesPlaceholder")}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-sky-500 transition-colors resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Pricing & Checkout Summary Section */}
      <div className="pt-5 border-t border-gray-100 dark:border-white/10 space-y-4">
        {/* Preliminary Cost Row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">
              <span>{t("quote.preliminaryCostTitle")}</span>
              <RefreshCw size={12} className="text-gray-400" />
            </div>

            <div className="mt-1 flex items-baseline gap-1.5">
              {calculatedPrice !== null ? (
                <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                  € {calculatedPrice.toFixed(2)}
                </span>
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-gray-400 dark:text-gray-600 tracking-tight">
                  — €
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              {hasModel
                ? t("quote.priceAfterGeometry")
                : t("quote.uploadModelForCalc")}
            </p>
          </div>

          {/* Add Another Model Button */}
          {canAddMoreModels && (
            <button
              type="button"
              onClick={onAddNewModel}
              className="px-3.5 py-2 rounded-full border border-gray-200 dark:border-white/10 hover:border-sky-400 text-gray-700 dark:text-gray-300 hover:text-sky-600 text-xs font-semibold bg-white dark:bg-white/5 transition-colors cursor-pointer shrink-0"
            >
              {t("quote.addAnotherModelBtn")}
            </button>
          )}
        </div>

        {/* Up to 8 models setup fee note */}
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          {t("quote.orderMultiModelLimit")}
        </div>

        {/* Big Primary CTA Button */}
        {hasModel ? (
          <button
            type="button"
            onClick={onProceed}
            className="w-full py-4 rounded-2xl bg-[#133827] dark:bg-emerald-600 hover:bg-[#1a4a34] dark:hover:bg-emerald-500 text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md cursor-pointer"
          >
            <span>{t("quote.ctaProceedCheckout")}</span>
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onUploadTrigger}
            className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md cursor-pointer"
          >
            <Upload size={18} />
            <span>{t("quote.ctaUploadStl")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
