import { useMemo, useState } from "react";
import {
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import api from "../services/api";
import { useI18n } from "../i18n/I18nContext";

export default function ResetPassword() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(t("reset.tokenMissing"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("reset.passwordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("reset.passwordsMismatch"));
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      setDone(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || t("reset.resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="site-shell flex flex-col">
      <Navbar />
      <main className="site-main max-w-xl px-4 sm:px-6 py-12 flex-grow">
        <section className="site-card p-7 sm:p-9">
          <h1 className="site-heading text-3xl font-bold mb-2">
            {t("reset.title")}
          </h1>
          <p className="site-subheading mb-6">{t("reset.subtitle")}</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {done ? (
            <div className="space-y-5">
              <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2">
                <CheckCircle2 size={18} /> {t("reset.successMessage")}
              </div>
              <Link to="/login" className="site-btn-primary inline-flex">
                {t("reset.goToLogin")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-[#2a403a]">
                  {t("login.password")}
                </span>
                <div className="relative mt-1">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8f89]"
                  />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#d4e3dd] bg-white px-10 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={t("reset.passwordPlaceholder")}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#2a403a]">
                  {t("login.password")}
                </span>
                <div className="relative mt-1">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8f89]"
                  />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#d4e3dd] bg-white px-10 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={t("reset.confirmPlaceholder")}
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="site-btn-primary gap-2 w-full py-3"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <span>{t("reset.submitButton")}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
