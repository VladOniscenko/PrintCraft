import { useState } from "react";
import { Phone, MapPin, Clock3, ExternalLink, AlertTriangle } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { Link } from "react-router-dom";
import { businessInfo } from "../config/businessInfo";
import { seoApplications, getApplicationName } from "../config/seoApplications";
import { dutchCities, getCityName } from "../config/dutchCities";
import ReportIssueModal from "./support/ReportIssueModal";

export default function Footer() {
  const { t, language, localizePath } = useI18n();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const featuredCities = dutchCities.slice(0, 17);

  return (
    <footer className="site-footer mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white uppercase">
              {t("footer.companyName")}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm">
              {t("footer.tagline")}
            </p>
            <div className="pt-2 space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
                <span>{t("footer.locationValue")}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock3 size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
                <span>{t("footer.hoursValue")}</span>
              </p>
            </div>
          </div>

          {/* Solutions / Applications */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              {t("footer.solutions")}
            </p>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {seoApplications.map((app) => (
                <li key={app.slug}>
                  <Link
                    to={localizePath(`/faq/${app.slug}`)}
                    className="hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center py-1 min-h-[32px]"
                  >
                    {getApplicationName(app, language)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Standards & Logistics */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              {t("footer.standardsTitle")}
            </p>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href="https://www.postnl.nl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5 py-1 min-h-[32px]"
                >
                  <span>{t("footer.postnl")}</span>
                  <ExternalLink size={11} className="text-gray-500 dark:text-gray-400 shrink-0" />
                </a>
              </li>
              <li>
                <a
                  href="https://3mf.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5 py-1 min-h-[32px]"
                >
                  <span>{t("footer.consortium3mf")}</span>
                  <ExternalLink size={11} className="text-gray-500 dark:text-gray-400 shrink-0" />
                </a>
              </li>
              <li>
                <a
                  href="https://makerworld.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5 py-1 min-h-[32px]"
                >
                  <span>{t("footer.makerworld")}</span>
                  <ExternalLink size={11} className="text-gray-500 dark:text-gray-400 shrink-0" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.thingiverse.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5 py-1 min-h-[32px]"
                >
                  <span>{t("footer.thingiverse")}</span>
                  <ExternalLink size={11} className="text-gray-500 dark:text-gray-400 shrink-0" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              {t("footer.contact")}
            </p>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div
                dangerouslySetInnerHTML={{
                  __html: `<!--email_off--><a href="mailto:${businessInfo.email}" class="inline-flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors py-1 min-h-[32px]"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail text-gray-500 dark:text-gray-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg><span>${businessInfo.email}</span></a><!--/email_off-->`,
                }}
              />
              {businessInfo.phone && (
                <div>
                  <a
                    href={businessInfo.phoneHref}
                    className="inline-flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors py-1 min-h-[32px]"
                  >
                    <Phone size={14} className="text-gray-500 dark:text-gray-400" />
                    <span>{businessInfo.phone}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Directory of Dutch Cities (Apple Store-Finder Style) */}
        <div className="mt-12 pt-8 border-t border-gray-200/80 dark:border-white/10">
          <p className="text-[11px] font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
            {t("footer.citiesTitle")}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            {featuredCities.map((city, idx) => (
              <span key={city.slug} className="inline-flex items-center gap-2">
                <Link
                  to={localizePath(`/3d-print-service/${city.slug}`)}
                  className="hover:text-gray-900 dark:hover:text-white transition-colors py-1 px-1 min-h-[32px] inline-flex items-center"
                >
                  {getCityName(city, language)}
                </Link>
                {idx < featuredCities.length - 1 && (
                  <span className="text-gray-300 dark:text-gray-600 select-none">•</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Legal & Copyright Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600 dark:text-gray-400">
          <p>{t("footer.copyright")}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link to={localizePath("/privacy")} className="hover:text-gray-900 dark:hover:text-white transition-colors py-2 px-1 min-h-[44px] inline-flex items-center">
              {t("footer.privacy")}
            </Link>
            <span className="text-gray-300 dark:text-gray-600 select-none">•</span>
            <Link to={localizePath("/terms")} className="hover:text-gray-900 dark:hover:text-white transition-colors py-2 px-1 min-h-[44px] inline-flex items-center">
              {t("footer.terms")}
            </Link>
            <span className="text-gray-300 dark:text-gray-600 select-none">•</span>
            <Link to={localizePath("/refunds")} className="hover:text-gray-900 dark:hover:text-white transition-colors py-2 px-1 min-h-[44px] inline-flex items-center">
              {t("footer.refunds")}
            </Link>
            <span className="text-gray-300 dark:text-gray-600 select-none">•</span>
            <Link
              to={localizePath("/shipping-policy")}
              className="hover:text-gray-900 dark:hover:text-white transition-colors py-2 px-1 min-h-[44px] inline-flex items-center"
            >
              {t("footer.shippingPolicy")}
            </Link>
            <span className="text-gray-300 dark:text-gray-600 select-none">•</span>
            <Link to={localizePath("/faq")} className="hover:text-gray-900 dark:hover:text-white transition-colors py-2 px-1 min-h-[44px] inline-flex items-center">
              {t("footer.faq")}
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Issue Report Button */}
      <button
        type="button"
        onClick={() => setIsReportModalOpen(true)}
        aria-label={t("common.support.floatingButtonLabel")}
        title={t("common.support.floatingButtonLabel")}
        className="fixed bottom-6 right-6 z-40 group flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none shadow-md backdrop-blur-xs">
          {t("common.support.floatingButtonLabel")}
        </span>
      </button>

      {isReportModalOpen && (
        <ReportIssueModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </footer>
  );
}
