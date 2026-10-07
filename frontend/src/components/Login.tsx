import React, { useState } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  Printer,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./logos/Logo";
import api from "../services/api"; // Import your axios service
import { useI18n } from "../i18n/I18nContext";

export default function Login() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Send login request to .NET API
      const response = await api.post("/auth/login", {
        email: email,
        password: password,
      });

      // 2. Save the token and user info to localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // 3. Redirect to destination, checkout if draft exists, or orders
      const fromPath = (location.state as any)?.from?.pathname;
      const target =
        fromPath && fromPath !== "/login" && fromPath !== "/quote"
          ? fromPath
          : localStorage.getItem("printcraft-home-quote")
            ? "/checkout"
            : "/orders";
      navigate(target, { replace: true });
    } catch (err: any) {
      console.error("Login error", err);
      setError(t("login.error.invalid"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24">
        <div className="max-w-md w-full mx-auto">
          <Logo />

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t("login.welcome")}
          </h2>
          <p className="text-gray-500 mb-8">{t("login.subtitle")}</p>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("login.email")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all sm:text-sm"
                  placeholder={t("login.emailPlaceholder")}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("login.password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all sm:text-sm"
                  placeholder={t("login.passwordPlaceholder")}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  {t("login.remember")}
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-emerald-700 hover:text-emerald-600"
              >
                {t("login.forgot")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#133827] hover:bg-[#1c4d37] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors mt-6 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {t("login.signIn")} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            {t("login.noAccount")}{" "}
            <Link
              to="/signup"
              className="font-semibold text-emerald-700 hover:text-emerald-600 transition-colors"
            >
              {t("login.signUpFree")}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#133827] relative overflow-hidden items-center justify-center">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/40 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center px-12 text-white">
          <div className="bg-white/10 p-6 rounded-3xl inline-block mb-8 backdrop-blur-sm border border-white/20">
            <Printer size={64} className="text-emerald-400" />
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            {t("login.visualTitle1")}
            <br />
            {t("login.visualTitle2")}
          </h2>
          <p className="text-emerald-100/80 text-lg max-w-md mx-auto">
            {t("login.visualDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
