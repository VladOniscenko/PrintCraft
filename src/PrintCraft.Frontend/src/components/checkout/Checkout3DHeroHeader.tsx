import { useI18n } from "../../i18n/I18nContext";

export default function Checkout3DHeroHeader() {
  const { t } = useI18n();

  return (
    <header className="mb-8 sm:mb-10 space-y-6">
      {/* Big Bold Headline & Subtitle */}
      <div className="space-y-3">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.08]">
          <span className="block">{t("quote.heroTitlePart1")}</span>
          <span className="block">{t("quote.heroTitlePart2")}</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl font-normal leading-relaxed">
          {t("quote.heroSubtitleModern")}
        </p>
      </div>

      {/* Process Stepper Bar */}
      <div className="pt-4 border-t border-gray-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-medium">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/40 font-semibold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>{t("quote.step01Upload")}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200/60 dark:border-white/10">
            <span>{t("quote.step02Plastic")}</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200/60 dark:border-white/10">
            <span>{t("quote.step03Order")}</span>
          </div>
        </div>

        <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          {t("quote.stepNoMessaging")}
        </div>
      </div>
    </header>
  );
}

