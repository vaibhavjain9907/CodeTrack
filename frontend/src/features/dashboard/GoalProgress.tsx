/**
 * GoalProgress.
 *
 * The Goals & Milestones module (a future module, per the project
 * roadmap) doesn't exist yet — there is no backend endpoint to fetch
 * goals from. Rather than fabricate fake goal data or silently omit
 * this section, we render an honest, designed empty state so the
 * dashboard's layout is final today and only needs a data source
 * swapped in later, not a UI rebuild.
 *
 * The three template rows below are explicitly labeled previews of
 * goal *types*, not real user goals — no numbers here are claimed to
 * be the user's actual progress.
 */

import { Flame, Lock, Sparkles, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const GOAL_TEMPLATES = [
  { icon: Target, label: "Solve N problems this month", ring: 0.7 },
  { icon: Flame, label: "Hit a 30-day streak", ring: 0.4 },
  { icon: TrendingUp, label: "Reach a target rating", ring: 0.15 },
];

function LockedRing({ progress }: { progress: number }) {
  const size = 32;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        className="stroke-surface-200 dark:stroke-surface-700"
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        strokeLinecap="round"
        className="stroke-surface-300 dark:stroke-surface-600"
        fill="none"
      />
    </svg>
  );
}

export function GoalProgress() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
      className="overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900"
    >
      <div className="flex items-start justify-between border-b border-surface-100 px-6 py-5 dark:border-surface-800">
        <div>
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
            Goals
          </h2>
          <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
            Set targets and track them automatically.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-100 px-2.5 py-1 text-[11px] font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
          <Sparkles className="h-3 w-3" />
          Coming soon
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-surface-100 dark:divide-surface-800">
        {GOAL_TEMPLATES.map(({ icon: Icon, label, ring }) => (
          <li
            key={label}
            className="flex items-center gap-3.5 px-6 py-4 opacity-60 transition-opacity hover:opacity-90"
          >
            <LockedRing progress={ring} />
            <Icon className="h-4 w-4 shrink-0 text-surface-400 dark:text-surface-500" />
            <span className="flex-1 text-sm text-surface-600 dark:text-surface-400">{label}</span>
            <Lock className="h-3.5 w-3.5 shrink-0 text-surface-300 dark:text-surface-600" />
          </li>
        ))}
      </ul>

      <div className="border-t border-surface-100 px-6 py-4 dark:border-surface-800">
        <p className="text-xs text-surface-400 dark:text-surface-500">
          Goal tracking unlocks once this module ships — no setup needed on your end.
        </p>
      </div>
    </motion.div>
  );
}
