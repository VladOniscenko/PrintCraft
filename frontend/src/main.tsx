import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { I18nProvider } from "./i18n/I18nContext.tsx";
import { NotifyProvider } from "./context/NotifyContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <NotifyProvider>
          <App />
        </NotifyProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
);
