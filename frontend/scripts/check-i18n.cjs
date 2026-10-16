const fs = require("fs");
const path = require("path");
const createJiti = require("jiti");

const jiti = createJiti(path.join(process.cwd(), "index.js"));
const { translations } = jiti("./src/i18n/translations.ts");

function flattenKeys(obj, prefix = "") {
  const keys = new Map();
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const childKeys = flattenKeys(value, fullPath);
      for (const [k, v] of childKeys) {
        keys.set(k, v);
      }
    } else {
      keys.set(fullPath, value);
    }
  }
  return keys;
}

function getSourceFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        entry.name !== "scratch"
      ) {
        results.push(...getSourceFiles(full));
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))
    ) {
      if (!entry.name.endsWith(".d.ts")) {
        results.push(full);
      }
    }
  }
  return results;
}

function checkCodeUsages(enKeys, nlKeys) {
  const files = getSourceFiles(path.join(process.cwd(), "src"));
  const errors = [];
  const tRegex = /\bt\(\s*["']([^"']+)["']/g;

  for (const filePath of files) {
    if (
      filePath.includes("translations.ts") ||
      filePath.includes("I18nContext.tsx")
    ) {
      continue;
    }
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      let match;
      while ((match = tRegex.exec(line)) !== null) {
        const key = match[1];
        const relPath = path.relative(process.cwd(), filePath);

        if (!enKeys.has(key)) {
          errors.push({
            file: relPath,
            line: lineIdx + 1,
            key,
            message: `Key "${key}" used in code is missing from canonical locale 'en'`,
          });
        }
        if (!nlKeys.has(key)) {
          errors.push({
            file: relPath,
            line: lineIdx + 1,
            key,
            message: `Key "${key}" used in code is missing from locale 'nl'`,
          });
        }
      }
    }
  }

  return errors;
}

function main() {
  console.log("🔍 Validating translation resources and key usage...");

  const enMap = flattenKeys(translations.en);
  const nlMap = flattenKeys(translations.nl);

  const errors = [];

  // 1. Missing keys in NL compared to canonical EN
  for (const [key, val] of enMap) {
    if (!nlMap.has(key)) {
      errors.push({
        type: "MISSING_IN_LOCALE",
        locale: "nl",
        key,
        message: `Missing key in 'nl': "${key}"`,
      });
    } else {
      const nlVal = nlMap.get(key);
      if (typeof nlVal !== "string" || nlVal.trim() === "") {
        errors.push({
          type: "EMPTY_TRANSLATION",
          locale: "nl",
          key,
          message: `Empty translation for key in 'nl': "${key}"`,
        });
      }
    }
  }

  // 2. Extraneous keys in NL not in canonical EN
  for (const [key] of nlMap) {
    if (!enMap.has(key)) {
      errors.push({
        type: "EXTRA_IN_LOCALE",
        locale: "nl",
        key,
        message: `Unknown key in 'nl' not present in canonical 'en': "${key}"`,
      });
    }
  }

  // 3. Keys referenced in codebase vs translations
  const codeErrors = checkCodeUsages(enMap, nlMap);
  for (const err of codeErrors) {
    errors.push({
      type: "MISSING_FROM_TRANSLATIONS",
      file: `${err.file}:${err.line}`,
      key: err.key,
      message: `${err.file}:${err.line} -> ${err.message}`,
    });
  }

  console.log(`📊 Statistics:
  - Canonical (en) keys: ${enMap.size}
  - Target (nl) keys:    ${nlMap.size}
  - Total issues found:  ${errors.length}
`);

  if (errors.length > 0) {
    console.error("❌ Internationalization validation failed:\n");
    for (const err of errors) {
      console.error(`  • [${err.type}] ${err.message}`);
    }
    console.error(
      `\nFound ${errors.length} translation errors. Please resolve before proceeding.`,
    );
    process.exit(1);
  }

  console.log(
    "✅ All translation keys are synchronized and verified across locales!",
  );
  process.exit(0);
}

main();
