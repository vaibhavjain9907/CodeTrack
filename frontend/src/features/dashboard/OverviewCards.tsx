/**
 * OverviewCards.
 *
 * Fetches GET /dashboard/summary and renders the four top-line
 * metrics. Owns its own loading/error/empty states so DashboardPage
 * doesn't need to branch on this section's fetch status.
 */

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Flame, Layers, Trophy } from "lucide-react";

import { fetchDashboardSummary } from "@/api/dashboard";
import { StatCard } from "@/features/dashboard/StatCard";

function CardSkeleton() {
  return (
    <div className="h-[104px] animate-pulse rounded-xl border border-surface-200 bg-surface-100 dark:border-surface-800 dark:bg-surface-800" />
  );
}

export function OverviewCards() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-5 text-sm text-surface-500 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400">
        Couldn&apos;t load your overview stats right now. Try refreshing the page.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total problems solved"
        value={data.total_problems_solved}
        icon={CheckCircle2}
        accent="success"
      />
      <StatCard
        label="Current streak"
        value={data.current_streak_days}
        suffix="days"
        icon={Flame}
        accent="warning"
      />
      <StatCard
        label="Longest streak"
        value={data.longest_streak_days}
        suffix="days"
        icon={Trophy}
        accent="warning"
      />
      <StatCard
        label="Connected platforms"
        value={`${data.connected_platform_count} / ${data.active_platform_count}`}
        icon={Layers}
        accent="brand"
      />
    </div>
  );
}
