/**
 * LeetCodeDashboardPage — main view for the LeetCode integration.
 *
 * Fetches profile and submissions in parallel. Redirects to
 * /leetcode/connect if no account is connected (404 response).
 * Shows full loading skeleton while data is fetching, and an error
 * state for network/server failures.
 *
 * Adapted from the original Module 4B implementation: AppLayout
 * (superseded) swapped for DashboardLayout, which renders the page
 * title via its Topbar — the original's inline "LeetCode" header is
 * therefore passed as DashboardLayout's `title` prop instead of being
 * duplicated in the page body.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle } from "lucide-react";

import { getLeetCodeProfile, getLeetCodeSubmissions } from "@/api/leetcode";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LeetCodeSkeleton } from "@/components/common/Skeleton";
import { ProfileCard } from "./ProfileCard";
import { StatisticsSection } from "./StatisticsSection";
import { RecentSubmissions } from "./RecentSubmissions";

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 dark:bg-danger/20">
        <AlertCircle className="h-7 w-7 text-danger" />
      </div>
      <h2 className="text-base font-semibold text-surface-800 dark:text-surface-200">
        Something went wrong
      </h2>
      <p className="mt-1.5 max-w-xs text-sm text-surface-500 dark:text-surface-400">{message}</p>
    </div>
  );
}

export function LeetCodeDashboardPage() {
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["leetcode-profile"],
    queryFn: getLeetCodeProfile,
    retry: (failureCount, error) => {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 404 || status === 401) return false;
      }
      return failureCount < 2;
    },
  });

  const submissionsQuery = useQuery({
    queryKey: ["leetcode-submissions"],
    queryFn: () => getLeetCodeSubmissions(20),
    enabled: profileQuery.isSuccess,
    retry: 1,
  });

  useEffect(() => {
    if (
      profileQuery.isError &&
      profileQuery.error instanceof AxiosError &&
      profileQuery.error.response?.status === 404
    ) {
      navigate("/leetcode/connect", { replace: true });
    }
  }, [profileQuery.isError, profileQuery.error, navigate]);

  if (profileQuery.isLoading) {
    return (
      <DashboardLayout title="LeetCode">
        <LeetCodeSkeleton />
      </DashboardLayout>
    );
  }

  if (profileQuery.isError) {
    const err = profileQuery.error;
    const is404 = err instanceof AxiosError && err.response?.status === 404;

    if (is404) return null;

    const message =
      err instanceof AxiosError && !err.response
        ? "Network error — check your connection."
        : "Failed to load your LeetCode data.";

    return (
      <DashboardLayout title="LeetCode">
        <ErrorState message={message} />
      </DashboardLayout>
    );
  }

  const profile = profileQuery.data!;
  const stats = profile.statistics;
  const submissions = submissionsQuery.data ?? [];

  return (
    <DashboardLayout title="LeetCode">
      <div className="space-y-5">
        <ProfileCard profile={profile} />

        {stats ? (
          <StatisticsSection stats={stats} />
        ) : (
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 text-center text-sm text-surface-400 dark:text-surface-500">
            Statistics not available — sync your profile to load them.
          </div>
        )}

        {submissionsQuery.isLoading ? (
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
            <div className="mb-4 h-4 w-36 animate-pulse rounded-md bg-surface-200 dark:bg-surface-700" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-md bg-surface-100 dark:bg-surface-800"
                />
              ))}
            </div>
          </div>
        ) : (
          <RecentSubmissions submissions={submissions} />
        )}
      </div>
    </DashboardLayout>
  );
}
