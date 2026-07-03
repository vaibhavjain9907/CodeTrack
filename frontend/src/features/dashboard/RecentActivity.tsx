/**
 * RecentActivity.
 *
 * Intended to show a combined feed of recent submissions across all
 * connected platforms. No platform integration exists yet (see
 * DashboardService's docstring), so there is no submission data to
 * show. Renders an honest empty state rather than fabricated rows —
 * but shaped like the timeline this section will become, so the
 * layout doesn't need a rebuild once real submissions exist.
 */

import { Activity } from "lucide-react";
import { motion } from "framer-motion";

const GHOST_ROWS = [
  { width: "w-3/4", opacity: "opacity-100" },
  { width: "w-1/2", opacity: "opacity-70" },
  { width: "w-2/3", opacity: "opacity-40" },
];

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
      className="overflow-hidden rounded-2xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900"
    >
      <div className="border-b border-surface-100 px-6 py-5 dark:border-surface-800">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
          Recent activity
        </h2>
        <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
          Your latest submissions across every connected platform.
        </p>
      </div>

      <div className="relative px-6 py-6">
        {/* Ghost timeline — a dashed rail with fading placeholder rows, so the
            empty state previews the real feed's shape instead of just
            showing a centered icon. */}
        <div className="absolute bottom-6 left-[31px] top-6 w-px border-l border-dashed border-surface-200 dark:border-surface-700" />

        <ul className="flex flex-col gap-5">
          {GHOST_ROWS.map((row, i) => (
            <li key={i} className={`relative flex items-center gap-4 ${row.opacity}`}>
              <span className="relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900" />
              <div className="flex-1">
                <div className={`h-2.5 rounded-full bg-surface-100 dark:bg-surface-800 ${row.width}`} />
              </div>
            </li>
          ))}
        </ul>

        <div className="relative z-10 mt-7 flex flex-col items-center rounded-xl border border-dashed border-surface-200 bg-surface-50/60 py-8 text-center dark:border-surface-800 dark:bg-surface-950/40">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 ring-1 ring-inset ring-brand-500/15 dark:text-brand-400">
            <Activity className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-surface-700 dark:text-surface-300">
            No submissions yet
          </p>
          <p className="mt-1 max-w-[240px] text-xs text-surface-500 dark:text-surface-400">
            Once a platform is connected, your solves will appear here in real time.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
