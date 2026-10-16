import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import i18nPlugin from "./eslint-plugin-i18n.js";

export default defineConfig([
  globalIgnores(["dist", "node_modules", "scripts"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      i18n: i18nPlugin,
    },
    rules: {
      "i18n/no-hardcoded-jsx": "error",
      "i18n/no-hardcoded-ui-strings": "error",
    },
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
]);
