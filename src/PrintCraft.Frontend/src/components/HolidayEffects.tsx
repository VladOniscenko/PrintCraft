import { memo, useMemo } from "react";
import type { HolidayEffect } from "../config/holidayConfig";

export interface HolidayEffectsProps {
  effect?: HolidayEffect | null;
  className?: string;
}

const CONFETTI_COLORS = [
  "bg-amber-400",
  "bg-orange-500",
  "bg-rose-500",
  "bg-teal-400",
  "bg-blue-400",
  "bg-yellow-300",
  "bg-emerald-400",
  "bg-white/90",
];

const HEART_COLORS = [
  "text-pink-400/80",
  "text-rose-400/85",
  "text-red-400/75",
  "text-pink-300/80",
  "text-purple-300/70",
];

const BLOSSOM_COLORS = [
  "text-pink-300/85",
  "text-rose-200/90",
  "text-pink-200/80",
  "text-rose-300/75",
  "text-white/85",
  "text-pink-100/90",
];

const PAW_COLORS = [
  "text-amber-400/50",
  "text-amber-300/40",
  "text-orange-400/45",
  "text-amber-200/40",
  "text-white/35",
];

function BatSvg() {
  return (
    <svg
      viewBox="0 0 64 36"
      className="w-full h-full fill-current filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M32 14c-2.5-4-7-8-14-8-7 0-14 5-18 13 4-1 9-1 13 1 2 1 4 3 5 6 3-3 8-5 14-5s11 2 14 5c1-3 3-5 5-6 4-2 9-2 13-1-4-8-11-13-18-13-7 0-11.5 4-14 8z" />
    </svg>
  );
}

function HeartSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full fill-current filter drop-shadow-[0_2px_6px_rgba(244,63,94,0.4)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function SnowflakeSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full fill-white/80 filter drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11 2v4.07a8.03 8.03 0 0 0-3.5 1.45L4.85 4.85 3.44 6.26l2.67 2.67A8.06 8.06 0 0 0 4.66 11H1v2h3.66c.26 1.05.8 2 1.45 2.82l-2.67 2.67 1.41 1.41 2.67-2.67A8.03 8.03 0 0 0 11 18.26V22h2v-3.74a8.03 8.03 0 0 0 3.5-1.45l2.67 2.67 1.41-1.41-2.67-2.67c.65-.82 1.19-1.77 1.45-2.82H23v-2h-3.64a8.06 8.06 0 0 0-1.45-2.07l2.67-2.67-1.41-1.41-2.67 2.67A8.03 8.03 0 0 0 13 6.07V2h-2z" />
    </svg>
  );
}

function BlossomPetalSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full fill-current filter drop-shadow-[0_2px_4px_rgba(244,114,182,0.35)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C10 5.5 6 8.5 6 13a6 6 0 0 0 12 0c0-4.5-4-7.5-6-11z" />
    </svg>
  );
}

function PawPrintSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-full h-full fill-current filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 11c-2.2 0-4 1.8-4 4 0 2 1.6 3.5 4 3.5s4-1.5 4-3.5c0-2.2-1.8-4-4-4z" />
      <circle cx="6.5" cy="9.5" r="1.8" />
      <circle cx="10" cy="6.5" r="1.8" />
      <circle cx="14" cy="6.5" r="1.8" />
      <circle cx="17.5" cy="9.5" r="1.8" />
    </svg>
  );
}

function HolidayEffectsComponent({
  effect,
  className = "",
}: HolidayEffectsProps) {
  const bats = useMemo(
    () => [
      { id: 1, left: "4%", top: "72%", delay: "0s", duration: "7.5s", scale: 0.7, flap: "0.22s" },
      { id: 2, left: "14%", top: "82%", delay: "1.8s", duration: "8.2s", scale: 0.9, flap: "0.26s" },
      { id: 3, left: "26%", top: "66%", delay: "3.4s", duration: "6.8s", scale: 0.65, flap: "0.2s" },
      { id: 4, left: "40%", top: "80%", delay: "0.9s", duration: "9s", scale: 0.85, flap: "0.25s" },
      { id: 5, left: "54%", top: "68%", delay: "2.6s", duration: "7.2s", scale: 0.75, flap: "0.23s" },
      { id: 6, left: "67%", top: "84%", delay: "4.1s", duration: "8.5s", scale: 1.0, flap: "0.28s" },
      { id: 7, left: "80%", top: "62%", delay: "1.3s", duration: "6.5s", scale: 0.6, flap: "0.19s" },
      { id: 8, left: "10%", top: "52%", delay: "5.0s", duration: "7.8s", scale: 0.8, flap: "0.24s" },
      { id: 9, left: "34%", top: "88%", delay: "2.1s", duration: "8.0s", scale: 0.7, flap: "0.21s" },
      { id: 10, left: "58%", top: "56%", delay: "4.7s", duration: "7.1s", scale: 0.95, flap: "0.27s" },
      { id: 11, left: "74%", top: "76%", delay: "3.0s", duration: "8.8s", scale: 0.65, flap: "0.2s" },
      { id: 12, left: "20%", top: "70%", delay: "5.8s", duration: "7.4s", scale: 0.85, flap: "0.23s" },
    ],
    []
  );

  const snow = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: `${(i * 3.7 + (i % 3) * 1.8) % 96 + 2}%`,
        delay: `${((i * 1.3) % 7).toFixed(1)}s`,
        duration: `${(5.5 + (i % 5) * 1.3).toFixed(1)}s`,
        isSvg: i % 4 === 0,
        size:
          i % 4 === 0
            ? "w-3 h-3"
            : i % 3 === 0
              ? "w-2 h-2 rounded-full bg-white/85 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
              : "w-1.5 h-1.5 rounded-full bg-white/70 shadow-[0_0_4px_rgba(255,255,255,0.5)]",
        opacity: 0.5 + (i % 5) * 0.1,
        swayDuration: `${(3.2 + (i % 3) * 0.8).toFixed(1)}s`,
      })),
    []
  );

  const confetti = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${(i * 3.3 + (i % 4) * 2.1) % 96 + 2}%`,
        delay: `${((i * 0.9) % 6).toFixed(1)}s`,
        duration: `${(4.8 + (i % 4) * 1.2).toFixed(1)}s`,
        colorClass: CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? "bg-amber-400",
        sizeClass:
          i % 3 === 0
            ? "w-2 h-3.5 rounded-sm"
            : i % 2 === 0
              ? "w-2.5 h-2 rounded-sm"
              : "w-1.5 h-3 rounded-full",
      })),
    []
  );

  const hearts = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${(i * 5.2 + (i % 3) * 3.1) % 94 + 3}%`,
        delay: `${((i * 1.1) % 7).toFixed(1)}s`,
        duration: `${(6.0 + (i % 4) * 1.4).toFixed(1)}s`,
        colorClass: HEART_COLORS[i % HEART_COLORS.length] ?? "text-pink-400/80",
        sizeClass: i % 3 === 0 ? "w-6 h-6" : i % 2 === 0 ? "w-5 h-5" : "w-4 h-4",
      })),
    []
  );

  const blossoms = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: `${(i * 4.4 + (i % 3) * 2.3) % 95 + 2}%`,
        delay: `${((i * 1.2) % 6.5).toFixed(1)}s`,
        duration: `${(5.8 + (i % 4) * 1.3).toFixed(1)}s`,
        colorClass: BLOSSOM_COLORS[i % BLOSSOM_COLORS.length] ?? "text-pink-300/85",
        sizeClass: i % 3 === 0 ? "w-5 h-5" : i % 2 === 0 ? "w-4 h-4" : "w-3.5 h-3.5",
        swayDuration: `${(3.0 + (i % 3) * 0.7).toFixed(1)}s`,
      })),
    []
  );

  const pawprints = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: `${(i * 6.1 + (i % 3) * 2.8) % 92 + 4}%`,
        delay: `${((i * 1.4) % 7).toFixed(1)}s`,
        duration: `${(6.5 + (i % 4) * 1.2).toFixed(1)}s`,
        colorClass: PAW_COLORS[i % PAW_COLORS.length] ?? "text-amber-400/50",
        sizeClass: i % 3 === 0 ? "w-7 h-7" : i % 2 === 0 ? "w-6 h-6" : "w-5 h-5",
      })),
    []
  );

  if (!effect || effect === "none") return null;

  return (
    <div
      className={`holiday-effect-layer absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes holiday-snow-fall {
          0% { transform: translateY(-24px); opacity: 0; }
          12% { opacity: 0.9; }
          88% { opacity: 0.9; }
          100% { transform: translateY(115vh); opacity: 0.15; }
        }
        @keyframes holiday-snow-sway {
          0%, 100% { margin-left: 0; }
          50% { margin-left: 22px; }
        }
        @keyframes holiday-confetti-fall {
          0% { transform: translateY(-20px) rotateX(0deg) rotateZ(0deg); opacity: 0.95; }
          100% { transform: translateY(115vh) rotateX(720deg) rotateZ(360deg); opacity: 0.55; }
        }
        @keyframes holiday-bat-flight {
          0% { transform: translate(0, 0) rotate(-10deg); opacity: 0; }
          15% { opacity: 0.75; }
          85% { opacity: 0.75; }
          100% { transform: translate(240px, -280px) rotate(16deg); opacity: 0; }
        }
        @keyframes holiday-bat-flap {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.35); }
        }
        @keyframes holiday-heart-float {
          0% { transform: translateY(115%) scale(0.65) rotate(-8deg); opacity: 0; }
          15% { opacity: 0.85; }
          85% { opacity: 0.8; }
          100% { transform: translateY(-25%) scale(1.1) rotate(14deg); opacity: 0; }
        }
        @keyframes holiday-blossom-fall {
          0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          12% { opacity: 0.85; }
          88% { opacity: 0.8; }
          100% { transform: translateY(115vh) translateX(55px) rotate(360deg); opacity: 0.2; }
        }
        @keyframes holiday-blossom-sway {
          0%, 100% { transform: rotateY(0deg) rotateZ(0deg); }
          50% { transform: rotateY(70deg) rotateZ(20deg); }
        }
        @keyframes holiday-paw-float {
          0% { transform: translateY(115%) rotate(-12deg) scale(0.7); opacity: 0; }
          15% { opacity: 0.65; }
          85% { opacity: 0.65; }
          100% { transform: translateY(-20%) rotate(12deg) scale(1.05); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .holiday-effect-layer {
            display: none !important;
          }
        }
      `}</style>

      {/* Bats Effect (Halloween) */}
      {effect === "bats" &&
        bats.map((b) => (
          <div
            key={b.id}
            className="absolute transform-gpu will-change-transform text-orange-950/70"
            style={{
              left: b.left,
              top: b.top,
              width: `${Math.round(44 * b.scale)}px`,
              height: `${Math.round(25 * b.scale)}px`,
              animation: `holiday-bat-flight ${b.duration} cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite`,
              animationDelay: b.delay,
            }}
          >
            <div
              className="w-full h-full transform-gpu"
              style={{
                animation: `holiday-bat-flap ${b.flap} ease-in-out infinite`,
              }}
            >
              <BatSvg />
            </div>
          </div>
        ))}

      {/* Snow Effect (Christmas) */}
      {effect === "snow" &&
        snow.map((s) => (
          <div
            key={s.id}
            className="absolute top-0 transform-gpu will-change-transform"
            style={{
              left: s.left,
              animation: `holiday-snow-fall ${s.duration} linear infinite`,
              animationDelay: s.delay,
            }}
          >
            <div
              className={`transform-gpu ${s.size}`}
              style={{
                opacity: s.opacity,
                animation: `holiday-snow-sway ${s.swayDuration} ease-in-out infinite`,
              }}
            >
              {s.isSvg && <SnowflakeSvg />}
            </div>
          </div>
        ))}

      {/* Confetti Effect (King's Day, New Year, Sinterklaas) */}
      {effect === "confetti" &&
        confetti.map((c) => (
          <div
            key={c.id}
            className={`absolute top-0 transform-gpu will-change-transform ${c.sizeClass} ${c.colorClass} shadow-sm`}
            style={{
              left: c.left,
              animation: `holiday-confetti-fall ${c.duration} cubic-bezier(0.37, 0, 0.63, 1) infinite`,
              animationDelay: c.delay,
            }}
          />
        ))}

      {/* Hearts Effect (Valentine's Day) */}
      {effect === "hearts" &&
        hearts.map((h) => (
          <div
            key={h.id}
            className={`absolute bottom-0 transform-gpu will-change-transform ${h.sizeClass} ${h.colorClass}`}
            style={{
              left: h.left,
              animation: `holiday-heart-float ${h.duration} cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite`,
              animationDelay: h.delay,
            }}
          >
            <HeartSvg />
          </div>
        ))}

      {/* Blossom Effect (Easter, Mother's Day) */}
      {effect === "blossom" &&
        blossoms.map((bl) => (
          <div
            key={bl.id}
            className="absolute top-0 transform-gpu will-change-transform"
            style={{
              left: bl.left,
              animation: `holiday-blossom-fall ${bl.duration} cubic-bezier(0.37, 0, 0.63, 1) infinite`,
              animationDelay: bl.delay,
            }}
          >
            <div
              className={`transform-gpu ${bl.sizeClass} ${bl.colorClass}`}
              style={{
                animation: `holiday-blossom-sway ${bl.swayDuration} ease-in-out infinite`,
              }}
            >
              <BlossomPetalSvg />
            </div>
          </div>
        ))}

      {/* Pawprints Effect (Animal Day) */}
      {effect === "pawprints" &&
        pawprints.map((p) => (
          <div
            key={p.id}
            className={`absolute bottom-0 transform-gpu will-change-transform ${p.sizeClass} ${p.colorClass}`}
            style={{
              left: p.left,
              animation: `holiday-paw-float ${p.duration} cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite`,
              animationDelay: p.delay,
            }}
          >
            <PawPrintSvg />
          </div>
        ))}
    </div>
  );
}

export const HolidayEffects = memo(HolidayEffectsComponent);
export default HolidayEffects;
