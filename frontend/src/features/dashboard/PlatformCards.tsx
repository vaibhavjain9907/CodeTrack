/**
 * PlatformCards.
 *
 * Fetches GET /dashboard/platforms and renders one card per platform.
 * Unconnected platforms show a "Connect" call-to-action rather than
 * empty stats, since an empty stat next to a connected platform's
 * real numbers would misleadingly suggest "0 problems solved" rather
 * than "not linked yet".
 *
 * Presentation note: the "solved" bar under each connected platform is
 * scaled relative to the highest solved-count already present in this
 * same query result — it's a derived comparison across real numbers
 * we already fetched, not a fabricated or externally-assumed scale.
 */

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { fetchDashboardPlatforms } from "@/api/dashboard";

const PLATFORM_LABELS: Record<string, string> = {
  leetcode: "LeetCode",
  codeforces: "Codeforces",
};

/** Short monogram + a muted, platform-distinct accent — purely a display
 * convenience, not a claim about the platforms' real brand colors. */
const PLATFORM_STYLE: Record<
  string,
  { mark: string; text: string; ring: string; bar: string }
> = {
  leetcode: {
    mark: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/20",
    text: "text-warning",
    ring: "group-hover:ring-warning/30",
    bar: "bg-warning",
  },
  codeforces: {
    mark: "bg-brand-500/10 text-brand-600 ring-1 ring-inset ring-brand-500/20 dark:text-brand-400",
    text: "text-brand-600 dark:text-brand-400",
    ring: "group-hover:ring-brand-500/30",
    bar: "bg-brand-500",
  },
};

const DEFAULT_STYLE = {
  mark: "bg-surface-100 text-surface-500 ring-1 ring-inset ring-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:ring-surface-700",
  text: "text-surface-500 dark:text-surface-400",
  ring: "group-hover:ring-surface-300",
  bar: "bg-surface-400",
};

function monogram(platform: string): string {
  return (PLATFORM_LABELS[platform] ?? platform).slice(0, 2).toUpperCase();
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" as const } },
};

function PlatformCardSkeleton() {
  return (
    <div className="h-[148px] animate-pulse rounded-2xl border border-surface-200 bg-surface-100 dark:border-surface-800 dark:bg-surface-800" />
  );
}

export function PlatformCards() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-platforms"],
    queryFn: fetchDashboardPlatforms,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlatformCardSkeleton />
        <PlatformCardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-6 text-sm text-surface-500 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400">
        Couldn&apos;t load platform status right now.
      </div>
    );
  }

  const maxSolved = Math.max(
    1,
    ...data.platforms.filter((p) => p.connected).map((p) => p.total_solved),
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {data.platforms.map((platform) => {
        const style = PLATFORM_STYLE[platform.platform] ?? DEFAULT_STYLE;
        const barWidth = platform.connected
          ? Math.max(6, Math.round((platform.total_solved / maxSolved) * 100))
          : 0;

        return (
          <motion.div
            key={platform.platform}
            variants={itemVariants}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-colors ${
              platform.connected
                ? `border-surface-200 bg-white ring-1 ring-transparent dark:border-surface-800 dark:bg-surface-900 ${style.ring}`
                : "border-dashed border-surface-300 bg-surface-50/50 hover:border-surface-400 dark:border-surface-700 dark:bg-surface-900/30 dark:hover:border-surface-600"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold tracking-tight ${
                    platform.connected ? style.mark : "bg-surface-100 text-surface-400 dark:bg-surface-800"
                  }`}
                >
                  {monogram(platform.platform)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                    {PLATFORM_LABELS[platform.platform] ?? platform.platform}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      platform.connected
                        ? "bg-success/10 text-success"
                        : "bg-surface-100 text-surface-400 dark:bg-surface-800 dark:text-surface-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        platform.connected ? "bg-success" : "bg-surface-400"
                      }`}
                    />
                    {platform.connected ? "Connected" : "Not connected"}
                  </span>
                </div>
              </div>

              {platform.connected && (
                <ArrowUpRight className="h-4 w-4 text-surface-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-surface-600" />
              )}
            </div>

            {platform.connected ? (
              <div className="mt-6">
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-2xl font-semibold tabular-nums text-surface-900 dark:text-surface-50">
                    {platform.total_solved}
                    <span className="ml-1.5 font-sans text-xs font-medium text-surface-400">
                      solved
                    </span>
                  </p>
                  {platform.rating !== null && (
                    <p
                      className={`font-mono text-sm font-semibold tabular-nums ${style.text}`}
                    >
                      {platform.rating}
                    </p>
                  )}
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                    className={`h-full rounded-full ${style.bar}`}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-surface-400 dark:text-surface-500">
                  Link your account to see stats here.
                </p>
                <Link
                  to={`/${platform.platform}/connect`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:border-brand-700 dark:hover:bg-brand-900/30 dark:hover:text-brand-300"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Connect
                </Link>
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
