import { useRef, useState } from "react";
import { Check, FileUp, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useI18n } from "../../i18n/I18nContext";
import { detectModelDimensions } from "../../utils/modelDimensions";

type AuthMode = "login" | "register";
type Draft = {
  fileUrl?: string;
  fileName: string;
  description?: string;
  material: string;
  color?: string;
  quoteToken?: string;
  dimensionBaseX?: number;
  dimensionBaseY?: number;
  dimensionBaseZ?: number;
  dimensionX?: number;
  dimensionY?: number;
  dimensionZ?: number;
  scaleFactor?: number;
};

const DRAFT_KEY = "printcraft-home-quote";
const materials = [
  { id: "PLA", label: "PLA", detail: "home.quickQuote.pla" },
  { id: "PETG", label: "PETG", detail: "home.quickQuote.petg" },
  { id: "TPU", label: "TPU", detail: "home.quickQuote.tpu" },
];

export default function QuickQuoteFlow() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Draft | null>(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [entryMode, setEntryMode] = useState<"file" | "description">("file");
  const [description, setDescription] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const selectFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setAuthError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const [uploadResponse, dims] = await Promise.all([
        api.post("/upload", form),
        detectModelDimensions(file).catch(() => null),
      ]);
      const fileUrl = uploadResponse.data.url;
      const draftResponse = await api.post("/quote-drafts", {
        fileUrl,
        fileName: file.name,
        description: "",
        material: "PLA",
      });
      const nextDraft: Draft = {
        fileUrl,
        fileName: file.name,
        material: "PLA",
        color: "Black",
        quoteToken: draftResponse.data.quoteToken,
        scaleFactor: 1.0,
        dimensionBaseX: dims?.x,
        dimensionBaseY: dims?.y,
        dimensionBaseZ: dims?.z,
        dimensionX: dims?.x,
        dimensionY: dims?.y,
        dimensionZ: dims?.z,
      };
      setDraft(nextDraft);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
    } catch {
      setAuthError(t("home.quickQuote.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const submitDescription = async () => {
    if (description.trim().length < 10) {
      setAuthError(t("home.quickQuote.descriptionTooShort"));
      return;
    }
    setUploading(true);
    try {
      const response = await api.post("/quote-drafts", {
        fileUrl: "",
        fileName: "",
        description: description.trim(),
        material: "PLA",
      });
      const nextDraft: Draft = {
        fileName: t("home.quickQuote.descriptionFile"),
        description: description.trim(),
        material: "PLA",
        color: "Black",
        quoteToken: response.data.quoteToken,
      };
      setDraft(nextDraft);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
    } catch {
      setAuthError(t("home.quickQuote.saveFailed"));
    } finally {
      setUploading(false);
    }
  };

  const changeMaterial = (material: string) => {
    if (!draft) return;
    const nextDraft = { ...draft, material };
    setDraft(nextDraft);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
  };

  const continueToOrder = () => {
    navigate("/checkout");
  };

  const authenticate = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError("");
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const body =
        authMode === "login" ? { email, password } : { name, email, password };
      const response = await api.post(endpoint, body);
      if (authMode === "register") {
        const login = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", login.data.token);
        localStorage.setItem("user", JSON.stringify(login.data.user));
      } else {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      if (draft?.quoteToken) {
        await api.post("/quote-drafts/redeem", {
          quoteToken: draft.quoteToken,
        });
      }
      setAuthOpen(false);
      navigate("/checkout");
    } catch {
      setAuthError(
        authMode === "login"
          ? t("home.quickQuote.loginFailed")
          : t("home.quickQuote.registerFailed"),
      );
    }
  };

  return (
    <div className="mt-8 max-w-xl rounded-2xl border border-white/20 bg-black/20 p-4 backdrop-blur-md">
      {!draft ? (
        <>
          <div className="mb-3 flex gap-2 rounded-lg bg-white/10 p-1 text-sm">
            <button
              type="button"
              onClick={() => setEntryMode("file")}
              className={`flex-1 rounded-md px-3 py-2 font-bold ${entryMode === "file" ? "bg-white text-emerald-950" : "text-white/70"}`}
            >
              {t("home.quickQuote.fileMode")}
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("description")}
              className={`flex-1 rounded-md px-3 py-2 font-bold ${entryMode === "description" ? "bg-white text-emerald-950" : "text-white/70"}`}
            >
              {t("home.quickQuote.ideaMode")}
            </button>
          </div>
          {entryMode === "file" ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void selectFile(event.dataTransfer.files[0]);
              }}
              className={`flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed px-5 py-6 text-left transition ${dragging ? "border-amber-300 bg-white/15" : "border-white/35 bg-white/5 hover:bg-white/10"}`}
            >
              {uploading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <FileUp size={24} />
              )}
              <span>
                <strong className="block">
                  {t("home.quickQuote.dropTitle")}
                </strong>
                <small className="text-white/65">
                  {t("home.quickQuote.dropHint")}
                </small>
              </span>
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={description}
                minLength={10}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setAuthError("");
                }}
                placeholder={t("home.quickQuote.descriptionPlaceholder")}
                className="min-h-28 w-full rounded-xl border border-white/25 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-amber-300"
              />
              {authError && <p className="text-sm text-red-200">{authError}</p>}
              <button
                type="button"
                onClick={() => void submitDescription()}
                disabled={uploading}
                className="w-full rounded-xl bg-amber-300 px-4 py-3 font-bold text-emerald-950 disabled:opacity-60"
              >
                {uploading
                  ? t("home.quickQuote.saving")
                  : t("home.quickQuote.startRequest")}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Check className="shrink-0 text-emerald-300" size={20} />
              <div className="min-w-0">
                <span className="truncate text-sm font-semibold block">
                  {draft.fileName}
                </span>
                {draft.dimensionBaseX && draft.dimensionBaseY && draft.dimensionBaseZ && (
                  <span className="text-xs text-emerald-300/80 font-medium">
                    {draft.dimensionBaseX} × {draft.dimensionBaseY} × {draft.dimensionBaseZ} mm
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                localStorage.removeItem(DRAFT_KEY);
              }}
              aria-label={t("home.quickQuote.removeFile")}
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {materials.map((material) => (
              <button
                key={material.id}
                type="button"
                onClick={() => changeMaterial(material.id)}
                className={`rounded-lg border p-2 text-left ${draft.material === material.id ? "border-amber-300 bg-amber-300/20" : "border-white/20 bg-white/5"}`}
              >
                <strong className="block text-sm">{material.label}</strong>
                <small className="text-white/60">{t(material.detail)}</small>
              </button>
            ))}
          </div>
          <div className="border-t border-white/15 pt-3">
            {draft.description && (
              <p className="mb-3 text-sm text-white/75">{draft.description}</p>
            )}
            <button
              type="button"
              onClick={continueToOrder}
              className="rounded-xl bg-amber-300 px-4 py-3 font-bold text-emerald-950 hover:bg-amber-200"
            >
              {t("home.quickQuote.continue")}
            </button>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".stl,.obj,.3mf,.step,.stp"
        className="hidden"
        onChange={(event) => void selectFile(event.target.files?.[0])}
      />
      {authOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={authenticate}
            className="w-full max-w-md rounded-2xl bg-white p-6 text-gray-900 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  {t("home.quickQuote.almostReady")}
                </h2>
                <p className="text-sm text-gray-500">
                  {t("home.quickQuote.preserved")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuthOpen(false)}
                aria-label={t("home.quickQuote.close")}
              >
                <X />
              </button>
            </div>
            {authMode === "register" && (
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("home.quickQuote.name")}
                className="mb-3 w-full rounded-lg border p-3"
              />
            )}
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("home.quickQuote.email")}
              className="mb-3 w-full rounded-lg border p-3"
            />
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("home.quickQuote.password")}
              className="mb-3 w-full rounded-lg border p-3"
            />
            {authError && (
              <p className="mb-3 text-sm text-red-600">{authError}</p>
            )}
            <button className="w-full rounded-lg bg-emerald-800 p-3 font-bold text-white">
              {authMode === "login"
                ? t("home.quickQuote.loginContinue")
                : t("home.quickQuote.registerContinue")}
            </button>
            <button
              type="button"
              onClick={() =>
                setAuthMode(authMode === "login" ? "register" : "login")
              }
              className="mt-3 w-full text-sm font-semibold text-emerald-800 underline"
            >
              {authMode === "login"
                ? t("home.quickQuote.switchRegister")
                : t("home.quickQuote.switchLogin")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
