import { X, Layers, Cpu, Shield, Wrench } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";

interface FarmCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FarmCatalogModal({ isOpen, onClose }: FarmCatalogModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0e1512] rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800/40 flex items-center justify-center shrink-0">
              <Cpu size={22} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                {t("quote.farmCatalogModalTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t("quote.farmCatalogModalSubtitle")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label={t("quote.farmCatalogClose")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Printer Farm Specs */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <Wrench size={14} className="text-sky-600 dark:text-sky-400" />
            {t("quote.farmCatalogPrintersHeader")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                {t("quote.farmCatalogMaxVolume")}
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                256 × 256 × 256 mm
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                {t("quote.farmCatalogNozzleSizes")}
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                0.2 / 0.4 / 0.6 mm
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                {t("quote.farmCatalogTolerances")}
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                ±0.15 mm
              </p>
            </div>
          </div>
        </div>

        {/* Supported Filaments */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <Layers size={14} className="text-sky-600 dark:text-sky-400" />
            {t("quote.farmCatalogMaterialsHeader")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                PLA
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">PLA & PLA+</p>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("quote.farmCatalogPlaDesc")}
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold shrink-0">
                PETG
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{t("quote.farmCatalogPetgTitle")}</p>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("quote.farmCatalogPetgDesc")}
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                ABS
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">ABS / ASA</p>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("quote.farmCatalogAbsDesc")}
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
                TPU
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{t("quote.farmCatalogTpuTitle")}</p>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("quote.farmCatalogTpuDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Guarantee Notice */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 flex items-center gap-3">
          <Shield size={20} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
            {t("quote.farmCatalogQualityNotice")}
          </p>
        </div>

        {/* Close CTA */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-xs"
          >
            {t("quote.farmCatalogClose")}
          </button>
        </div>
      </div>
    </div>
  );
}
