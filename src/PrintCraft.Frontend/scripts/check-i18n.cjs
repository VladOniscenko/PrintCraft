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
    return { all: {}, files: [], exists: false };
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const all = {};
  for (const f of files) {
    const ns = f.replace(".json", "");
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      if (ns === "root") {
        Object.assign(all, data);
      } else {
        all[ns] = data;
      }
    } catch (err) {
      console.error(`Error parsing JSON in ${path.join(dir, f)}:`, err.message);
    }
  }
  return { all, files, exists: true };
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

function checkCodeUsages(enKeys, localeMaps) {
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
        for (const [lang, map] of Object.entries(localeMaps)) {
          if (!map.has(key)) {
            errors.push({
              file: relPath,
              line: lineIdx + 1,
              key,
              message: `Key "${key}" used in code is missing from locale '${lang}'`,
            });
          }
        }
      }
    }
  }

  return errors;
}

function main() {
  console.log("🔍 Validating modular translation JSON files and key usage...");

  const { all: enTranslations, files: enFiles, exists: enExists } = loadLocale("en");
  if (!enExists) {
    console.error("Canonical locale 'en' directory is missing!");
    process.exit(1);
  }

  const enFileSet = new Set(enFiles);
  const enMap = flattenKeys(enTranslations);

  const targetLocales = ["nl", "tr", "ru", "ar"];
  const targetMaps = {};
  const errors = [];

  for (const lang of targetLocales) {
    const { all: langTranslations, files: langFiles, exists } = loadLocale(lang);
    if (!exists) {
      errors.push({
        type: "MISSING_LOCALE_DIR",
        locale: lang,
        message: `Locale directory 'src/locales/${lang}' is missing`,
      });
      continue;
    }

    const langFileSet = new Set(langFiles);
    const langMap = flattenKeys(langTranslations);
    targetMaps[lang] = langMap;

    // 1. File parity between locales
    for (const f of enFileSet) {
      if (!langFileSet.has(f)) {
        errors.push({
          type: "MISSING_LOCALE_FILE",
          locale: lang,
          message: `Locale '${lang}' is missing file '${f}' present in canonical 'en'`,
        });
      }
    }
    for (const f of langFileSet) {
      if (!enFileSet.has(f)) {
        errors.push({
          type: "EXTRA_LOCALE_FILE",
          locale: lang,
          message: `Locale '${lang}' has unexpected file '${f}' not present in canonical 'en'`,
        });
      }
    }

    // 2. Missing keys in target locale compared to canonical EN
    for (const [key, val] of enMap) {
      if (!langMap.has(key)) {
        errors.push({
          type: "MISSING_IN_LOCALE",
          locale: lang,
          key,
          message: `Missing key in '${lang}': "${key}"`,
        });
      } else {
        const targetVal = langMap.get(key);
        if (typeof targetVal !== "string" || targetVal.trim() === "") {
          errors.push({
            type: "EMPTY_TRANSLATION",
            locale: lang,
            key,
            message: `Empty translation for key in '${lang}': "${key}"`,
          });
        }
      }
    }

    // 3. Extraneous keys in target locale not in canonical EN
    for (const [key] of langMap) {
      if (!enMap.has(key)) {
        errors.push({
          type: "EXTRA_IN_LOCALE",
          locale: lang,
          key,
          message: `Unknown key in '${lang}' not present in canonical 'en': "${key}"`,
        });
      }
    }
  }

  // 4. Keys referenced in codebase vs translations
  const codeErrors = checkCodeUsages(enMap, targetMaps);
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
  ${targetLocales.map((l) => `- Target (${l}) files:    ${targetMaps[l] ? targetLocales.length : 0}, keys: ${targetMaps[l]?.size || 0}`).join("\n  ")}
  - Total issues found:   ${errors.length}
`);

  if (errors.length > 0) {
    console.error("❌ Internationalization validation failed:\n");
    for (const err of errors.slice(0, 50)) {
      console.error(`  • [${err.type}] [${err.locale || ""}] ${err.message}`);
    }
    if (errors.length > 50) {
      console.error(`  ... and ${errors.length - 50} more errors.`);
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
