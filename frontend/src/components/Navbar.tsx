import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, language, setLanguage, languageOptions, localizePath } = useI18n();

  // Check if user is logged in on mount and whenever the component updates or storage changes
  useEffect(() => {
    const updateAuth = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);

      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          setUserRole(parsed?.role || null);
        } catch {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    };

    updateAuth();
    window.addEventListener("storage", updateAuth);
    return () => window.removeEventListener("storage", updateAuth);
  }, [pathname]);

  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on route change
  useEffect(() => {
    setSolutionsOpen(false);
    setMobileSolutionsOpen(false);
    setIsOpen(false);
  }, [pathname]);

  // Click outside to close desktop dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSolutionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserRole(null);
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

      {/* Desktop Links */}
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
              pathname.includes("/oplossingen/")
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
                    to={localizePath(`/oplossingen/${app.slug}`)}
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

        {isLoggedIn && (
          <>
            <Link
              to={localizePath("/orders")}
              onMouseEnter={() => prefetchRoute(localizePath("/orders"))}
              onFocus={() => prefetchRoute(localizePath("/orders"))}
              className={`rounded-lg px-3 py-2 transition-colors ${
                isLinkActive(localizePath("/orders"))
                  ? "bg-[#ecf6f2] text-[#0f766e]"
                  : "text-[#445852] hover:bg-[#f3faf7] hover:text-[#0f766e]"
              }`}
            >
              {t("nav.myOrders")}
            </Link>
            <Link
              to={localizePath("/profile")}
              onMouseEnter={() => prefetchRoute(localizePath("/profile"))}
              onFocus={() => prefetchRoute(localizePath("/profile"))}
              className={`rounded-lg px-3 py-2 transition-colors ${
                isLinkActive(localizePath("/profile"))
                  ? "bg-[#ecf6f2] text-[#0f766e]"
                  : "text-[#445852] hover:bg-[#f3faf7] hover:text-[#0f766e]"
              }`}
            >
              {t("nav.myProfile")}
            </Link>
            {userRole === "admin" && (
              <Link
                to={localizePath("/admin")}
                onMouseEnter={() => prefetchRoute(localizePath("/admin"))}
                onFocus={() => prefetchRoute(localizePath("/admin"))}
                className={`rounded-lg px-3 py-2 transition-colors ${
                  isLinkActive(localizePath("/admin"))
                    ? "bg-[#ecf6f2] text-[#0f766e]"
                    : "text-[#445852] hover:bg-[#f3faf7] hover:text-[#0f766e]"
                }`}
              >
                {t("nav.admin")}
              </Link>
            )}
          </>
        )}

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
          {t("hero.ctaQuote")}
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-4">
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

        {!isLoggedIn ? (
          <>
            <Link
              to={localizePath("/login")}
              onMouseEnter={() => prefetchRoute(localizePath("/login"))}
              onFocus={() => prefetchRoute(localizePath("/login"))}
              className="site-btn-soft"
            >
              {t("nav.logIn")}
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="p-2.5 text-[#647972] hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
              title={t("nav.logOut")}
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button
        className="lg:hidden p-2 text-[#3f5851]"
        onClick={() => setIsOpen(!isOpen)}
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
                pathname.includes("/oplossingen/")
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
                    to={localizePath(`/oplossingen/${app.slug}`)}
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
            {t("hero.ctaQuote")}
          </Link>

          {isLoggedIn && (
            <>
              <Link
                to={localizePath("/orders")}
                className={`font-medium py-2 px-2 rounded-lg ${
                  isLinkActive(localizePath("/orders"))
                    ? "bg-[#ecf6f2] text-[#0f766e]"
                    : "text-[#3d534c]"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {t("nav.myOrders")}
              </Link>
              <Link
                to={localizePath("/profile")}
                className={`font-medium py-2 px-2 rounded-lg ${
                  isLinkActive(localizePath("/profile"))
                    ? "bg-[#ecf6f2] text-[#0f766e]"
                    : "text-[#3d534c]"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {t("nav.myProfile")}
              </Link>
              {userRole === "admin" && (
                <Link
                  to={localizePath("/admin")}
                  className={`font-medium py-2 px-2 rounded-lg ${
                    isLinkActive(localizePath("/admin"))
                      ? "bg-[#ecf6f2] text-[#0f766e]"
                      : "text-[#3d534c]"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {t("nav.admin")}
                </Link>
              )}
            </>
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

          {!isLoggedIn ? (
            <Link
              to={localizePath("/login")}
              onClick={() => setIsOpen(false)}
              className="site-btn-soft w-full"
            >
              {t("nav.logIn")}
            </Link>
          ) : (
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> {t("nav.logOut")}
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
