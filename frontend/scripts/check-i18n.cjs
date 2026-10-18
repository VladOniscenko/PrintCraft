const fs = require("fs");
const path = require("path");

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

function loadLocale(lang) {
  const dir = path.join(process.cwd(), "src", "locales", lang);
  if (!fs.existsSync(dir)) {
    throw new Error(`Locale directory missing: ${dir}`);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const all = {};
  for (const f of files) {
    const ns = f.replace(".json", "");
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    if (ns === "root") {
      Object.assign(all, data);
    } else {
      all[ns] = data;
    }
  }
  return { all, files };
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
        entry.name !== "scratch" &&
        entry.name !== "locales"
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
      filePath.includes("I18nContext.tsx") ||
      filePath.includes("schema.ts") ||
      filePath.includes("loader.ts")
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
  console.log("🔍 Validating modular translation JSON files and key usage...");

  const { all: enTranslations, files: enFiles } = loadLocale("en");
  const { all: nlTranslations, files: nlFiles } = loadLocale("nl");

  const errors = [];

  // 1. File parity between locales
  const enFileSet = new Set(enFiles);
  const nlFileSet = new Set(nlFiles);

  for (const f of enFileSet) {
    if (!nlFileSet.has(f)) {
      errors.push({
        type: "MISSING_LOCALE_FILE",
        locale: "nl",
        message: `Locale 'nl' is missing file '${f}' present in canonical 'en'`,
      });
    }
  }
  for (const f of nlFileSet) {
    if (!enFileSet.has(f)) {
      errors.push({
        type: "EXTRA_LOCALE_FILE",
        locale: "nl",
        message: `Locale 'nl' has unexpected file '${f}' not present in canonical 'en'`,
      });
    }
  }

  const enMap = flattenKeys(enTranslations);
  const nlMap = flattenKeys(nlTranslations);

  // 2. Missing keys in NL compared to canonical EN
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

  // 3. Extraneous keys in NL not in canonical EN
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

  // 4. Keys referenced in codebase vs translations
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
  - Canonical (en) files: ${enFiles.length}
  - Canonical (en) keys:  ${enMap.size}
  - Target (nl) files:    ${nlFiles.length}
  - Target (nl) keys:     ${nlMap.size}
  - Total issues found:   ${errors.length}
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
    "✅ All modular translation files and keys are synchronized and verified across locales!",
  );
  process.exit(0);
}

main();
