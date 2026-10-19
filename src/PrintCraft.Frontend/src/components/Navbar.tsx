import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, ChevronDown, User, Package, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./logos/Logo";
import { useI18n } from "../i18n/I18nContext";
import { seoApplications, getApplicationName } from "../config/seoApplications";

const prefetchMap: Record<string, () => Promise<unknown>> = {
  "/orders": () => import("./user/Orders"),
  "/profile": () => import("./user/Profile"),
  "/admin": () => import("./admin/AdminDashboard"),
  "/login": () => import("./Login"),
  "/checkout": () => import("./Quote"),
  "/faq": () => import("./FAQ"),
};

function prefetchRoute(path: string) {
  const loader = prefetchMap[path];
  if (loader) {
    void loader();
  }
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("token"));
  });
  const [userRole, setUserRole] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")?.role || null;
    } catch {
      return null;
    }
  });
  const [userName, setUserName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u?.name || u?.email || null;
    } catch {
      return null;
    }
  });

  const [accountOpen, setAccountOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, language, setLanguage, languageOptions, localizePath } = useI18n();

  // Sync auth state on mount, route changes, or cross-tab storage events
  useEffect(() => {
    const updateAuth = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const isAuth = !!token;
      setIsLoggedIn(isAuth);

      if (typeof document !== "undefined") {
        if (isAuth) {
          document.documentElement.classList.add("user-auth");
        } else {
          document.documentElement.classList.remove("user-auth");
        }
      }

      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          setUserRole(parsed?.role || null);
          setUserName(parsed?.name || parsed?.email || null);
          if (typeof document !== "undefined") {
            if (parsed?.role === "admin") {
              document.documentElement.classList.add("user-admin");
            } else {
              document.documentElement.classList.remove("user-admin");
            }
          }
        } catch {
          setUserRole(null);
          setUserName(null);
          if (typeof document !== "undefined") {
            document.documentElement.classList.remove("user-admin");
          }
        }
      } else {
        setUserRole(null);
        setUserName(null);
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("user-admin");
        }
      }
    };

    updateAuth();
    window.addEventListener("storage", updateAuth);
    return () => window.removeEventListener("storage", updateAuth);
  }, [pathname]);

  // Close dropdowns on route change
  useEffect(() => {
    setSolutionsOpen(false);
    setAccountOpen(false);
    setMobileSolutionsOpen(false);
    setIsOpen(false);
  }, [pathname]);

  // Click outside to close desktop dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setSolutionsOpen(false);
      }
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(target)
      ) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("user-auth");
      document.documentElement.classList.remove("user-admin");
    }
    setIsLoggedIn(false);
    setUserRole(null);
    setUserName(null);
    setAccountOpen(false);
    navigate(localizePath("/"));
  };

  const isLinkActive = (path: string) => {
    if (path === localizePath("/")) {
      return pathname === path || pathname === `${path}/`;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <nav className="site-navbar px-5 py-3.5 flex items-center justify-between">
      <Logo className="scale-[0.98]" />

      {/* Desktop Links (Fixed & Stable to prevent CLS / jumping) */}
      <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-600">
        <Link
          to={localizePath("/")}
          onMouseEnter={() => prefetchRoute(localizePath("/"))}
          onFocus={() => prefetchRoute(localizePath("/"))}
          className={`rounded-lg px-3 py-2 transition-colors ${
            isLinkActive(localizePath("/"))
              ? "bg-[#ecf6f2] text-[#0f766e]"
              : "text-[#445852] hover:bg-[#f3faf7] hover:text-[#0f766e]"
          }`}
        >
          {t("nav.home")}
        </Link>

        {/* Solutions Dropdown */}
        <div
          ref={dropdownRef}
          className="relative"
          onMouseEnter={() => setSolutionsOpen(true)}
          onMouseLeave={() => setSolutionsOpen(false)}
        >
          <button
            type="button"
            onClick={() => setSolutionsOpen(!solutionsOpen)}
            className={`rounded-lg px-3 py-2 transition-colors inline-flex items-center gap-1 ${
              pathname.includes("/faq/") && pathname.replace(/\/$/, "") !== localizePath("/faq")
                ? "bg-[#ecf6f2] text-[#0f766e]"
                : "text-[#445852] hover:bg-[#f3faf7] hover:text-[#0f766e]"
            }`}
          >
            <span>{t("nav.solutions")}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${solutionsOpen ? "rotate-180" : ""}`}
            />
          </button>

          {solutionsOpen && (
            <div className="absolute top-full left-0 pt-2 w-72 z-50">
              <div className="bg-white rounded-2xl shadow-xl border border-[#d8e6df] p-2 space-y-1">
                {seoApplications.map((app) => (
                  <Link
                    key={app.slug}
                    to={localizePath(`/faq/${app.slug}`)}
                    onClick={() => setSolutionsOpen(false)}
                    className="block p-2.5 rounded-xl hover:bg-[#f3faf7] transition-all group"
                  >
                    <p className="text-xs font-bold text-[#142621] group-hover:text-emerald-700 transition-colors">
                      {getApplicationName(app, language)}
                    </p>
                    <p className="text-[11px] text-[#637973] mt-0.5 line-clamp-1">
                      {app.badge[language] || app.badge.nl}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link
          to={localizePath("/faq")}
          onMouseEnter={() => prefetchRoute(localizePath("/faq"))}
          onFocus={() => prefetchRoute(localizePath("/faq"))}
          className={`rounded-lg px-3 py-2 transition-colors ${
            isLinkActive(localizePath("/faq"))
              ? "bg-[#ecf6f2] text-[#0f766e]"
              : "text-[#445852] hover:bg-[#f3faf7] hover:text-[#0f766e]"
          }`}
        >
          {t("nav.faq")}
        </Link>

        <Link
          to={localizePath("/checkout")}
          onMouseEnter={() => prefetchRoute(localizePath("/checkout"))}
          onFocus={() => prefetchRoute(localizePath("/checkout"))}
          className={`rounded-lg px-3 py-2 transition-colors ${
            isLinkActive(localizePath("/checkout"))
              ? "bg-[#ecf6f2] text-[#0f766e]"
              : "text-[#445852] hover:bg-[#f3faf7] hover:text-[#0f766e]"
          }`}
        >
          {t("nav.instantQuote")}
        </Link>
      </div>

      {/* Right Desktop Section */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Language Switcher */}
        <div className="flex items-center gap-1 border border-[#d4e3dd] rounded-lg p-1 bg-[#f7fbf9]">
          {languageOptions.map((option) => (
            <button
              key={option.code}
              onClick={() => setLanguage(option.code)}
              className={`px-2 py-1 text-xs font-bold rounded ${
                language === option.code
                  ? "bg-[#0f766e] text-white"
                  : "text-[#5f736d] hover:text-[#213630]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Auth action slot with stable container */}
        <div className="flex items-center shrink-0">
          {/* Guest: Log In Button */}
          <div className={`nav-guest-only ${isLoggedIn ? "hidden" : "block"}`}>
            <Link
              to={localizePath("/login")}
              onMouseEnter={() => prefetchRoute(localizePath("/login"))}
              onFocus={() => prefetchRoute(localizePath("/login"))}
              className="site-btn-soft min-w-[95px] justify-center text-center"
            >
              {t("nav.logIn")}
            </Link>
          </div>

          {/* Authenticated: Account Dropdown Menu */}
          <div
            ref={accountDropdownRef}
            className={`nav-auth-only relative ${isLoggedIn ? "block" : "hidden"}`}
          >
            <button
              type="button"
              onClick={() => setAccountOpen(!accountOpen)}
              className={`site-btn-soft inline-flex items-center justify-center gap-1.5 min-w-[95px] ${
                accountOpen ||
                isLinkActive(localizePath("/orders")) ||
                isLinkActive(localizePath("/profile")) ||
                isLinkActive(localizePath("/admin"))
                  ? "bg-[#ecf6f2] text-[#0f766e] border-[#0f766e]"
                  : ""
              }`}
              aria-expanded={accountOpen}
              aria-haspopup="true"
            >
              <User size={16} />
              <span>{t("nav.account")}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
              />
            </button>

          {accountOpen && (
            <div className="absolute right-0 top-full pt-2 w-56 z-50">
              <div className="bg-white rounded-2xl shadow-xl border border-[#d8e6df] p-2 space-y-1">
                {userName && (
                  <div className="px-3 py-2 text-xs font-semibold text-[#5f736d] border-b border-[#eaf2ee] truncate">
                    {userName}
                  </div>
                )}

                <Link
                  to={localizePath("/orders")}
                  onClick={() => setAccountOpen(false)}
                  onMouseEnter={() => prefetchRoute(localizePath("/orders"))}
                  onFocus={() => prefetchRoute(localizePath("/orders"))}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isLinkActive(localizePath("/orders"))
                      ? "bg-[#ecf6f2] text-[#0f766e]"
                      : "text-[#3f554e] hover:bg-[#f3faf7] hover:text-[#0f766e]"
                  }`}
                >
                  <Package size={15} />
                  <span>{t("nav.myOrders")}</span>
                </Link>

                <Link
                  to={localizePath("/profile")}
                  onClick={() => setAccountOpen(false)}
                  onMouseEnter={() => prefetchRoute(localizePath("/profile"))}
                  onFocus={() => prefetchRoute(localizePath("/profile"))}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isLinkActive(localizePath("/profile"))
                      ? "bg-[#ecf6f2] text-[#0f766e]"
                      : "text-[#3f554e] hover:bg-[#f3faf7] hover:text-[#0f766e]"
                  }`}
                >
                  <User size={15} />
                  <span>{t("nav.myProfile")}</span>
                </Link>

                {userRole === "admin" && (
                  <Link
                    to={localizePath("/admin")}
                    onClick={() => setAccountOpen(false)}
                    onMouseEnter={() => prefetchRoute(localizePath("/admin"))}
                    onFocus={() => prefetchRoute(localizePath("/admin"))}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      isLinkActive(localizePath("/admin"))
                        ? "bg-[#ecf6f2] text-[#0f766e]"
                        : "text-[#3f554e] hover:bg-[#f3faf7] hover:text-[#0f766e]"
                    }`}
                  >
                    <ShieldCheck size={15} />
                    <span>{t("nav.admin")}</span>
                  </Link>
                )}

                <div className="border-t border-[#eaf2ee] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  <span>{t("nav.logOut")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Mobile Menu Toggle */}
      <button
        type="button"
        className="lg:hidden p-2 text-[#3f5851]"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("nav.toggleMenu")}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white/95 border-t border-[#d8e6df] p-4 flex flex-col gap-4 absolute top-full left-0 w-full z-40 shadow-lg backdrop-blur-md rounded-b-2xl">
          <Link
            to={localizePath("/")}
            className={`font-medium py-2 px-2 rounded-lg ${
              isLinkActive(localizePath("/"))
                ? "bg-[#ecf6f2] text-[#0f766e]"
                : "text-[#3d534c]"
            }`}
            onClick={() => setIsOpen(false)}
          >
            {t("nav.home")}
          </Link>

          {/* Mobile Solutions Accordion */}
          <div>
            <button
              type="button"
              onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
              className={`w-full flex items-center justify-between font-medium py-2 px-2 rounded-lg ${
                pathname.includes("/faq/") && pathname !== localizePath("/faq")
                  ? "bg-[#ecf6f2] text-[#0f766e]"
                  : "text-[#3d534c]"
              }`}
            >
              <span>{t("nav.solutions")}</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${mobileSolutionsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {mobileSolutionsOpen && (
              <div className="pl-3 pr-1 py-1 space-y-1">
                {seoApplications.map((app) => (
                  <Link
                    key={app.slug}
                    to={localizePath(`/faq/${app.slug}`)}
                    className="block py-1.5 px-2.5 rounded-lg text-sm text-[#445b54] hover:bg-[#ecf6f2] hover:text-[#0f766e]"
                    onClick={() => {
                      setIsOpen(false);
                      setMobileSolutionsOpen(false);
                    }}
                  >
                    {getApplicationName(app, language)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to={localizePath("/faq")}
            className={`font-medium py-2 px-2 rounded-lg ${
              isLinkActive(localizePath("/faq"))
                ? "bg-[#ecf6f2] text-[#0f766e]"
                : "text-[#3d534c]"
            }`}
            onClick={() => setIsOpen(false)}
          >
            {t("nav.faq")}
          </Link>

          <Link
            to={localizePath("/checkout")}
            className={`font-medium py-2 px-2 rounded-lg ${
              isLinkActive(localizePath("/checkout"))
                ? "bg-[#ecf6f2] text-[#0f766e]"
                : "text-[#3d534c]"
            }`}
            onClick={() => setIsOpen(false)}
          >
            {t("nav.instantQuote")}
          </Link>

          {/* Mobile Authenticated Routes */}
          {isLoggedIn && (
            <div className="nav-auth-only flex flex-col gap-1 border-t border-[#deebe6] pt-2">
              <Link
                to={localizePath("/orders")}
                className={`font-medium py-2 px-2 rounded-lg flex items-center gap-2 ${
                  isLinkActive(localizePath("/orders"))
                    ? "bg-[#ecf6f2] text-[#0f766e]"
                    : "text-[#3d534c]"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Package size={16} />
                <span>{t("nav.myOrders")}</span>
              </Link>
              <Link
                to={localizePath("/profile")}
                className={`font-medium py-2 px-2 rounded-lg flex items-center gap-2 ${
                  isLinkActive(localizePath("/profile"))
                    ? "bg-[#ecf6f2] text-[#0f766e]"
                    : "text-[#3d534c]"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <User size={16} />
                <span>{t("nav.myProfile")}</span>
              </Link>
              {userRole === "admin" && (
                <Link
                  to={localizePath("/admin")}
                  className={`font-medium py-2 px-2 rounded-lg flex items-center gap-2 ${
                    isLinkActive(localizePath("/admin"))
                      ? "bg-[#ecf6f2] text-[#0f766e]"
                      : "text-[#3d534c]"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <ShieldCheck size={16} />
                  <span>{t("nav.admin")}</span>
                </Link>
              )}
            </div>
          )}

          <hr className="border-[#deebe6]" />

          <div className="flex items-center gap-2">
            {languageOptions.map((option) => (
              <button
                key={option.code}
                onClick={() => setLanguage(option.code)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                  language === option.code
                    ? "bg-[#0f766e] text-white border-[#0f766e]"
                    : "text-[#586d67] border-[#d4e3dd]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={`nav-guest-only ${isLoggedIn ? "hidden" : "block"}`}>
            <Link
              to={localizePath("/login")}
              onClick={() => setIsOpen(false)}
              className="site-btn-soft w-full text-center block"
            >
              {t("nav.logIn")}
            </Link>
          </div>

          <div className={`nav-auth-only ${isLoggedIn ? "block" : "hidden"}`}>
            <button
              type="button"
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> {t("nav.logOut")}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
