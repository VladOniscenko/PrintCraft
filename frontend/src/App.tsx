import { Suspense, lazy, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import SeoManager from "./components/SeoManager";
import api from "./services/api";
import { ALLOWED_PRODUCT_ORDER } from "./constants.tsx";

const recentVisitDispatches = new Map<string, number>();

function shouldSendVisit(eventType: "pageview" | "heartbeat", path: string) {
  const key = `${eventType}:${path}`;
  const now = Date.now();
  const minGapMs = eventType === "pageview" ? 3000 : 55000;
  const previous = recentVisitDispatches.get(key) ?? 0;

  if (now - previous < minGapMs) {
    return false;
  }

  recentVisitDispatches.set(key, now);

  for (const [entryKey, timestamp] of recentVisitDispatches) {
    if (now - timestamp > 10 * 60 * 1000) {
      recentVisitDispatches.delete(entryKey);
    }
  }

  return true;
}

const Home = lazy(() => import("./components/Home.tsx"));
const Login = lazy(() => import("./components/Login.tsx"));
const Quote = lazy(() => import("./components/Quote.tsx"));
const Signup = lazy(() => import("./components/Signup.tsx"));
const Materials = lazy(() => import("./components/Materials.tsx"));
const Gallery = lazy(() => import("./components/Gallery.tsx"));
const ProductDetail = lazy(() => import("./components/ProductDetail.tsx"));
const FAQ = lazy(() => import("./components/FAQ.tsx"));
const Orders = lazy(() => import("./components/user/Orders.tsx"));
const Profile = lazy(() => import("./components/user/Profile.tsx"));
const OrderDetail = lazy(() => import("./components/OrderDetail.tsx"));
const Cart = lazy(() => import("./components/Cart.tsx"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./components/admin/AdminOrders.tsx"));
const AdminOrderDetail = lazy(
  () => import("./components/admin/AdminOrderDetail.tsx"),
);
const AdminPayments = lazy(
  () => import("./components/admin/AdminPayments.tsx"),
);
const AdminUsers = lazy(() => import("./components/admin/AdminUsers.tsx"));
const AdminUserDetail = lazy(
  () => import("./components/admin/AdminUserDetail.tsx"),
);
const AdminProducts = lazy(
  () => import("./components/admin/AdminProducts.tsx"),
);
const AdminProductEdit = lazy(
  () => import("./components/admin/AdminProductEdit.tsx"),
);
const AdminFilaments = lazy(
  () => import("./components/admin/AdminFilaments.tsx"),
);
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy.tsx"));
const TermsOfService = lazy(() => import("./components/TermsOfService.tsx"));
const RefundPolicy = lazy(() => import("./components/RefundPolicy.tsx"));
const ShippingPolicy = lazy(() => import("./components/ShippingPolicy.tsx"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./components/ResetPassword.tsx"));
const ModelFilesBrowser = lazy(
  () => import("./components/ModelFilesBrowser.tsx"),
);
const OrderModelViewerPage = lazy(
  () => import("./components/OrderModelViewerPage.tsx"),
);
const AdminUploadedModelViewerPage = lazy(
  () => import("./components/admin/AdminUploadedModelViewerPage.tsx"),
);
const NotFound = lazy(() => import("./components/NotFound.tsx"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  if (!token || !user) return <Navigate to="/login" replace />;

  try {
    const parsed = JSON.parse(user);
    if (parsed.role === "admin") return <>{children}</>;
  } catch {
    /* fall through */
  }
  return <Navigate to="/" replace />;
}

function AuthSessionGuard() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get("/auth/me");
        if (cancelled) return;
        if (res?.data) {
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401 || status === 404) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login", { replace: true, state: { from: location } });
          }
        }
      }
    };

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, [location, navigate]);

  return null;
}

function VisitTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    let stopped = false;

    const sendVisit = async (eventType: "pageview" | "heartbeat") => {
      if (!shouldSendVisit(eventType, path)) {
        return;
      }

      try {
        await api.post("/analytics/visit", {
          path,
          eventType,
        });
      } catch {
        if (!stopped) {
          // Intentionally swallow analytics tracking errors.
        }
      }
    };

    void sendVisit("pageview");

    const heartbeatId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void sendVisit("heartbeat");
      }
    }, 60000);

    return () => {
      stopped = true;
      window.clearInterval(heartbeatId);
    };
  }, [location.pathname, location.search]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthSessionGuard />
      <VisitTracker />
      <SeoManager />
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center text-[#2e423d]">
            Loading...
          </div>
        }
      >
        <Routes>
          {/* Public Routes - Anyone can see these */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/materials" element={<Materials />} />

          {ALLOWED_PRODUCT_ORDER && (
            <>
              <Route path="/products" element={<Gallery />} />
              <Route path="/products/:id" element={<ProductDetail />} />
            </>
          )}

          <Route path="/how-it-works" element={<Navigate to="/" replace />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/refunds" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />

          {/* Private Routes - Only logged-in users can see these */}
          <Route
            path="/quote"
            element={
              <ProtectedRoute>
                <Quote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />

          {ALLOWED_PRODUCT_ORDER && (
            <>
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                }
              />
            </>
          )}

          <Route
            path="/orders/:id/models/:itemIndex"
            element={
              <ProtectedRoute>
                <OrderModelViewerPage mode="user" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders/:id"
            element={
              <AdminRoute>
                <AdminOrderDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <AdminRoute>
                <AdminUserDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders/:id/models/:itemIndex"
            element={
              <AdminRoute>
                <OrderModelViewerPage mode="admin" />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/models"
            element={
              <AdminRoute>
                <ModelFilesBrowser />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/models/view/:fileName"
            element={
              <AdminRoute>
                <AdminUploadedModelViewerPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminRoute>
                <AdminPayments />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products/:id"
            element={
              <AdminRoute>
                <AdminProductEdit />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/filaments"
            element={
              <AdminRoute>
                <AdminFilaments />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
