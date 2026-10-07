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
   
}: OrderTimelineProps) {
  
  const isException = isExceptionState(currentStatus);
  const terminalState = getOrderTerminalState(currentStatus);

  // We map the 6 primary states
  const steps = [
    { step: 1, title: "Quote Requested", icon: <FileText size={16} /> },
    { step: 2, title: "Awaiting Payment", icon: <Clock size={16} /> },
    { step: 3, title: "Ready to Print", icon: <CheckCircle2 size={16} /> },
    { step: 4, title: "Printing", icon: <Printer size={16} /> },
    { step: 5, title: "Post-Processing", icon: <PackageCheck size={16} /> },
    { step: 6, title: "Shipped", icon: <Truck size={16} /> },
  ];

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
      <h3 className="font-bold text-lg mb-8">Order Tracker</h3>

      {isException && (
        <div className={`mb-8 p-4 rounded-xl border flex gap-3 items-start ${
          terminalState === 'on_hold' ? 'bg-orange-50 border-orange-200 text-orange-900' :
          'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {terminalState === 'on_hold' ? <PauseCircle className="shrink-0 mt-0.5 text-orange-600" /> :
           terminalState === 'returned' ? <Undo2 className="shrink-0 mt-0.5 text-rose-600" /> :
           <Ban className="shrink-0 mt-0.5 text-rose-600" />}
          <div>
            <h4 className="font-bold">
              {terminalState === 'on_hold' ? 'Order On Hold' :
               terminalState === 'returned' ? 'Order Returned' :
               'Order Cancelled'}
            </h4>
            <p className="text-sm mt-1">
              {terminalState === 'on_hold' ? 'Production is paused. We will contact you if more information is needed.' :
               terminalState === 'returned' ? 'This order has been returned to us.' :
               'This order has been cancelled. Please check your email for refund details if you have already paid.'}
            </p>
          </div>
        </div>
      )}

      <div
        className={`space-y-8 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 ${
          isException ? "before:bg-rose-200" : "before:bg-gray-100"
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
              date={isActive || isCurrentExceptionStep ? reachedDate : "Pending"}
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
      ? "bg-rose-600 text-white border-rose-100"
      : "bg-emerald-600 text-white border-emerald-50";

  const activeTextClass =
    tone === "danger" ? "text-rose-800" : "text-gray-900";

  const containerClass = isException || active ? activeIconClass : "bg-gray-100 text-gray-400 border-white";

  return (
    <div className="relative flex items-center gap-6">
      <div
        className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 shadow-sm transition-colors ${containerClass}`}
      >
        {icon}
      </div>
      <div>
        <p
          className={`font-bold text-sm ${isException || active ? activeTextClass : "text-gray-400"}`}
        >
          {title}
        </p>
        <p className={`text-xs ${isException || active ? "text-gray-500" : "text-gray-400"}`}>{date}</p>
      </div>
    </div>
  );
}
