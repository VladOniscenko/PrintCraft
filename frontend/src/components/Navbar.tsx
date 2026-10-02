import { useState, useEffect } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./logos/Logo";
import { useI18n } from "../i18n/I18nContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, language, setLanguage, languageOptions } = useI18n();

  // Check if user is logged in on mount and whenever the component updates
  useEffect(() => {
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
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/");
  };

  const navLinks: Array<{ name: string; path: string }> = [];

  // If logged in, add "My Orders" and admin dashboard (for admins) to the navigation
  const visibleLinks = isLoggedIn
    ? [
        ...navLinks,
        { name: t("nav.myOrders"), path: "/orders" },
        { name: t("nav.myProfile"), path: "/profile" },
        ...(userRole === "admin"
          ? [{ name: t("nav.admin"), path: "/admin" }]
          : []),
      ]
    : navLinks;

  return (
    <nav className="site-navbar px-5 py-3.5 flex items-center justify-between">
      <Logo className="scale-[0.98]" />

      {/* Desktop Links */}
      <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-600">
        {visibleLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`rounded-lg px-3 py-2 transition-colors ${
              pathname === link.path || pathname.startsWith(`${link.path}/`)
                ? "bg-[#ecf6f2] text-[#0f766e]"
                : "text-[#445852] hover:bg-[#f3faf7] hover:text-[#0f766e]"
            }`}
          >
            {link.name}
          </Link>
        ))}
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
            <Link to="/login" className="site-btn-soft">
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
          {visibleLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`font-medium py-2 px-2 rounded-lg ${
                pathname === link.path || pathname.startsWith(`${link.path}/`)
                  ? "bg-[#ecf6f2] text-[#0f766e]"
                  : "text-[#3d534c]"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
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
              to="/login"
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
