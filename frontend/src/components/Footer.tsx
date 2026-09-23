import { Mail, Phone, MapPin, Clock3 } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { Link } from "react-router-dom";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="site-footer mt-auto">
      <div className="px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <h4 className="text-sm font-black tracking-wide text-[#18251f] uppercase mb-3">
            {t("footer.companyName")}
          </h4>
          <p className="text-sm text-[#5f6f69] leading-relaxed">
            {t("footer.tagline")}
          </p>
        </div>

        <div className="text-sm text-[#445853] space-y-2">
          <p className="font-semibold text-[#1b2c26] mb-1">
            {t("footer.contact")}
          </p>
          <a
            href="mailto:info@printcraft.nl"
            className="flex items-center gap-2 hover:text-[#0f766e]"
          >
            <Mail size={16} /> info@printcraft.nl
          </a>
          <a
            href="tel:+31101234567"
            className="flex items-center gap-2 hover:text-[#0f766e]"
          >
            <Phone size={16} /> +31 10 123 4567
          </a>
        </div>

        <div className="text-sm text-[#445853] space-y-2">
          <p className="font-semibold text-[#1b2c26] mb-1">
            {t("footer.location")}
          </p>
          <p className="flex items-center gap-2">
            <MapPin size={16} /> {t("footer.locationValue")}
          </p>
        </div>

        <div className="text-sm text-[#445853] space-y-2">
          <p className="font-semibold text-[#1b2c26] mb-1">
            {t("footer.hours")}
          </p>
          <p className="flex items-center gap-2">
            <Clock3 size={16} /> {t("footer.hoursValue")}
          </p>
        </div>
      </div>

      <div className="border-t border-[#dde9e4]">
        <div className="px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#637670]">
          <Link to="/privacy" className="hover:text-[#0f766e]">
            {t("footer.privacy")}
          </Link>
          <Link to="/terms" className="hover:text-[#0f766e]">
            {t("footer.terms")}
          </Link>
          <Link to="/refunds" className="hover:text-[#0f766e]">
            {t("footer.refunds")}
          </Link>
          <Link to="/shipping-policy" className="hover:text-[#0f766e]">
            {t("footer.shippingPolicy")}
          </Link>
          <Link to="/faq" className="hover:text-[#0f766e]">
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
