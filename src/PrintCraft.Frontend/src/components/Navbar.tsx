import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, ChevronDown, User, Package, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./logos/Logo";
import { useI18n } from "../i18n/I18nContext";
import { seoApplications, getApplicationName } from "../config/seoApplications";
import ThemeToggle from "./ThemeToggle";

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
    <nav className="site-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between w-full">
        {/* Logo and Primary Navigation */}
        <div className="flex items-center gap-8">
          <Link to={localizePath("/")} className="flex items-center">
            <Logo className="scale-[0.98]" />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 text-[13px] font-medium text-gray-600 dark:text-gray-300">
            <Link
              to={localizePath("/")}
              onMouseEnter={() => prefetchRoute(localizePath("/"))}
              onFocus={() => prefetchRoute(localizePath("/"))}
              className={`rounded-full px-3.5 py-1.5 transition-colors ${
                isLinkActive(localizePath("/"))
                  ? "bg-gray-200/70 dark:bg-white/15 text-gray-950 dark:text-white font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/10"
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
                className={`rounded-full px-3.5 py-1.5 transition-colors inline-flex items-center gap-1 cursor-pointer ${
                  pathname.includes("/faq/") && pathname.replace(/\/$/, "") !== localizePath("/faq")
                    ? "bg-gray-200/70 dark:bg-white/15 text-gray-950 dark:text-white font-semibold"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/10"
                }`}
              >
                <span>{t("nav.solutions")}</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${solutionsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {solutionsOpen && (
                <div className="absolute top-full left-0 pt-2 w-72 z-50">
                  <div className="bg-white/95 dark:bg-[#111815]/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/80 dark:border-white/10 p-2 space-y-1">
                    {seoApplications.map((app) => (
                      <Link
                        key={app.slug}
                        to={localizePath(`/faq/${app.slug}`)}
                        onClick={() => setSolutionsOpen(false)}
                        className="block p-2.5 rounded-xl hover:bg-gray-50/80 dark:hover:bg-white/5 transition-all group"
                      >
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
                          {getApplicationName(app, language)}
                        </p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
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
              className={`rounded-full px-3.5 py-1.5 transition-colors ${
                isLinkActive(localizePath("/faq"))
                  ? "bg-gray-200/70 dark:bg-white/15 text-gray-950 dark:text-white font-semibold"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/10"
              }`}
            >
              {t("nav.faq")}
            </Link>
          </div>
        </div>

        {/* Right Desktop Section */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Segmented Language Switcher */}
          <div className="flex items-center gap-0.5 p-1 rounded-full bg-gray-100/90 dark:bg-white/10 border border-gray-200/60 dark:border-white/10">
            {languageOptions.map((option) => (
              <button
                key={option.code}
                onClick={() => setLanguage(option.code)}
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${
                  language === option.code
                    ? "bg-white text-gray-950 dark:bg-emerald-500 dark:text-white shadow-2xs font-bold"
                    : "text-gray-700 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Primary Instant Quote Pill CTA */}
          <Link
            to={localizePath("/quote")}
            onMouseEnter={() => prefetchRoute(localizePath("/quote"))}
            onFocus={() => prefetchRoute(localizePath("/quote"))}
            className="rounded-full px-4 py-2 text-xs font-semibold bg-[#133827] dark:bg-emerald-600 text-white hover:bg-[#0f2d1f] dark:hover:bg-emerald-500 shadow-2xs transition-all inline-flex items-center gap-1.5"
          >
            <span>{t("nav.instantQuote")}</span>
          </Link>

          {/* Auth Action Slot */}
          <div className="flex items-center shrink-0">
            {/* Guest: Log In Button */}
            <div className={`nav-guest-only ${isLoggedIn ? "hidden" : "block"}`}>
              <Link
                to={localizePath("/login")}
                onMouseEnter={() => prefetchRoute(localizePath("/login"))}
                onFocus={() => prefetchRoute(localizePath("/login"))}
                className="site-btn-soft min-w-[85px] justify-center text-center"
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
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold bg-gray-100/80 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 inline-flex items-center gap-1.5 border border-gray-200/60 dark:border-white/10 transition-colors cursor-pointer ${
                  accountOpen ||
                  isLinkActive(localizePath("/orders")) ||
                  isLinkActive(localizePath("/profile")) ||
                  isLinkActive(localizePath("/admin"))
                    ? "bg-gray-200 dark:bg-white/20 text-gray-950 dark:text-white"
                    : ""
                }`}
                aria-expanded={accountOpen}
                aria-haspopup="true"
              >
                <User size={14} className="text-gray-600 dark:text-gray-300" />
                <span className="max-w-[100px] truncate">{userName || t("nav.account")}</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
                />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full pt-2 w-56 z-50">
                  <div className="bg-white/95 dark:bg-[#111815]/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/80 dark:border-white/10 p-2 space-y-1">
                    {userName && (
                      <div className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-white/10 truncate">
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
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-950 dark:hover:text-white"
                      }`}
                    >
                      <Package size={15} className="text-gray-500 dark:text-gray-400" />
                      <span>{t("nav.myOrders")}</span>
                    </Link>

                    <Link
                      to={localizePath("/profile")}
                      onClick={() => setAccountOpen(false)}
                      onMouseEnter={() => prefetchRoute(localizePath("/profile"))}
                      onFocus={() => prefetchRoute(localizePath("/profile"))}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isLinkActive(localizePath("/profile"))
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-950 dark:hover:text-white"
                      }`}
                    >
                      <User size={15} className="text-gray-500 dark:text-gray-400" />
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
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-950 dark:hover:text-white"
                        }`}
                      >
                        <ShieldCheck size={15} className="text-emerald-700 dark:text-emerald-400" />
                        <span>{t("nav.admin")}</span>
                      </Link>
                    )}

                    <div className="border-t border-gray-100 dark:border-white/10 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
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
          className="lg:hidden p-2 text-gray-700 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white rounded-lg"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={t("nav.toggleMenu")}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="lg:hidden bg-white/98 dark:bg-[#0e1512]/98 backdrop-blur-2xl border-b border-gray-200/80 dark:border-white/10 p-5 flex flex-col gap-3 absolute top-full left-0 w-full z-40 shadow-xl rounded-b-3xl">
          <Link
            to={localizePath("/")}
            className={`font-semibold text-sm py-2 px-3 rounded-xl ${
              isLinkActive(localizePath("/"))
                ? "bg-gray-100 dark:bg-white/15 text-gray-950 dark:text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
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
              className={`w-full flex items-center justify-between font-semibold text-sm py-2 px-3 rounded-xl cursor-pointer ${
                pathname.includes("/faq/") && pathname !== localizePath("/faq")
                  ? "bg-gray-100 dark:bg-white/15 text-gray-950 dark:text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
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
                    className="block py-2 px-3 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
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
            className={`font-semibold text-sm py-2 px-3 rounded-xl ${
              isLinkActive(localizePath("/faq"))
                ? "bg-gray-100 dark:bg-white/15 text-gray-950 dark:text-white"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
            }`}
            onClick={() => setIsOpen(false)}
          >
            {t("nav.faq")}
          </Link>

          <Link
            to={localizePath("/quote")}
            className="rounded-full px-5 py-2.5 text-center text-sm font-semibold bg-[#133827] dark:bg-emerald-600 text-white hover:bg-[#0f2d1f] dark:hover:bg-emerald-500 shadow-xs"
            onClick={() => setIsOpen(false)}
          >
            {t("nav.instantQuote")}
          </Link>

          {/* Mobile Authenticated Routes */}
          {isLoggedIn && (
            <div className="nav-auth-only flex flex-col gap-1 border-t border-gray-100 dark:border-white/10 pt-3">
              <Link
                to={localizePath("/orders")}
                className={`font-semibold text-sm py-2 px-3 rounded-xl flex items-center gap-2 ${
                  isLinkActive(localizePath("/orders"))
                    ? "bg-gray-100 dark:bg-white/15 text-gray-950 dark:text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Package size={16} />
                <span>{t("nav.myOrders")}</span>
              </Link>
              <Link
                to={localizePath("/profile")}
                className={`font-semibold text-sm py-2 px-3 rounded-xl flex items-center gap-2 ${
                  isLinkActive(localizePath("/profile"))
                    ? "bg-gray-100 dark:bg-white/15 text-gray-950 dark:text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <User size={16} />
                <span>{t("nav.myProfile")}</span>
              </Link>
              {userRole === "admin" && (
                <Link
                  to={localizePath("/admin")}
                  className={`font-semibold text-sm py-2 px-3 rounded-xl flex items-center gap-2 ${
                    isLinkActive(localizePath("/admin"))
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <ShieldCheck size={16} className="text-emerald-700 dark:text-emerald-400" />
                  <span>{t("nav.admin")}</span>
                </Link>
              )}
            </div>
          )}

          <hr className="border-gray-100 dark:border-white/10" />

          {/* Mobile Theme & Language Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-full w-fit">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  onClick={() => setLanguage(option.code)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    language === option.code
                      ? "bg-white text-gray-950 dark:bg-emerald-500 dark:text-white shadow-2xs font-bold"
                      : "text-gray-700 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <ThemeToggle showDropdown />
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
              className="w-full px-5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={16} />
              <span>{t("nav.logOut")}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
