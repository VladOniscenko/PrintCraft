# Agent Guidelines: Internationalization (i18n) & UI Text Enforcement

This repository strictly enforces localization and type-safe internationalization across all frontend code. Any newly introduced hardcoded user-facing string or broken translation key will fail automated checks and block builds.

---

## 1. Mandatory Rules for AI Agents and Developers

1. **Never Introduce Hardcoded User-Facing Text**
   - All text shown to users—including JSX children, button labels, headings, body text, form labels, input placeholders, tooltips, dialogs, empty states, and accessibility attributes (`aria-label`, `aria-placeholder`, `aria-description`, `alt`, `title`)—must be localized.
   - String literals passed to UI APIs outside JSX (`notifySuccess`, `notifyError`, `notifyInfo`, `toast()`, `setError()`, `window.alert()`, `window.confirm()`, `window.prompt()`, and `document.title`) must be localized.

2. **Always Use the Established Translation System**
   - Import `useI18n` from `src/i18n/I18nContext`:
     ```tsx
     import { useI18n } from "../i18n/I18nContext";

     const { t } = useI18n();
     ```
   - Use `t("namespace.key")` for static copy or `t("namespace.key", { varName: value })` for interpolated values.
   - Never concatenate translated fragments to construct sentences. Use interpolation variables in `translations.ts` instead.
   - Never use English `defaultValue` fallbacks (e.g. `t("key") || "Default"`). Translation keys must exist directly in the resource files.

3. **Add New Keys to Both Supported Locales (`en` and `nl`)**
   - All translations live in `frontend/src/i18n/translations.ts`.
   - Every key added to `translations.en` **must** also be added to `translations.nl` with an accurate, natural Dutch translation.
   - Never copy raw English strings into `nl` claiming it is translated.
   - Translation keys are strongly typed (`TranslationKey = Leaves<typeof translations.en>`). Any key that does not exist in the canonical `en` object will trigger a TypeScript compile error (`tsc -b`).

4. **Never Suppress i18n Checks**
   - Never use `// eslint-disable-next-line i18n/...` or similar comments to bypass translation errors.
   - Never use `as any` or unsafe type assertions to bypass missing translation key type errors.
   - Fix the root cause by adding the missing translation keys to `frontend/src/i18n/translations.ts`.

5. **Distinguish User-Facing Text from Technical Strings**
   - **User-Facing Copy (MUST localize)**: Buttons, titles, headers, badge labels, form placeholders, error/success toasts, validation messages, confirm prompts, modal body text, accessible labels (`aria-label`, `alt`).
   - **Technical Strings (Do NOT localize)**: API routes (`/api/orders`), HTTP methods (`POST`), CSS classes, object property keys, database fields, enum values, unit abbreviations (`mm`, `cm`, `g`, `kg`, `px`), file extensions (`.stl`, `.3mf`, `.obj`), and machine-readable identifiers.

---

## 2. Validation & Verification Workflow

Before concluding any change or opening a PR, you **must** run the automated verification command:

```bash
cd frontend
npm run check:i18n
```

This single command runs three required stages in sequence:
1. `npm run check:i18n:keys`: Recursively validates that all keys in `en` and `nl` match 1:1 and scans all `src/` files for invalid key calls.
2. `tsc -b`: Type-checks all translation keys via TypeScript leaf inference (`TranslationKey`).
3. `npm run lint:i18n`: Runs custom AST ESLint rules (`i18n/no-hardcoded-jsx` and `i18n/no-hardcoded-ui-strings`) to ensure 0 hardcoded strings exist in JSX or UI notification APIs.

If any check fails, resolve the missing keys or unlocalized text before completing your task.

