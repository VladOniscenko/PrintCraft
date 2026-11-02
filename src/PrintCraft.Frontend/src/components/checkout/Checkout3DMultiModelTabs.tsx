import { Plus, Trash2, Box } from "lucide-react";
import type { OrderItem } from "../../types";
import { useI18n } from "../../i18n/I18nContext";

interface Checkout3DMultiModelTabsProps {
  items: OrderItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onRemoveIndex: (index: number) => void;
  onAddNewModel: () => void;
  maxItems?: number;
}

export default function Checkout3DMultiModelTabs({
  items,
  activeIndex,
  onSelectIndex,
  onRemoveIndex,
  onAddNewModel,
  maxItems = 8,
}: Checkout3DMultiModelTabsProps) {
  const { t } = useI18n();

  if (items.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4">
      {items.map((item, idx) => {
        const isActive = activeIndex === idx;
        const displayName =
          item.fileName ||
          t("quote.modelNumberBadge", { number: idx + 1 });

        return (
          <div
            key={idx}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border cursor-pointer ${
              isActive
                ? "bg-white dark:bg-[#141e1a] text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700 shadow-2xs"
                : "bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-white/10 hover:bg-gray-200/60"
            }`}
            onClick={() => onSelectIndex(idx)}
          >
            <Box size={13} className={isActive ? "text-sky-600 dark:text-sky-400" : "text-gray-400"} />
            <span className="max-w-[130px] truncate">{displayName}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 dark:bg-white/10 text-gray-500">
              ×{item.count}
            </span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveIndex(idx);
                }}
                className="p-0.5 rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title={t("quote.removeFile")}
                aria-label={t("quote.removeFile")}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        );
      })}

      {items.length < maxItems && (
        <button
          type="button"
          onClick={onAddNewModel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-400 hover:text-sky-600 hover:border-sky-400 transition-colors shrink-0"
        >
          <Plus size={13} />
          <span>{t("quote.addAnotherModelBtn")}</span>
        </button>
      )}
    </div>
  );
}

