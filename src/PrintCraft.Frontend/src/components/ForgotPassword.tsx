import { useState } from "react";
import {
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import api from "../services/api";
import { useI18n } from "../i18n/I18nContext";

export default function ForgotPassword() {
  const { t, localizePath } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      console.error(err);
      setError(t("forgot.errorMessage"));
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
            {t("forgot.title")}
          </h1>
          <p className="site-subheading mb-6">{t("forgot.subtitle")}</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {sent ? (
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 size={18} />
              {t("forgot.successMessage")}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-[#2a403a]">
                  {t("forgot.emailLabel")}
                </span>
                <div className="relative mt-1">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8f89]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#d4e3dd] bg-white px-10 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder={t("forgot.emailPlaceholder")}
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
                    <span>{t("forgot.submitButton")}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-[#5f726c]">
            {t("forgot.rememberPassword")}{" "}
            <Link
              to={localizePath("/login")}
              className="font-semibold text-[#0f766e] hover:underline"
            >
              {t("forgot.signIn")}
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
