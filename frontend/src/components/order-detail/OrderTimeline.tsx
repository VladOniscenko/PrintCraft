import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Truck,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  getOrderStatusTranslationKey,
  getOrderTerminalState,
  normalizeOrderStatus,
} from "../../utils/orderStatus";
import type { TranslateFn } from "./types";

interface OrderTimelineProps {
  statusStep: number;
  currentStatus: string;
  reachedDate: string;
  t: TranslateFn;
}

export default function OrderTimeline({
  statusStep,
  currentStatus,
  reachedDate,
  t,
}: OrderTimelineProps) {
  const normalizedStatus = normalizeOrderStatus(currentStatus);
  const shippingKey =
    normalizedStatus === "shipped" || normalizedStatus === "sent"
      ? getOrderStatusTranslationKey(normalizedStatus)
      : "orderStatus.sent";
  const terminalState = getOrderTerminalState(currentStatus);
  const terminalTitle = terminalState
    ? t(getOrderStatusTranslationKey(terminalState) || "orderDetail.status")
    : null;

  const lineColor =
    terminalState === "failed" ? "before:bg-rose-300" : "before:bg-gray-100";

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
      <h3 className="font-bold text-lg mb-8">{t("orderDetail.timeline")}</h3>
      <div
        className={`space-y-8 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 ${lineColor}`}
      >
        <TimelineItem
          icon={<FileText size={16} />}
          title={t("orderDetail.quoteRequested")}
          date={statusStep >= 1 ? reachedDate : t("orderDetail.pending")}
          active={statusStep >= 1}
        />
        <TimelineItem
          icon={<Clock size={16} />}
          title={t("orderStatus.quoted")}
          date={statusStep >= 2 ? reachedDate : t("orderDetail.pending")}
          active={statusStep >= 2}
        />
        <TimelineItem
          icon={<CheckCircle2 size={16} />}
          title={t("orderStatus.paid")}
          date={statusStep >= 3 ? reachedDate : t("orderDetail.pending")}
          active={statusStep >= 3}
        />
        <TimelineItem
          icon={<Clock size={16} />}
          title={t("orderDetail.printing")}
          date={statusStep >= 4 ? reachedDate : t("orderDetail.pending")}
          active={statusStep >= 4}
        />
        <TimelineItem
          icon={<Truck size={16} />}
          title={t(shippingKey || "orderStatus.sent")}
          date={statusStep >= 5 ? reachedDate : t("orderDetail.pending")}
          active={statusStep >= 5}
        />
        {terminalState && terminalTitle && (
          <TimelineItem
            icon={<AlertTriangle size={16} />}
            title={terminalTitle}
            date={reachedDate}
            active
            tone="danger"
          />
        )}
      </div>
    </div>
  );
}

interface TimelineItemProps {
  icon: ReactNode;
  title: string;
  date: string;
  active: boolean;
  tone?: "default" | "danger";
}

function TimelineItem({
  icon,
  title,
  date,
  active,
  tone = "default",
}: TimelineItemProps) {
  const activeIconClass =
    tone === "danger" ? "bg-rose-600 text-white" : "bg-emerald-600 text-white";
  const activeTextClass = tone === "danger" ? "text-rose-800" : "text-gray-900";

  return (
    <div className="relative flex items-center gap-6">
      <div
        className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors ${active ? activeIconClass : "bg-gray-200 text-gray-400"}`}
      >
        {icon}
      </div>
      <div>
        <p
          className={`font-bold text-sm ${active ? activeTextClass : "text-gray-400"}`}
        >
          {title}
        </p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
    </div>
  );
}
