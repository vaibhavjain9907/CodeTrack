/**
 * GoalProgress (dashboard widget).
 *
 * Shows the top 3 active (not-yet-achieved) goals with an animated ring
 * chart per row, sourced from the real Goal API (["goals"] query key —
 * shared with GoalsPage, so a create/edit/delete there invalidates
 * this widget too). Falls back to a premium empty state when the user
 * has no goals yet, and links through to /goals either way.
 */

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Plus, Target } from "lucide-react";

import { listGoals } from "@/api/goals";
import { GoalRing } from "@/features/goals/GoalRing";
import { GOAL_TYPE_LABELS } from "@/types/goals";

function EmptyState() {
  return (
    <div className="flex flex-col items-center px-7 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/15 to-brand-600/5 text-brand-500 ring-1 ring-inset ring-brand-500/15 dark:from-brand-400/20 dark:to-brand-600/5 dark:text-brand-400">
        <Target className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-medium text-surface-700 dark:text-surface-300">
        No goals yet
      </p>
      <p className="mt-1 max-w-[220px] text-xs text-surface-500 dark:text-surface-400">
        Set a target and watch your progress update automatically.
      </p>
      <Link
        to="/goals"
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
      >
        <Plus className="h-3.5 w-3.5" />
        Create your first goal
      </Link>
    </div>
  );
}

export function GoalProgress() {
  const { data, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: listGoals,
  });

  const activeGoals = (data ?? [])
    .filter((goal) => !goal.is_achieved)
    .sort((a, b) => b.progress_percentage - a.progress_percentage)
    .slice(0, 3);

  const achievedCount = (data ?? []).filter((goal) => goal.is_achieved).length;
  const hasGoals = (data?.length ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
      className="overflow-hidden rounded-[20px] border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900"
    >
      <div className="flex items-start justify-between border-b border-surface-100 px-7 py-6 dark:border-surface-800">
        <div>
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
            Goals
          </h2>
          <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
            {hasGoals
              ? `${achievedCount} of ${data?.length} achieved`
              : "Top active targets"}
          </p>
        </div>
        <Link
          to="/goals"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4 px-7 py-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-full bg-surface-100 dark:bg-surface-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-32 rounded bg-surface-100 dark:bg-surface-800" />
                <div className="h-2.5 w-20 rounded bg-surface-100 dark:bg-surface-800" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasGoals ? (
        <EmptyState />
      ) : activeGoals.length === 0 ? (
        <div className="flex flex-col items-center px-7 py-10 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <p className="mt-3 text-sm font-medium text-surface-700 dark:text-surface-300">
            All goals achieved
          </p>
          <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
            Set a new target to keep the streak going.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-surface-100 px-7 py-2 dark:divide-surface-800">
          {activeGoals.map((goal) => (
            <li key={goal.id} className="flex items-center gap-3.5 py-4">
              <GoalRing
                percentage={goal.progress_percentage}
                isAchieved={goal.is_achieved}
                isExpired={goal.is_expired}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-surface-800 dark:text-surface-200">
                  {goal.title}
                </p>
                <p className="text-[11px] text-surface-400 dark:text-surface-500">
                  {GOAL_TYPE_LABELS[goal.goal_type]}
                  {goal.is_expired && (
                    <span className="ml-1.5 text-danger">· Expired</span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
