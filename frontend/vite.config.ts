import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { businessInfo } from "./src/config/businessInfo";
import {
  translations,
  supportedLanguages,
  defaultLanguage,
} from "./src/i18n/translations";
import {
  buildHomepageJsonLd,
  getValidatedOrigin,
} from "./src/utils/seoStructuredData";
import { dutchCities } from "./src/config/dutchCities";
import { seoApplications } from "./src/config/seoApplications";

const origin = getValidatedOrigin(businessInfo.website);
const today = new Date().toISOString().split("T")[0];

const publicIndexableRoutes = [
  { subPath: "", priority: "1.0", changefreq: "weekly" },
  { subPath: "/faq", priority: "0.8", changefreq: "monthly" },
  { subPath: "/privacy", priority: "0.5", changefreq: "yearly" },
  { subPath: "/terms", priority: "0.5", changefreq: "yearly" },
  { subPath: "/refunds", priority: "0.5", changefreq: "yearly" },
  { subPath: "/shipping-policy", priority: "0.5", changefreq: "monthly" },
  ...dutchCities.map((city) => ({
    subPath: `/3d-print-service/${city.slug}`,
    priority: "0.8",
    changefreq: "monthly",
  })),
  ...seoApplications.map((app) => ({
    subPath: `/oplossingen/${app.slug}`,
    priority: "0.85",
    changefreq: "weekly",
  })),
];

const crawlerFiles = {
  "/robots.txt": {
    contentType: "text/plain",
    source: `User-agent: *
Allow: /
Disallow: /admin
Disallow: /orders
Disallow: /profile
Disallow: /checkout/success
Disallow: /reset-password
Disallow: /*/admin
Disallow: /*/orders
Disallow: /*/profile
Disallow: /*/checkout/success
Disallow: /*/reset-password
Disallow: /api/

Sitemap: ${origin}/sitemap.xml
`,
  },
  "/sitemap.xml": {
    contentType: "application/xml",
    source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${publicIndexableRoutes
  .map((r) =>
    supportedLanguages
      .map(
        (lang) => `  <url>
    <loc>${origin}/${lang}${r.subPath}</loc>
${supportedLanguages
  .map(
    (sLang) =>
      `    <xhtml:link rel="alternate" hreflang="${sLang}" href="${origin}/${sLang}${r.subPath}" />`,
  )
  .join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/${defaultLanguage}${r.subPath}" />
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${lang === defaultLanguage ? r.priority : (Number(r.priority) * 0.9).toFixed(1)}</priority>
  </url>`,
      )
      .join("\n"),
  )
  .join("\n")}
</urlset>
`,
  },
};

export default defineConfig(({ mode }) => {
  const frontendEnv = loadEnv(mode, process.cwd(), "");
  const rootEnv = loadEnv(mode, path.resolve(process.cwd(), ".."), "");
  const devApiOrigin =
    frontendEnv.VITE_DEV_API_ORIGIN || rootEnv.VITE_DEV_API_ORIGIN;

  if (mode !== "production" && !devApiOrigin) {
    throw new Error("VITE_DEV_API_ORIGIN must be set in frontend env file.");
  }

  const server = {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    ...(devApiOrigin
      ? {
          proxy: {
            "/api": {
              target: devApiOrigin,
              changeOrigin: true,
              secure: false,
            },
            "/uploads": {
              target: devApiOrigin,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : {}),
  };

  const homepageJsonLdString = JSON.stringify(
    buildHomepageJsonLd(
      `${origin}/nl`,
      translations.nl.seo.home.title,
      translations.nl.seo.home.description,
      "nl",
    ),
    null,
    2,
  );

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "business-metadata",
        transformIndexHtml(html) {
          const values: Record<string, string> = {
            __BUSINESS_NAME__: businessInfo.name,
            __BUSINESS_HOME_URL__: `${origin}/nl`,
            __BUSINESS_ALTERNATE_NL__: `${origin}/nl`,
            __BUSINESS_ALTERNATE_EN__: `${origin}/en`,
            __BUSINESS_ALTERNATE_DEFAULT__: `${origin}/nl`,
            __BUSINESS_OG_IMAGE__: `${origin}/uploads/hero/materials.svg`,
            __BUSINESS_HOMEPAGE_JSONLD__: homepageJsonLdString,
          };
          for (const [token, value] of Object.entries(values)) {
            html = html.replaceAll(token, value);
          }
          return html;
        },
        configureServer(devServer) {
          devServer.middlewares.use((request, response, next) => {
            const file =
              crawlerFiles[
                request.url?.split("?")[0] as keyof typeof crawlerFiles
              ];
            if (!file) return next();
            response.setHeader(
              "Content-Type",
              `${file.contentType}; charset=utf-8`,
            );
            response.end(file.source);
          });
        },
        generateBundle() {
          for (const [url, file] of Object.entries(crawlerFiles)) {
            this.emitFile({
              type: "asset",
              fileName: url.slice(1),
              source: file.source,
            });
          }
        },
        async closeBundle() {
          if (mode !== "production") return;

          console.log("\n🚀 Starting build-time SSG prerendering...");
          const distDir = path.resolve(process.cwd(), "dist");
          const templatePath = path.join(distDir, "index.html");
          if (!fs.existsSync(templatePath)) {
            console.warn("Template index.html not found, skipping prerender.");
            return;
          }

          const baseTemplate = await fs.promises.readFile(
            templatePath,
            "utf-8",
          );

          // 1. Build temporary SSR bundle
          const { build } = await import("vite");
          await build({
            build: {
              ssr: "src/entry-server.tsx",
              outDir: "dist/.ssr",
              emptyOutDir: true,
            },
            configFile: false,
          });

          // 2. Import entry-server
          const ssrEntryPath = path.resolve(distDir, ".ssr/entry-server.js");
          const { renderPage } = await import(`file://${ssrEntryPath}`);

          const languages = supportedLanguages;

          const formatHtml = (
            template: string,
            renderResult: { html: string; headTags: string; langAttr: string },
            isRoot: boolean,
          ) => {
            let pageHtml = template;
            pageHtml = pageHtml.replace(
              /<html\s+lang="[^"]*"/,
              `<html lang="${renderResult.langAttr}"`,
            );

            const headStart = "<!--seo-meta-start-->";
            const headEnd = "<!--seo-meta-end-->";
            if (pageHtml.includes(headStart) && pageHtml.includes(headEnd)) {
              const beforeHead = pageHtml.split(headStart)[0];
              const afterHead = pageHtml.split(headEnd)[1];
              pageHtml = `${beforeHead}${headStart}\n    ${renderResult.headTags}\n    ${headEnd}${afterHead}`;
            }

            pageHtml = pageHtml.replace("<!--app-html-->", renderResult.html);

            if (!isRoot) {
              const redirStart = "<!--root-redirect-start-->";
              const redirEnd = "<!--root-redirect-end-->";
              if (
                pageHtml.includes(redirStart) &&
                pageHtml.includes(redirEnd)
              ) {
                const beforeRedir = pageHtml.split(redirStart)[0];
                const afterRedir = pageHtml.split(redirEnd)[1];
                pageHtml = `${beforeRedir}${afterRedir}`;
              }
            }

            return pageHtml;
          };

          // 3. Render all localized public routes
          for (const route of publicIndexableRoutes) {
            for (const lang of languages) {
              const url = `/${lang}${route.subPath}`;
              const res = renderPage(url);
              const renderedHtml = formatHtml(baseTemplate, res, false);
              const outputDir = path.join(distDir, lang, route.subPath);
              await fs.promises.mkdir(outputDir, { recursive: true });
              await fs.promises.writeFile(
                path.join(outputDir, "index.html"),
                renderedHtml,
                "utf-8",
              );
              console.log(
                `  ✓ Pre-rendered: ${url} -> dist/${lang}${route.subPath}/index.html`,
              );
            }
          }

          // 4. Render root / (default language + returning user redirect)
          const rootRes = renderPage(`/${defaultLanguage}`);
          const rootHtml = formatHtml(baseTemplate, rootRes, true);
          await fs.promises.writeFile(templatePath, rootHtml, "utf-8");
          console.log("  ✓ Pre-rendered: / -> dist/index.html");

          // 5. Clean up temporary SSR bundle
          await fs.promises.rm(path.join(distDir, ".ssr"), {
            recursive: true,
            force: true,
          });
          console.log("✨ SSG prerendering completed successfully!\n");
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/three")) return "three-vendor";
            if (
              id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom")
            ) {
              return "react-vendor";
            }
            if (id.includes("node_modules/react-router-dom"))
              return "router-vendor";
            if (id.includes("node_modules/lucide-react")) return "icons-vendor";
            if (id.includes("node_modules/@dnd-kit")) return "dnd-kit-vendor";
            if (id.includes("node_modules/axios")) return "network-vendor";
          },
        },
      },
    },
    server,
  };
});
