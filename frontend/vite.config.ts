import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { businessInfo } from "./src/config/businessInfo";
import {
  buildHomepageJsonLd,
  getValidatedOrigin,
} from "./src/utils/seoStructuredData";

const origin = getValidatedOrigin(businessInfo.website);
const today = new Date().toISOString().split("T")[0];

const publicIndexableRoutes = [
  { subPath: "", priority: "1.0", changefreq: "weekly" },
  { subPath: "/faq", priority: "0.8", changefreq: "monthly" },
  { subPath: "/privacy", priority: "0.5", changefreq: "yearly" },
  { subPath: "/terms", priority: "0.5", changefreq: "yearly" },
  { subPath: "/refunds", priority: "0.5", changefreq: "yearly" },
  { subPath: "/shipping-policy", priority: "0.5", changefreq: "monthly" },
];

const crawlerFiles = {
  "/robots.txt": {
    contentType: "text/plain",
    source: `User-agent: *
Allow: /
Disallow: /admin
Disallow: /orders
Disallow: /profile
Disallow: /reset-password
Disallow: /*/admin
Disallow: /*/orders
Disallow: /*/profile
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
  .map(
    (r) => `  <url>
    <loc>${origin}/nl${r.subPath}</loc>
    <xhtml:link rel="alternate" hreflang="nl" href="${origin}/nl${r.subPath}" />
    <xhtml:link rel="alternate" hreflang="en" href="${origin}/en${r.subPath}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/nl${r.subPath}" />
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>
  <url>
    <loc>${origin}/en${r.subPath}</loc>
    <xhtml:link rel="alternate" hreflang="nl" href="${origin}/nl${r.subPath}" />
    <xhtml:link rel="alternate" hreflang="en" href="${origin}/en${r.subPath}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/nl${r.subPath}" />
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${(Number(r.priority) * 0.9).toFixed(1)}</priority>
  </url>`,
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
      `3D Print Service Nederland | ${businessInfo.name} - Snel & Op Maat`,
      "Professionele 3D print service in Nederland. Upload je 3D-bestand (STL/3MF), kies PLA, PETG of TPU en ontvang direct een offerte. Snelle levering binnen 2-5 werkdagen.",
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
            __INITIAL_HTML__:
              mode === "production" ? "<!--INITIAL_HTML-->" : "",
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
