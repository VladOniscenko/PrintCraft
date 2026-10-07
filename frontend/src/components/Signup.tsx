import React, { useState } from "react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Printer,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./logos/Logo";
import api from "../services/api"; // Your axios instance
import { useI18n } from "../i18n/I18nContext";

export default function Signup() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Send data to .NET AuthRoute
      await api.post("/auth/register", {
        name: name,
        email: email,
        password: password,
      });

      // 2. Show success state
      setIsSuccess(true);

      // 3. Wait 2 seconds then go to login
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Signup error", err);
      // Show specific error message from API if available
      setError(err.response?.data || t("signup.error.default"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          <Logo />

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t("signup.title")}
          </h2>
          <p className="text-gray-500 mb-8">{t("signup.subtitle")}</p>

          {/* Success State */}
          {isSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2 text-sm">
              <CheckCircle2 size={18} />
              {t("signup.success")}
            </div>
          )}

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
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("signup.name")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all sm:text-sm"
                  placeholder={t("signup.namePlaceholder")}
                />
              </div>
            </div>

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
                  name="email"
                  type="email"
                  autoComplete="username"
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
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all sm:text-sm"
                  placeholder={t("signup.passwordPlaceholder")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSuccess}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#133827] hover:bg-[#1c4d37] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors mt-6 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {t("signup.submit")} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            {t("signup.haveAccount")}{" "}
            <Link
              to="/login"
              className="font-semibold text-emerald-700 hover:text-emerald-600 transition-colors"
            >
              {t("signup.signIn")}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#133827] relative overflow-hidden items-center justify-center">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/40 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center px-12 text-white">
          <div className="bg-white/10 p-6 rounded-3xl inline-block mb-8 backdrop-blur-sm border border-white/20">
            <Printer size={64} className="text-emerald-400" />
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            {t("signup.visualTitle")}
          </h2>
          <p className="text-emerald-100/80 text-lg max-w-md mx-auto">
            {t("signup.visualDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
