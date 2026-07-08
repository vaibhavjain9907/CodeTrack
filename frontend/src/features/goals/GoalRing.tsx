/**
 * GoalRing — circular (ring-chart) counterpart to GoalProgressBar, used by
 * the dashboard's compact goal preview. Same props/color semantics as
 * GoalProgressBar so it's a drop-in visual alternative; the full /goals
 * page (GoalCard) keeps the linear bar.
 */
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface Props {
  percentage: number;
  isAchieved: boolean;
  isExpired: boolean;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function GoalRing({
  percentage,
  isAchieved,
  isExpired,
  size = 44,
  strokeWidth = 4,
  className,
}: Props) {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const ringColor = isAchieved
    ? "stroke-success"
    : isExpired
      ? "stroke-danger"
      : "stroke-brand-500 dark:stroke-brand-400";

  return (
    <div
      className={clsx("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-surface-100 dark:stroke-surface-800"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={ringColor}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-semibold tabular-nums text-surface-700 dark:text-surface-200">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
