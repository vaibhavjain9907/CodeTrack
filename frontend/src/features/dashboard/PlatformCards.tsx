/**
 * PlatformCards.
 *
 * Fetches GET /dashboard/platforms and renders one card per platform.
 * Unconnected platforms show a "Connect" call-to-action rather than
 * empty stats, since an empty stat next to a connected platform's
 * real numbers would misleadingly suggest "0 problems solved" rather
 * than "not linked yet".
 */

import { useQuery } from "@tanstack/react-query";
import { Link2, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchDashboardPlatforms } from "@/api/dashboard";

const PLATFORM_LABELS: Record<string, string> = {
  leetcode: "LeetCode",
  codeforces: "Codeforces",
};

function PlatformCardSkeleton() {
  return (
    <div className="h-[120px] animate-pulse rounded-xl border border-surface-200 bg-surface-100 dark:border-surface-800 dark:bg-surface-800" />
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
      <div className="rounded-xl border border-surface-200 bg-white p-5 text-sm text-surface-500 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400">
        Couldn&apos;t load platform status right now.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {data.platforms.map((platform) => (
        <div
          key={platform.platform}
          className="flex items-center justify-between rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
              <Trophy className="h-5 w-5 text-surface-500 dark:text-surface-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                {PLATFORM_LABELS[platform.platform] ?? platform.platform}
              </p>
              {platform.connected ? (
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {platform.total_solved} solved
                  {platform.rating !== null && ` · Rating ${platform.rating}`}
                </p>
              ) : (
                <p className="text-xs text-surface-400">Not connected</p>
              )}
            </div>
          </div>

          {!platform.connected && (
            <Link
              to={`/${platform.platform}/connect`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
            >
              <Link2 className="h-3.5 w-3.5" />
              Connect
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
