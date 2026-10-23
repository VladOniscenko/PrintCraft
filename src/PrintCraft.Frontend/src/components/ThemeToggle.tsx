import { useState, useRef, useEffect } from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme, type Theme } from "../theme/ThemeContext";
import { useI18n } from "../i18n/I18nContext";

interface ThemeToggleProps {
  className?: string;
  showDropdown?: boolean;
}

export default function ThemeToggle({
  className = "",
  showDropdown = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener("pointerdown", handleOutsideClick);
    return () => window.removeEventListener("pointerdown", handleOutsideClick);
  }, [isOpen]);

  const options: { id: Theme; labelKey: "common.themeLight" | "common.themeDark" | "common.themeSystem"; icon: typeof Sun }[] = [
    { id: "light", labelKey: "common.themeLight", icon: Sun },
    { id: "dark", labelKey: "common.themeDark", icon: Moon },
    { id: "system", labelKey: "common.themeSystem", icon: Laptop },
  ];

  if (!showDropdown) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={t("common.toggleTheme")}
        title={t(resolvedTheme === "dark" ? "common.themeLight" : "common.themeDark")}
        className={`p-2 rounded-full transition-all cursor-pointer text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/10 active:scale-95 ${className}`}
      >
        {resolvedTheme === "dark" ? (
          <Sun size={17} className="transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Moon size={17} className="transition-transform duration-200 rotate-0 scale-100" />
        )}
      </button>
    );
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t("common.toggleTheme")}
        aria-expanded={isOpen}
        className="flex items-center gap-2 p-2 rounded-full transition-all cursor-pointer text-gray-700 hover:text-gray-950 dark:text-gray-200 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10"
      >
        {resolvedTheme === "dark" ? (
          <Sun size={17} />
        ) : (
          <Moon size={17} />
        )}
        <span className="text-xs font-semibold">
          {t(
            theme === "system"
              ? "common.themeSystem"
              : theme === "dark"
                ? "common.themeDark"
                : "common.themeLight",
          )}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white/95 dark:bg-[#111815]/95 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xl p-1.5 z-50 space-y-0.5">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-white/10 hover:text-gray-950 dark:hover:text-white"
                }`}
              >
                <Icon size={15} />
                <span>{t(opt.labelKey)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

