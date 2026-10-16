import { Phone, MapPin, Clock3, ArrowRight, ExternalLink } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { Link } from "react-router-dom";
import { businessInfo } from "../config/businessInfo";
import { seoApplications, getApplicationName } from "../config/seoApplications";
import { dutchCities, getCityName } from "../config/dutchCities";

export default function Footer() {
  const { t, language, localizePath } = useI18n();
  const featuredCities = dutchCities.slice(0, 17);

  return (
    <footer className="site-footer mt-auto">
      <div className="px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="space-y-3">
          <p className="text-sm font-black tracking-wide text-[#18251f] uppercase">
            {t("footer.companyName")}
          </p>
          <p className="text-sm text-[#5f6f69] leading-relaxed max-w-sm">
            {t("footer.tagline")}
          </p>
        </div>

        <div className="text-sm text-[#445853] space-y-2">
          <p className="font-semibold text-[#1b2c26] mb-2">
            {t("footer.solutions")}
          </p>
          <ul className="space-y-2">
            {seoApplications.map((app) => (
              <li key={app.slug}>
                <Link
                  to={localizePath(`/oplossingen/${app.slug}`)}
                  className="hover:text-[#0f766e] transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowRight size={12} className="text-emerald-600 shrink-0" />
                  <span>{getApplicationName(app, language)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-sm text-[#445853] space-y-2">
          <p className="font-semibold text-[#1b2c26] mb-2">
            {t("footer.standardsTitle")}
          </p>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://www.postnl.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0f766e] transition-colors inline-flex items-center gap-1.5"
              >
                <ExternalLink size={12} className="text-emerald-600 shrink-0" />
                <span>{t("footer.postnl")}</span>
              </a>
            </li>
            <li>
              <a
                href="https://3mf.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0f766e] transition-colors inline-flex items-center gap-1.5"
              >
                <ExternalLink size={12} className="text-emerald-600 shrink-0" />
                <span>{t("footer.consortium3mf")}</span>
              </a>
            </li>
            <li>
              <a
                href="https://makerworld.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0f766e] transition-colors inline-flex items-center gap-1.5"
              >
                <ExternalLink size={12} className="text-emerald-600 shrink-0" />
                <span>{t("footer.makerworld")}</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.thingiverse.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#0f766e] transition-colors inline-flex items-center gap-1.5"
              >
                <ExternalLink size={12} className="text-emerald-600 shrink-0" />
                <span>{t("footer.thingiverse")}</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="text-sm text-[#445853] space-y-2">
          <p className="font-semibold text-[#1b2c26] mb-1">
            {t("footer.contact")}
          </p>
          <div
            dangerouslySetInnerHTML={{
              __html: `<!--email_off--><a href="mailto:${businessInfo.email}" class="flex items-center gap-2 hover:text-[#0f766e]"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg><span>${businessInfo.email}</span></a><!--/email_off-->`,
            }}
          />
          {businessInfo.phone && (
            <a
              href={businessInfo.phoneHref}
              className="flex items-center gap-2 hover:text-[#0f766e]"
            >
              <Phone size={16} />
              <span>{businessInfo.phone}</span>
            </a>
          )}
        </div>

        <div className="text-sm text-[#445853] space-y-3">
          <div>
            <p className="font-semibold text-[#1b2c26] mb-1">
              {t("footer.location")}
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={16} />
              <span>{t("footer.locationValue")}</span>
            </p>
          </div>
          <div>
            <p className="font-semibold text-[#1b2c26] mb-1">
              {t("footer.hours")}
            </p>
            <p className="flex items-center gap-2">
              <Clock3 size={16} />
              <span>{t("footer.hoursValue")}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Top Cities Section */}
      <div className="border-t border-[#dde9e4] px-6 py-6 bg-[#f7faf8]">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1b2c26] mb-3">
          {t("footer.citiesTitle")}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#526861]">
          {featuredCities.map((city) => (
            <Link
              key={city.slug}
              to={localizePath(`/3d-print-service/${city.slug}`)}
              className="hover:text-[#0f766e] transition-colors"
            >
              {t("footer.cityServiceLink", {
                city: getCityName(city, language),
              })}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-[#dde9e4]">
        <div className="px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#637670]">
          <Link to={localizePath("/privacy")} className="hover:text-[#0f766e]">
            {t("footer.privacy")}
          </Link>
          <Link to={localizePath("/terms")} className="hover:text-[#0f766e]">
            {t("footer.terms")}
          </Link>
          <Link to={localizePath("/refunds")} className="hover:text-[#0f766e]">
            {t("footer.refunds")}
          </Link>
          <Link
            to={localizePath("/shipping-policy")}
            className="hover:text-[#0f766e]"
          >
            {t("footer.shippingPolicy")}
          </Link>
          <Link to={localizePath("/faq")} className="hover:text-[#0f766e]">
            {t("footer.faq")}
          </Link>
        </div>
      </div>

      <div className="border-t border-[#dde9e4] py-5 px-6 text-center">
        <p className="text-xs text-[#7b8f88]">{t("footer.copyright")}</p>
      </div>
    </footer>
  );
}
