import { Suspense, lazy, useEffect, useRef } from "react";
import axios from "axios";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import SeoManager from "./components/SeoManager";
import { getCurrentUser, invalidateAuthCache } from "./services/api";
import { useI18n, getInitialLanguage } from "./i18n/I18nContext.tsx";
import { isSupportedLanguage, resolveLanguage } from "./i18n/translations";
import { loadNamespaces } from "./i18n/loader";
import type { TranslationNamespace } from "./i18n/schema";

function lazyWithI18n<P extends object>(
  factory: () => Promise<{ default: React.ComponentType<P> }>,
  namespaces: TranslationNamespace[],
) {
  return lazy(async () => {
    const lang = getInitialLanguage();
    const [module] = await Promise.all([
      factory(),
      loadNamespaces(lang, namespaces),
    ]);
    return module;
  });
}

// Preload Home translations immediately if visitor is on landing route
if (typeof window !== "undefined") {
  const p = window.location.pathname;
  if (p === "/" || p === "/nl" || p === "/en" || p === "/nl/" || p === "/en/") {
    void loadNamespaces(getInitialLanguage(), ["home", "hero", "recent"]);
  }
}

const Home = lazyWithI18n(
  () => import("./components/Home.tsx"),
  ["home", "hero", "recent"],
);
const Login = lazyWithI18n(() => import("./components/Login.tsx"), ["login"]);
const Quote = lazyWithI18n(
  () => import("./components/Quote.tsx"),
  ["quote", "viewer3d", "filamentPainting", "modelViewer"],
);
const Signup = lazyWithI18n(() => import("./components/Signup.tsx"), ["signup"]);
const FAQ = lazyWithI18n(() => import("./components/FAQ.tsx"), ["faq"]);
const Orders = lazyWithI18n(
  () => import("./components/user/Orders.tsx"),
  ["orders"],
);
const Profile = lazyWithI18n(
  () => import("./components/user/Profile.tsx"),
  ["profile"],
);
const OrderDetail = lazyWithI18n(
  () => import("./components/OrderDetail.tsx"),
  ["orderDetail"],
);
const AdminDashboard = lazyWithI18n(
  () => import("./components/admin/AdminDashboard"),
  ["admin", "orderDetail"],
);
const AdminOrders = lazyWithI18n(
  () => import("./components/admin/AdminOrders.tsx"),
  ["admin", "orderDetail"],
);
const AdminOrderDetail = lazyWithI18n(
  () => import("./components/admin/AdminOrderDetail.tsx"),
  ["admin", "orderDetail"],
);
const AdminPayments = lazyWithI18n(
  () => import("./components/admin/AdminPayments.tsx"),
  ["admin"],
);
const AdminUsers = lazyWithI18n(
  () => import("./components/admin/AdminUsers.tsx"),
  ["admin"],
);
const AdminUserDetail = lazyWithI18n(
  () => import("./components/admin/AdminUserDetail.tsx"),
  ["admin"],
);
const AdminFilaments = lazyWithI18n(
  () => import("./components/admin/AdminFilaments.tsx"),
  ["admin"],
);
const AdminHeroSlides = lazyWithI18n(
  () => import("./components/admin/AdminHeroSlides.tsx"),
  ["admin"],
);
const AdminEmailTemplates = lazyWithI18n(
  () => import("./components/admin/AdminEmailTemplates.tsx"),
  ["admin"],
);
const AdminFaq = lazyWithI18n(
  () => import("./components/admin/AdminFaq.tsx"),
  ["admin", "faq"],
);
const AdminCities = lazyWithI18n(
  () => import("./components/admin/AdminCities.tsx"),
  ["admin", "cityPage"],
);
const PrivacyPolicy = lazyWithI18n(
  () => import("./components/PrivacyPolicy.tsx"),
  ["legal"],
);
const TermsOfService = lazyWithI18n(
  () => import("./components/TermsOfService.tsx"),
  ["legal"],
);
const RefundPolicy = lazyWithI18n(
  () => import("./components/RefundPolicy.tsx"),
  ["legal"],
);
const ShippingPolicy = lazyWithI18n(
  () => import("./components/ShippingPolicy.tsx"),
  ["legal"],
);
const ForgotPassword = lazyWithI18n(
  () => import("./components/ForgotPassword.tsx"),
  ["forgot"],
);
const ResetPassword = lazyWithI18n(
  () => import("./components/ResetPassword.tsx"),
  ["reset"],
);
const ModelFilesBrowser = lazyWithI18n(
  () => import("./components/ModelFilesBrowser.tsx"),
  ["models", "modelFiles", "viewer3d"],
);
const AdminUploadedModelViewerPage = lazyWithI18n(
  () => import("./components/admin/AdminUploadedModelViewerPage.tsx"),
  ["admin", "viewer3d", "modelFiles"],
);
const CityLandingPage = lazyWithI18n(
  () => import("./components/CityLandingPage.tsx"),
  ["cityPage"],
);
const ApplicationLandingPage = lazyWithI18n(
  () => import("./components/ApplicationLandingPage.tsx"),
  ["faq"],
);
const NotFound = lazyWithI18n(
  () => import("./components/NotFound.tsx"),
  ["notFound"],
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const { lang } = useParams<{ lang?: string }>();
  const preferred = resolveLanguage(lang || localStorage.getItem("language"));
  return token ? <>{children}</> : <Navigate to={`/${preferred}/login`} replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  const { lang } = useParams<{ lang?: string }>();
  const preferred = resolveLanguage(lang || localStorage.getItem("language"));
  if (!token || !user) return <Navigate to={`/${preferred}/login`} replace />;

  try {
    const parsed = JSON.parse(user);
    if (parsed.role === "admin") return <>{children}</>;
  } catch {
    /* fall through */
  }
  return <Navigate to={`/${preferred}`} replace />;
}

function AuthSessionGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const user = await getCurrentUser();
        if (cancelled) return;
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401 || status === 404) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            invalidateAuthCache();
            const stored = typeof window !== "undefined" ? localStorage.getItem("language") : null;
            const preferred = resolveLanguage(stored);
            navigate(`/${preferred}/login`, { replace: true, state: { from: locationRef.current } });
          }
        }
      }
    };

    void validateSession();

    const handleFocus = () => {
      const lastCheck = Number(sessionStorage.getItem("last_auth_check") || "0");
      if (Date.now() - lastCheck > 5 * 60 * 1000) {
        sessionStorage.setItem("last_auth_check", String(Date.now()));
        void validateSession();
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
    };
  }, [navigate]);

  return null;
}


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function RootLanguageRedirect() {
  const stored = typeof window !== "undefined" ? localStorage.getItem("language") : null;
  const preferred = resolveLanguage(stored);
  return <Navigate to={`/${preferred}`} replace />;
}

function LegacyPathRedirect({ target }: { target?: string } = {}) {
  const location = useLocation();
  const stored = typeof window !== "undefined" ? localStorage.getItem("language") : null;
  const preferred = resolveLanguage(stored);
  const targetPath = target ?? location.pathname;
  const cleanTarget = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  return (
    <Navigate
      to={`/${preferred}${cleanTarget === "/" ? "" : cleanTarget}${location.search}${location.hash}`}
      replace
    />
  );
}

function LegacyCityRedirect() {
  const { city } = useParams<{ city: string }>();
  const location = useLocation();
  const stored = typeof window !== "undefined" ? localStorage.getItem("language") : null;
  const preferred = resolveLanguage(stored);
  return (
    <Navigate
      to={`/${preferred}/3d-print-service/${city || ""}${location.search}${location.hash}`}
      replace
    />
  );
}

function LegacyApplicationRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const stored = typeof window !== "undefined" ? localStorage.getItem("language") : null;
  const preferred = resolveLanguage(stored);
  return (
    <Navigate
      to={`/${preferred}/faq/${slug || ""}${location.search}${location.hash}`}
      replace
    />
  );
}

function LanguageRouteGuard() {
  const { lang } = useParams<{ lang: string }>();
  if (!isSupportedLanguage(lang)) {
    return <NotFound />;
  }
  return <Outlet />;
}

export default function App() {
  const { t } = useI18n();
  return (
    <>
      <AuthSessionGuard />
      <ScrollToTop />
      <SeoManager />
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center text-[#2e423d]">
            {t("common.loading")}
          </div>
        }
      >
        <Routes>
          {/* Naked / Legacy Route Redirects (automatically redirect to active/preferred language) */}
          <Route path="/" element={<RootLanguageRedirect />} />
          <Route path="/faq" element={<LegacyPathRedirect target="/faq" />} />
          <Route path="/checkout" element={<LegacyPathRedirect target="/checkout" />} />
          <Route path="/quote" element={<LegacyPathRedirect target="/checkout" />} />
          <Route
            path="/3d-print-service/:city"
            element={<LegacyCityRedirect />}
          />
          <Route
            path="/oplossingen/:slug"
            element={<LegacyApplicationRedirect />}
          />
          <Route path="/privacy" element={<LegacyPathRedirect target="/privacy" />} />
          <Route path="/terms" element={<LegacyPathRedirect target="/terms" />} />
          <Route path="/refunds" element={<LegacyPathRedirect target="/refunds" />} />
          <Route
            path="/shipping-policy"
            element={<LegacyPathRedirect target="/shipping-policy" />}
          />
          <Route path="/login" element={<LegacyPathRedirect target="/login" />} />
          <Route path="/signup" element={<LegacyPathRedirect target="/signup" />} />
          <Route
            path="/forgot-password"
            element={<LegacyPathRedirect target="/forgot-password" />}
          />
          <Route
            path="/reset-password"
            element={<LegacyPathRedirect target="/reset-password" />}
          />
          <Route path="/orders" element={<LegacyPathRedirect target="/orders" />} />
          <Route path="/profile" element={<LegacyPathRedirect target="/profile" />} />
          <Route
            path="/orders/:id"
            element={<LegacyPathRedirect />}
          />
          <Route path="/admin" element={<LegacyPathRedirect target="/admin" />} />
          <Route path="/admin/*" element={<LegacyPathRedirect />} />

          {/* Localized Routes: /:lang/... */}
          <Route path="/:lang" element={<LanguageRouteGuard />}>
            <Route index element={<Home />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="faq/:slug" element={<ApplicationLandingPage />} />
            <Route path="oplossingen/:slug" element={<LegacyApplicationRedirect />} />
            <Route path="3d-print-service/:city" element={<CityLandingPage />} />
            <Route path="privacy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<TermsOfService />} />
            <Route path="refunds" element={<RefundPolicy />} />
            <Route path="shipping-policy" element={<ShippingPolicy />} />

            <Route path="quote" element={<Navigate to="../checkout" replace />} />
            <Route path="checkout" element={<Quote />} />

            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />

            <Route
              path="orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="admin/orders"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />
            <Route
              path="admin/orders/:id"
              element={
                <AdminRoute>
                  <AdminOrderDetail />
                </AdminRoute>
              }
            />
            <Route
              path="admin/users/:id"
              element={
                <AdminRoute>
                  <AdminUserDetail />
                </AdminRoute>
              }
            />
            <Route
              path="admin/models"
              element={
                <AdminRoute>
                  <ModelFilesBrowser />
                </AdminRoute>
              }
            />
            <Route
              path="admin/models/view/:fileName"
              element={
                <AdminRoute>
                  <AdminUploadedModelViewerPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/payments"
              element={
                <AdminRoute>
                  <AdminPayments />
                </AdminRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="admin/filaments"
              element={
                <AdminRoute>
                  <AdminFilaments />
                </AdminRoute>
              }
            />
            <Route
              path="admin/hero-slides"
              element={
                <AdminRoute>
                  <AdminHeroSlides />
                </AdminRoute>
              }
            />
            <Route
              path="admin/email-templates"
              element={
                <AdminRoute>
                  <AdminEmailTemplates />
                </AdminRoute>
              }
            />
            <Route
              path="admin/faq"
              element={
                <AdminRoute>
                  <AdminFaq />
                </AdminRoute>
              }
            />
            <Route
              path="admin/cities"
              element={
                <AdminRoute>
                  <AdminCities />
                </AdminRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Catch-all for any other unmatched routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
