/**
 * OverviewCards.
 *
 * Fetches GET /dashboard/summary and renders the four top-line
 * metrics. Owns its own loading/error/empty states so DashboardPage
 * doesn't need to branch on this section's fetch status.
 *
 * Presentation note: the four metrics are deliberately weighted
 * unevenly — total problems solved is the number a returning user
 * cares about most, so it gets a dominant hero cell in the bento
 * grid. The other three are supporting figures, sized down to match.
 */

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Flame, Layers, Trophy } from "lucide-react";
import { motion } from "framer-motion";

import { fetchDashboardSummary } from "@/api/dashboard";
import { StatCard } from "@/features/dashboard/StatCard";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
};

function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-surface-200 bg-surface-100 dark:border-surface-800 dark:bg-surface-800 ${className}`}
    />
  );
}

/** Small filled/unfilled dot row — a derived visual, not a new data source: it
 * just renders `active` out of `total`, both already present on the summary
 * payload. */
function PlatformDots({ connected, active }: { connected: number; active: number }) {
  const total = Math.max(active, connected, 1);
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={
            i < connected
              ? "h-1.5 w-4 rounded-full bg-brand-500"
              : "h-1.5 w-4 rounded-full bg-surface-200 dark:bg-surface-700"
          }
        />
      ))}
    </div>
  );
}

export function OverviewCards() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:auto-rows-fr">
        <CardSkeleton className="h-[180px] lg:col-span-2 lg:row-span-2 lg:h-auto" />
        <CardSkeleton className="h-[104px]" />
        <CardSkeleton className="h-[104px]" />
        <CardSkeleton className="h-[104px] sm:col-span-2 lg:col-span-2 lg:row-start-2" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-6 text-sm text-surface-500 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400">
        Couldn&apos;t load your overview stats right now. Try refreshing the page.
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2"
    >
      {/* Hero cell — dominant, spans two columns and both rows on desktop */}
      <motion.div variants={itemVariants} className="lg:col-span-2 lg:row-span-2">
        <StatCard
          label="Total problems solved"
          value={data.total_problems_solved}
          icon={CheckCircle2}
          accent="success"
          size="lg"
        />
      </motion.div>

      {/* Two medium supporting cells */}
      <motion.div variants={itemVariants}>
        <StatCard
          label="Current streak"
          value={data.current_streak_days}
          suffix="days"
          icon={Flame}
          accent="warning"
          size="md"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          label="Longest streak"
          value={data.longest_streak_days}
          suffix="days"
          icon={Trophy}
          accent="warning"
          size="md"
        />
      </motion.div>

      {/* Compact insight cell, wide and short, second row */}
      <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2 lg:row-start-2">
        <StatCard
          label="Connected platforms"
          value={`${data.connected_platform_count} / ${data.active_platform_count}`}
          icon={Layers}
          accent="brand"
          size="sm"
          footer={
            <PlatformDots
              connected={data.connected_platform_count}
              active={data.active_platform_count}
            />
          }
        />
      </motion.div>
    </motion.div>
  );
}
