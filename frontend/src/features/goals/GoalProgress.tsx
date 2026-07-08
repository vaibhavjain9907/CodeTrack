/**
 * GoalProgressBar — animated horizontal progress bar shared by
 * GoalCard (full detail) and the dashboard's compact goal preview.
 */
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface Props {
  percentage: number;
  isAchieved: boolean;
  isExpired: boolean;
  className?: string;
}

export function GoalProgressBar({ percentage, isAchieved, isExpired, className }: Props) {
  const barColor = isAchieved
    ? "bg-gradient-to-r from-success to-emerald-400"
    : isExpired
      ? "bg-gradient-to-r from-danger to-red-400"
      : "bg-gradient-to-r from-brand-500 to-brand-400";

  return (
    <div
      className={clsx(
        "h-2 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800",
        className,
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percentage, 100)}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={clsx("h-full rounded-full", barColor)}
      />
    </div>
  );
}
