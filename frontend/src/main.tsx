import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { I18nProvider, getInitialLanguage } from "./i18n/I18nContext.tsx";
import { NotifyProvider } from "./context/NotifyContext.tsx";
import { loadLanguage } from "./i18n/loader.ts";

async function bootstrap() {
  const initialLang = getInitialLanguage();
  await loadLanguage(initialLang);

  const container = document.getElementById("root");
  if (!container) return;

  createRoot(container).render(
    <StrictMode>
      <BrowserRouter>
        <I18nProvider initialLanguage={initialLang}>
          <NotifyProvider>
            <App />
          </NotifyProvider>
        </I18nProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}

void bootstrap();
