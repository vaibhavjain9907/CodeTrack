/**
 * GoalProgress.
 *
 * The Goals & Milestones module (a future module, per the project
 * roadmap) doesn't exist yet — there is no backend endpoint to fetch
 * goals from. Rather than fabricate fake goal data or silently omit
 * this section, we render an honest, designed empty state so the
 * dashboard's layout is final today and only needs a data source
 * swapped in later, not a UI rebuild.
 */

import { Target } from "lucide-react";

export function GoalProgress() {
  return (
    <div className="rounded-xl border border-dashed border-surface-300 bg-surface-50 p-8 text-center dark:border-surface-700 dark:bg-surface-900/50">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
        <Target className="h-5 w-5 text-surface-400" />
      </div>
      <p className="mt-3 text-sm font-medium text-surface-700 dark:text-surface-300">
        No goals set yet
      </p>
      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
        Goal tracking is coming in a future update.
      </p>
    </div>
  );
}
