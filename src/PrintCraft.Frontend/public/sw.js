/* eslint-disable no-restricted-globals */
// PrintCraft Service Worker for High-Speed Static Page and Asset Caching

const CACHE_VERSION = "pc-v2026.11";
const PAGES_CACHE = `pc-pages-${CACHE_VERSION}`;
const ASSETS_CACHE = `pc-assets-${CACHE_VERSION}`;

// Pre-cached core static shell routes for instant cold loads
const PRECACHE_URLS = [
  "/nl/",
  "/en/",
  "/nl/faq",
  "/en/faq",
  "/nl/privacy",
  "/en/privacy",
  "/nl/terms",
  "/en/terms",
  "/favicon.svg",
];

// Routes that must NEVER be cached by the service worker (dynamic/private)
const EXCLUDED_ROUTE_PATTERNS = [
  /^\/api\//,
  /^\/(?:[a-z]{2}\/)?admin(?:$|\/)/,
  /^\/(?:[a-z]{2}\/)?orders(?:$|\/)/,
  /^\/(?:[a-z]{2}\/)?profile(?:$|\/)/,
  /^\/(?:[a-z]{2}\/)?checkout(?:$|\/)/,
  /^\/(?:[a-z]{2}\/)?quote(?:$|\/)/,
  /^\/(?:[a-z]{2}\/)?filament-painting(?:$|\/)/,
  /^\/(?:[a-z]{2}\/)?login(?:$|\/)/,
  /^\/(?:[a-z]{2}\/)?register(?:$|\/)/,
  /^\/(?:[a-z]{2}\/)?signup(?:$|\/)/,
  /^\/(?:[a-z]{2}\/)?forgot-password(?:$|\/)/,
  /^\/(?:[a-z]{2}\/)?reset-password(?:$|\/)/,
];

// Helper: is private/dynamic route
function isExcludedRoute(pathname) {
  return EXCLUDED_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

// 1. Install event: Pre-cache core shell pages and skip waiting
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(PAGES_CACHE).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE_URLS);
      } catch (err) {
        // Continue even if some individual URL fails during pre-cache
        console.warn("[SW] Pre-caching note:", err);
      }
    }),
  );
});

// 2. Activate event: Clean up legacy caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== PAGES_CACHE && name !== ASSETS_CACHE) {
              return caches.delete(name);
            }
            return Promise.resolve();
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// 3. Fetch event: Stale-While-Revalidate for Static Pages, Cache-First for Hashed Assets
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests within same origin
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  const pathname = url.pathname;

  // Never intercept excluded routes (API, admin, user orders/profile)
  if (isExcludedRoute(pathname)) {
    return;
  }

  // --- Strategy A: Static Assets (Hashed Vite JS/CSS, Fonts, Images, 3D Models) ---
  const isStaticAsset =
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/fonts/") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".stl") ||
    pathname.endsWith(".3mf") ||
    pathname.endsWith(".glb");

  if (isStaticAsset) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cachedResponse || Response.error();
        }
      }),
    );
    return;
  }

  // --- Strategy B: Static Pages (Navigations for Home, FAQ, Cities, Policies) ---
  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(PAGES_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        // Fetch fresh copy in the background to revalidate cache (Stale-While-Revalidate)
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => null);

        // If we have a cached page, serve it instantly (0ms load time!)
        if (cachedResponse) {
          event.waitUntil(fetchPromise);
          return cachedResponse;
        }

        // Otherwise wait for network response
        const networkResponse = await fetchPromise;
        if (networkResponse) {
          return networkResponse;
        }

        // Offline fallback: try to serve localized homepage
        const fallback =
          (await cache.match("/nl/")) || (await cache.match("/en/"));
        return fallback || Response.error();
      }),
    );
  }
});

