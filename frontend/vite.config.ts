import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { businessInfo } from "./src/config/businessInfo.ts";

const crawlerFiles = {
  "/robots.txt": {
    contentType: "text/plain",
    source: `User-agent: *\nAllow: /\n\nSitemap: ${businessInfo.website}/sitemap.xml\n`,
  },
  "/sitemap.xml": {
    contentType: "application/xml",
    source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${["/", "/faq"].map((route) => `  <url><loc>${new URL(route, businessInfo.website).href}</loc></url>`).join("\n")}\n</urlset>\n`,
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

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "business-metadata",
        transformIndexHtml(html) {
          const values = {
            __BUSINESS_NAME__: businessInfo.name,
            __BUSINESS_HOME_URL__: new URL("/", businessInfo.website).href,
          };
          for (const [token, value] of Object.entries(values)) {
            const escapedValue = value.replace(/[&<>"']/g, (character) =>
              ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
            );
            html = html.replaceAll(token, escapedValue);
          }
          return html;
        },
        configureServer(devServer) {
          devServer.middlewares.use((request, response, next) => {
            const file = crawlerFiles[request.url?.split("?")[0] as keyof typeof crawlerFiles];
            if (!file) return next();
            response.setHeader("Content-Type", `${file.contentType}; charset=utf-8`);
            response.end(file.source);
          });
        },
        generateBundle() {
          for (const [url, file] of Object.entries(crawlerFiles)) {
            this.emitFile({ type: "asset", fileName: url.slice(1), source: file.source });
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
          },
        },
      },
    },
    server,
  };
});
