/**
 * StatCard.
 *
 * Generic overview metric card. Used for total problems solved,
 * current streak, longest streak, and connected platform count.
 *
 * `size` and `footer` are additive, backward-compatible presentation
 * props — every existing call site (label/value/icon/suffix/accent)
 * still works unchanged; `size` just lets a parent grid give one card
 * more visual weight than another (e.g. a hero metric vs. a compact
 * insight), and `footer` lets a parent attach a small derived
 * visualization below the value without StatCard knowing what it is.
 */

import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

type StatCardSize = "lg" | "md" | "sm";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  suffix?: string;
  accent?: "brand" | "success" | "warning";
  size?: StatCardSize;
  footer?: ReactNode;
}

const accentBar: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand-500",
  success: "bg-success",
  warning: "bg-warning",
};

const accentIcon: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "text-brand-500 dark:text-brand-400",
  success: "text-success",
  warning: "text-warning",
};

const sizeConfig: Record<
  StatCardSize,
  { pad: string; value: string; label: string; icon: string; gap: string }
> = {
  lg: {
    pad: "p-7 lg:p-9",
    value: "text-[44px] leading-[0.95] sm:text-[56px] lg:text-[64px]",
    label: "text-xs",
    icon: "h-5 w-5",
    gap: "mt-6",
  },
  md: {
    pad: "p-6",
    value: "text-[34px] leading-none sm:text-[38px]",
    label: "text-xs",
    icon: "h-4 w-4",
    gap: "mt-4",
  },
  sm: {
    pad: "p-5",
    value: "text-2xl leading-none",
    label: "text-[11px]",
    icon: "h-3.5 w-3.5",
    gap: "mt-3",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  suffix,
  accent = "brand",
  size = "md",
  footer,
}: StatCardProps) {
  const cfg = sizeConfig[size];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={clsx(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900",
        "transition-colors hover:border-surface-300 dark:hover:border-surface-700",
        cfg.pad,
      )}
    >
      {/* Flat accent rail — no gradients, just a confident 3px line of color */}
      <span
        className={clsx("absolute inset-y-0 left-0 w-[3px] opacity-80", accentBar[accent])}
        aria-hidden="true"
      />

      {/* Oversized watermark icon for the hero card only — quiet, tucked in the corner */}
      {size === "lg" && (
        <Icon
          className="pointer-events-none absolute -bottom-4 -right-4 h-32 w-32 text-surface-900 opacity-[0.035] dark:text-white dark:opacity-[0.05]"
          aria-hidden="true"
        />
      )}

      <div className="relative flex items-start justify-between">
        <span
          className={clsx(
            "font-semibold uppercase tracking-[0.08em] text-surface-400 dark:text-surface-500",
            cfg.label,
          )}
        >
          {label}
        </span>
        {size !== "lg" && (
          <div className={clsx("flex items-center justify-center", accentIcon[accent])}>
            <Icon className={cfg.icon} />
          </div>
        )}
      </div>

      <p
        className={clsx(
          "relative flex items-baseline gap-2 font-mono font-semibold tabular-nums text-surface-900 dark:text-surface-50",
          cfg.value,
          cfg.gap,
        )}
      >
        {value}
        {suffix && (
          <span className="text-sm font-medium text-surface-400 dark:text-surface-500">
            {suffix}
          </span>
        )}
      </p>

      {footer && <div className="relative mt-auto pt-4">{footer}</div>}
    </motion.div>
  );
}
