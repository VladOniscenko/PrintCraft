import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "./i18n/I18nContext";
import Home from "./components/Home";
import FAQ from "./components/FAQ";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import RefundPolicy from "./components/RefundPolicy";
import ShippingPolicy from "./components/ShippingPolicy";

export function renderPage(url: string): string {
  let Component = Home;
  if (url.includes("/faq")) {
    Component = FAQ;
  } else if (url.includes("/privacy")) {
    Component = PrivacyPolicy;
  } else if (url.includes("/terms")) {
    Component = TermsOfService;
  } else if (url.includes("/refunds")) {
    Component = RefundPolicy;
  } else if (url.includes("/shipping-policy")) {
    Component = ShippingPolicy;
  }

  return renderToString(
    <MemoryRouter initialEntries={[url]}>
      <I18nProvider>
        <Component />
      </I18nProvider>
    </MemoryRouter>,
  );
}

