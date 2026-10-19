import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type NotifyType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: NotifyType;
  message: string;
};

type NotifyContextValue = {
  notify: (type: NotifyType, message: string, durationMs?: number) => void;
  notifySuccess: (message: string, durationMs?: number) => void;
  notifyError: (message: string, durationMs?: number) => void;
  notifyInfo: (message: string, durationMs?: number) => void;
};

const NotifyContext = createContext<NotifyContextValue | null>(null);

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (type: NotifyType, message: string, durationMs = 3000) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  const value = useMemo<NotifyContextValue>(
    () => ({
      notify,
      notifySuccess: (message, durationMs) =>
        notify("success", message, durationMs),
      notifyError: (message, durationMs) =>
        notify("error", message, durationMs),
      notifyInfo: (message, durationMs) => notify("info", message, durationMs),
    }),
    [notify],
  );

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const bgClass =
            toast.type === "success"
              ? "bg-emerald-600"
              : toast.type === "error"
                ? "bg-red-600"
                : "bg-slate-700";

          return (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${bgClass}`}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const context = useContext(NotifyContext);
  if (!context) {
    throw new Error("useNotify must be used within NotifyProvider");
  }
  return context;
}
