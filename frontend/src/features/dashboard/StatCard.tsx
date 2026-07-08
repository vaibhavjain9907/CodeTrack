/**
 * StatCard.
 *
 * Generic overview metric card. Used for total problems solved,
 * current streak, longest streak, and connected platform count.
 *
 * `size`, `footer` and `trend` are additive, backward-compatible
 * presentation props — every existing call site (label/value/icon/
 * suffix/accent) still works unchanged. `trend` is new in this pass:
 * it's intentionally optional and unused by every current caller,
 * because the summary endpoint doesn't return a comparison period to
 * compute a real trend from. The slot exists so a future payload
 * change (e.g. `total_problems_solved_delta`) only needs a prop
 * passed in, not a redesign.
 *
 * Numeric `value`s count up from 0 on mount/change via a small
 * requestAnimationFrame tween (see `useCountUp`) — string values (e.g.
 * "3 / 5") render instantly since there's no meaningful range to animate.
 */

import { type LucideIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { clsx } from "clsx";

type StatCardSize = "lg" | "md" | "sm";

interface StatCardTrend {
  direction: "up" | "down" | "flat";
  label: string;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  suffix?: string;
  accent?: "brand" | "success" | "warning";
  size?: StatCardSize;
  footer?: ReactNode;
  /** Optional — only render this if you have a real period-over-period
   * comparison. See file header. */
  trend?: StatCardTrend;
}

const accentText: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "text-brand-500 dark:text-brand-400",
  success: "text-success",
  warning: "text-warning",
};

const accentIconBg: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand-500/10 ring-1 ring-inset ring-brand-500/15 dark:bg-brand-400/10 dark:ring-brand-400/15",
  success: "bg-success/10 ring-1 ring-inset ring-success/15",
  warning: "bg-warning/10 ring-1 ring-inset ring-warning/15",
};

const accentGlow: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand-500/20 dark:bg-brand-400/20",
  success: "bg-success/20",
  warning: "bg-warning/20",
};

/** Faint corner-anchored radial wash, confined well within the card's own
 * border/shadow — depth, not a glow effect. */
const accentRadial: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand:
    "bg-[radial-gradient(circle_at_0%_0%,theme(colors.brand.500/8%),transparent_60%)] dark:bg-[radial-gradient(circle_at_0%_0%,theme(colors.brand.400/10%),transparent_60%)]",
  success:
    "bg-[radial-gradient(circle_at_0%_0%,theme(colors.success/8%),transparent_60%)]",
  warning:
    "bg-[radial-gradient(circle_at_0%_0%,theme(colors.warning/8%),transparent_60%)]",
};

const trendColor: Record<StatCardTrend["direction"], string> = {
  up: "text-success",
  down: "text-danger",
  flat: "text-surface-400 dark:text-surface-500",
};

const trendIcon: Record<StatCardTrend["direction"], LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const sizeConfig: Record<
  StatCardSize,
  {
    pad: string;
    value: string;
    label: string;
    iconBox: string;
    icon: string;
    gap: string;
    cornerIcon: string;
  }
> = {
  lg: {
    pad: "p-8 lg:p-10",
    value: "text-[46px] leading-[0.95] sm:text-[58px] lg:text-[66px]",
    label: "text-xs",
    iconBox: "h-11 w-11 rounded-2xl",
    icon: "h-5 w-5",
    gap: "mt-7",
    cornerIcon: "-bottom-5 -right-5 h-36 w-36 opacity-[0.035] dark:opacity-[0.05]",
  },
  md: {
    pad: "p-6 lg:p-7",
    value: "text-[34px] leading-none sm:text-[38px]",
    label: "text-xs",
    iconBox: "h-10 w-10 rounded-xl",
    icon: "h-4 w-4",
    gap: "mt-5",
    cornerIcon: "-bottom-3 -right-3 h-20 w-20 opacity-[0.03] dark:opacity-[0.045]",
  },
  sm: {
    pad: "p-5",
    value: "text-2xl leading-none",
    label: "text-[11px]",
    iconBox: "h-8 w-8 rounded-lg",
    icon: "h-3.5 w-3.5",
    gap: "mt-3",
    cornerIcon: "-bottom-2 -right-2 h-14 w-14 opacity-[0.03] dark:opacity-[0.04]",
  },
};

/** Counts up from the previous value to the next over ~650ms using a simple
 * eased requestAnimationFrame loop — no new dependency, and it degrades
 * gracefully (instant) under `prefers-reduced-motion` via the global CSS rule
 * in index.css that collapses animation/transition durations. */
function useCountUp(target: number, durationMs = 650): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return undefined;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = target;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

function AnimatedValue({ value }: { value: number | string }) {
  const isNumeric = typeof value === "number";
  const counted = useCountUp(isNumeric ? value : 0);
  return <>{isNumeric ? counted : value}</>;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  suffix,
  accent = "brand",
  size = "md",
  footer,
  trend,
}: StatCardProps) {
  const cfg = sizeConfig[size];
  const TrendIcon = trend ? trendIcon[trend.direction] : null;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={clsx(
        "group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900",
        "shadow-card transition-shadow duration-200 hover:shadow-lg dark:shadow-card-dark",
        cfg.pad,
      )}
    >
      {/* Soft corner-anchored depth wash — always faintly present, not a hover-only effect */}
      <div
        className={clsx("pointer-events-none absolute inset-0", accentRadial[accent])}
        aria-hidden="true"
      />

      {/* Quiet hover glow — off by default, fades in only on hover */}
      <div
        className={clsx(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100",
          accentGlow[accent],
        )}
        aria-hidden="true"
      />

      {/* Corner watermark icon — every size gets a quiet identity mark, scaled to weight */}
      <Icon
        className={clsx(
          "pointer-events-none absolute text-surface-900 dark:text-white",
          cfg.cornerIcon,
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span
            className={clsx(
              "font-semibold uppercase tracking-[0.08em] text-surface-400 dark:text-surface-500",
              cfg.label,
            )}
          >
            {label}
          </span>
          {trend && TrendIcon && (
            <span className={clsx("inline-flex items-center gap-1 text-xs font-medium", trendColor[trend.direction])}>
              <TrendIcon className="h-3 w-3" />
              {trend.label}
            </span>
          )}
        </div>

        <div
          className={clsx(
            "flex shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105",
            cfg.iconBox,
            accentIconBg[accent],
          )}
        >
          <Icon className={clsx(cfg.icon, accentText[accent])} />
        </div>
      </div>

      <p
        className={clsx(
          "relative flex items-baseline gap-2 font-mono font-semibold tabular-nums text-surface-900 dark:text-surface-50",
          cfg.value,
          cfg.gap,
        )}
      >
        <AnimatedValue value={value} />
        {suffix && (
          <span className="text-sm font-medium text-surface-400 dark:text-surface-500">
            {suffix}
          </span>
        )}
      </p>

      {footer && <div className="relative mt-auto pt-5">{footer}</div>}
    </motion.div>
  );
}
