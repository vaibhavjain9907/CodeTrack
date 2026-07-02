/**
 * RecentActivity.
 *
 * Intended to show a combined feed of recent submissions across all
 * connected platforms. No platform integration exists yet (see
 * DashboardService's docstring), so there is no submission data to
 * show. Renders an honest empty state rather than fabricated rows.
 */

import { Activity } from "lucide-react";

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
      <h2 className="mb-4 text-sm font-semibold text-surface-900 dark:text-surface-50">
        Recent activity
      </h2>
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
          <Activity className="h-5 w-5 text-surface-400" />
        </div>
        <p className="mt-3 text-sm font-medium text-surface-700 dark:text-surface-300">
          No recent activity
        </p>
        <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
          Connect a platform to see your submissions here.
        </p>
      </div>
    </div>
  );
}
