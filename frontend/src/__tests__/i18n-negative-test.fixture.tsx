import React from "react";
import { useI18n } from "../i18n/I18nContext";
import { useNotify } from "../context/NotifyContext";

export function NegativeTestFixture() {
  const { t } = useI18n();
  const { notifySuccess } = useNotify();

  const handleAction = () => {
    // VIOLATION 1: Hardcoded UI string passed to notifySuccess
    notifySuccess("Changes saved successfully!");
  };

  return (
    <div>
      {/* VIOLATION 2: Hardcoded user-facing JSX text */}
      <h1>Welcome to our 3D Printing Store</h1>

      {/* VIOLATION 3: Hardcoded user-facing placeholder attribute */}
      <input placeholder="Enter your full name" />

      {/* VIOLATION 4: Non-existent translation key (Type error) */}
      <p>{t("dashboard.thisKeyDoesNotExistAtAll")}</p>

      <button onClick={handleAction}>Click</button>
    </div>
  );
}
