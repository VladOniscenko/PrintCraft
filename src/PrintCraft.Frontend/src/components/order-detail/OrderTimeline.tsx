import {
  CheckCircle2,
  Clock,
  FileText,
  Truck,
  Printer,
  PackageCheck,
  Ban,
  PauseCircle,
  Undo2
} from "lucide-react";
import type { ReactNode } from "react";
import {
  isExceptionState,
  getOrderTerminalState,
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
  
  const isException = isExceptionState(currentStatus);
  const terminalState = getOrderTerminalState(currentStatus);

  // We map the 6 primary states
  const steps = [
    { step: 1, title: t("orderStatus.quote_requested"), icon: <FileText size={16} /> },
    { step: 2, title: t("orderStatus.awaiting_payment"), icon: <Clock size={16} /> },
    { step: 3, title: t("orderStatus.ready_to_print"), icon: <CheckCircle2 size={16} /> },
    { step: 4, title: t("orderStatus.printing"), icon: <Printer size={16} /> },
    { step: 5, title: t("orderStatus.post_processing"), icon: <PackageCheck size={16} /> },
    { step: 6, title: t("orderStatus.shipped"), icon: <Truck size={16} /> },
  ];

  return (
    <div className="bg-white dark:bg-[#0e1512] rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-white/10 shadow-xs">
      <h3 className="font-bold text-xl sm:text-2xl text-gray-900 dark:text-white tracking-tight mb-8">
        {t("orderDetail.timeline")}
      </h3>

      {isException && (
        <div className={`mb-8 p-4 rounded-2xl border flex gap-3.5 items-start ${
          terminalState === 'on_hold' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200' :
          'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200'
        }`}>
          {terminalState === 'on_hold' ? <PauseCircle className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" /> :
           terminalState === 'returned' ? <Undo2 className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" /> :
           <Ban className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />}
          <div>
            <h4 className="font-bold text-sm">
              {terminalState === 'on_hold' ? t("orderDetail.onHoldTitle") :
               terminalState === 'returned' ? t("orderDetail.returnedTitle") :
               t("orderDetail.cancelledTitle")}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              {terminalState === 'on_hold' ? t("orderDetail.onHoldDesc") :
               terminalState === 'returned' ? t("orderDetail.returnedDesc") :
               t("orderDetail.cancelledDesc")}
            </p>
          </div>
        </div>
      )}

      <div
        className={`space-y-8 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 ${
          isException ? "before:bg-rose-200 dark:before:bg-rose-900/60" : "before:bg-gray-200 dark:before:bg-white/10"
        }`}
      >
        {steps.map((s) => {
          // If we hit an exception, we stop highlighting future steps
          const isActive = !isException ? statusStep >= s.step : statusStep > s.step;
          const isCurrentExceptionStep = isException && statusStep === s.step;

          return (
            <TimelineItem
              key={s.step}
              icon={isCurrentExceptionStep ? getExceptionIcon(terminalState) : s.icon}
              title={s.title}
              date={isActive || isCurrentExceptionStep ? reachedDate : t("orderDetail.pending")}
              active={isActive}
              tone={isCurrentExceptionStep ? "danger" : "default"}
              isException={isCurrentExceptionStep}
            />
          );
        })}
      </div>
    </div>
  );
}

function getExceptionIcon(terminalState: string | null) {
  if (terminalState === "on_hold") return <PauseCircle size={16} />;
  if (terminalState === "returned") return <Undo2 size={16} />;
  return <Ban size={16} />;
}

interface TimelineItemProps {
  icon: ReactNode;
  title: string;
  date: string;
  active: boolean;
  tone?: "default" | "danger";
  isException?: boolean;
}

function TimelineItem({
  icon,
  title,
  date,
  active,
  tone = "default",
  isException = false,
}: TimelineItemProps) {
  const activeIconClass =
    tone === "danger"
      ? "bg-rose-600 text-white border-rose-100 dark:border-rose-900/60"
      : "bg-emerald-600 text-white border-emerald-50 dark:border-emerald-900/60";

  const activeTextClass =
    tone === "danger" ? "text-rose-800 dark:text-rose-300" : "text-gray-900 dark:text-white";

  const containerClass = isException || active ? activeIconClass : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 border-white dark:border-[#0e1512]";

  return (
    <div className="relative flex items-center gap-6">
      <div
        className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 shadow-sm transition-colors ${containerClass}`}
      >
        {icon}
      </div>
      <div>
        <p
          className={`font-bold text-sm ${isException || active ? activeTextClass : "text-gray-400 dark:text-gray-500"}`}
        >
          {title}
        </p>
        <p className={`text-xs ${isException || active ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"}`}>{date}</p>
      </div>
    </div>
  );
}
