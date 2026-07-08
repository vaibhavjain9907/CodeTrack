/**
 * RecentActivity.
 *
 * Intended to show a combined feed of recent submissions across all
 * connected platforms. No platform integration exists yet (see
 * DashboardService's docstring), so there is no submission data to
 * show. Renders an honest empty state rather than fabricated rows —
 * but shaped like the timeline this section will become, so the
 * layout doesn't need a rebuild once real submissions exist.
 *
 * The CTA links to `/settings` (an existing route in the app's nav)
 * rather than a specific platform, since this component has no
 * platform-connection data of its own to decide which one to suggest.
 */

import { Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const GHOST_ROWS = [
  { width: "w-3/4", opacity: "opacity-100", dot: "bg-success" },
  { width: "w-1/2", opacity: "opacity-70", dot: "bg-brand-400" },
  { width: "w-2/3", opacity: "opacity-40", dot: "bg-surface-300 dark:bg-surface-600" },
];

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
};

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
      className="overflow-hidden rounded-[20px] border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900"
    >
      <div className="border-b border-surface-100 px-7 py-6 dark:border-surface-800">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
          Recent activity
        </h2>
        <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
          Your latest submissions across every connected platform.
        </p>
      </div>

      <div className="relative px-7 py-7">
        {/* Ghost timeline — a dashed rail with fading placeholder rows, so the
            empty state previews the real feed's shape instead of just
            showing a centered icon. */}
        <div className="absolute bottom-7 left-[31px] top-7 w-px border-l border-dashed border-surface-200 dark:border-surface-700" />

        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          className="flex flex-col gap-5"
        >
          {GHOST_ROWS.map((row, i) => (
            <motion.li
              key={i}
              variants={rowVariants}
              className={`relative flex items-center gap-4 ${row.opacity}`}
            >
              <span
                className={`relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-white ring-1 ring-surface-200 dark:border-surface-900 dark:ring-surface-700 ${row.dot}`}
              />
              <div className="flex-1">
                <div className={`h-2.5 rounded-full bg-surface-100 dark:bg-surface-800 ${row.width}`} />
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <div className="relative z-10 mt-7 flex flex-col items-center rounded-2xl border border-dashed border-surface-200 bg-surface-50/60 px-6 py-9 text-center dark:border-surface-800 dark:bg-surface-950/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/15 to-brand-600/5 text-brand-500 ring-1 ring-inset ring-brand-500/15 dark:from-brand-400/20 dark:to-brand-600/5 dark:text-brand-400">
            <Activity className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-surface-800 dark:text-surface-100">
            No submissions yet
          </p>
          <p className="mt-1.5 max-w-[260px] text-xs text-surface-500 dark:text-surface-400">
            Once a platform is connected, your solves will appear here in real time.
          </p>
          <Link
            to="/settings"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3.5 py-2 text-xs font-medium text-surface-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:border-brand-700 dark:hover:bg-brand-900/30 dark:hover:text-brand-300"
          >
            Connect a platform
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
