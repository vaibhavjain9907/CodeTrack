/**
 * GoalCard — full detail card for a single goal.
 *
 * Shows title, type, target/current, animated progress, deadline, and
 * achieved/expired badges. Edit and delete actions are surfaced via
 * callbacks so GoalList owns the modal/dialog state.
 */
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Clock, Pencil, Trash2 } from "lucide-react";
import { clsx } from "clsx";

import type { Goal } from "@/types/goals";
import { GOAL_TYPE_LABELS, GOAL_TYPE_UNITS } from "@/types/goals";
import { GoalProgressBar } from "./GoalProgress";

interface Props {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "No deadline";
  return new Date(deadline).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function GoalCard({ goal, onEdit, onDelete }: Props) {
  const unit = GOAL_TYPE_UNITS[goal.goal_type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={clsx(
        "group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-card transition-shadow hover:shadow-popover dark:bg-surface-900 dark:shadow-card-dark",
        goal.is_achieved
          ? "border-success/30 dark:border-success/20"
          : goal.is_expired
            ? "border-danger/30 dark:border-danger/20"
            : "border-surface-200 dark:border-surface-800",
      )}
    >
      {/* Ambient tint */}
      <div
        className={clsx(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl",
          goal.is_achieved
            ? "bg-success/10"
            : goal.is_expired
              ? "bg-danger/10"
              : "bg-brand-500/10",
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-surface-400 dark:text-surface-500">
            {GOAL_TYPE_LABELS[goal.goal_type]}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold text-surface-900 dark:text-surface-50">
            {goal.title}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            aria-label="Edit goal"
            className="flex h-7 w-7 items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal)}
            aria-label="Delete goal"
            className="flex h-7 w-7 items-center justify-center rounded-md text-surface-500 hover:bg-danger/10 hover:text-danger dark:text-surface-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="mb-2 flex items-end justify-between">
          <span className="font-mono text-2xl font-bold tabular-nums text-surface-900 dark:text-surface-50">
            {goal.current_value.toLocaleString()}
            <span className="ml-1 text-sm font-medium text-surface-400 dark:text-surface-500">
              / {goal.target_value.toLocaleString()} {unit}
            </span>
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-surface-500 dark:text-surface-400">
            {goal.progress_percentage}%
          </span>
        </div>
        <GoalProgressBar
          percentage={goal.progress_percentage}
          isAchieved={goal.is_achieved}
          isExpired={goal.is_expired}
        />
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
          <Calendar className="h-3.5 w-3.5" />
          {formatDeadline(goal.deadline)}
        </span>

        {goal.is_achieved ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
            <CheckCircle2 className="h-3 w-3" />
            Achieved
          </span>
        ) : goal.is_expired ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 text-[11px] font-semibold text-danger">
            <Clock className="h-3 w-3" />
            Expired
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
