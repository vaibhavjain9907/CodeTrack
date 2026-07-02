/**
 * CodeforcesDashboardPage — main view for the Codeforces integration.
 *
 * Fetches profile, submissions, and contest history in parallel.
 * Redirects to /codeforces/connect if no account is connected (404).
 * Structurally mirrors LeetCodeDashboardPage.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle } from "lucide-react";
import { getCodeforcesProfile, getCodeforcesSubmissions, getCodeforcesContests } from "@/api/codeforces";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CfProfileCard } from "./CfProfileCard";
import { CfContestHistory } from "./CfContestHistory";
import { CfSubmissions } from "./CfSubmissions";
import { CfSyncButton } from "./CfSyncButton";

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {[120, 200, 280].map((h) => (
        <div key={h} className="rounded-2xl border border-surface-200 dark:border-surface-800 animate-pulse bg-surface-100 dark:bg-surface-800" style={{ height: h }} />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10"><AlertCircle className="h-7 w-7 text-danger" /></div>
      <h2 className="text-base font-semibold text-surface-800 dark:text-surface-200">Something went wrong</h2>
      <p className="mt-1.5 max-w-xs text-sm text-surface-500">{message}</p>
    </div>
  );
}

export function CodeforcesDashboardPage() {
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["codeforces-profile"],
    queryFn: getCodeforcesProfile,
    retry: (failureCount, error) => {
      if (error instanceof AxiosError && (error.response?.status === 404 || error.response?.status === 401)) return false;
      return failureCount < 2;
    },
  });

  const submissionsQuery = useQuery({
    queryKey: ["codeforces-submissions"],
    queryFn: () => getCodeforcesSubmissions(20),
    enabled: profileQuery.isSuccess,
    retry: 1,
  });

  const contestsQuery = useQuery({
    queryKey: ["codeforces-contests"],
    queryFn: () => getCodeforcesContests(50),
    enabled: profileQuery.isSuccess,
    retry: 1,
  });

  useEffect(() => {
    if (profileQuery.isError && profileQuery.error instanceof AxiosError && profileQuery.error.response?.status === 404) {
      navigate("/codeforces/connect", { replace: true });
    }
  }, [profileQuery.isError, profileQuery.error, navigate]);

  if (profileQuery.isLoading) {
    return <DashboardLayout title="Codeforces"><LoadingSkeleton /></DashboardLayout>;
  }

  if (profileQuery.isError) {
    if (profileQuery.error instanceof AxiosError && profileQuery.error.response?.status === 404) return null;
    const noNetwork = profileQuery.error instanceof AxiosError && !profileQuery.error.response;
    return (
      <DashboardLayout title="Codeforces">
        <ErrorState message={noNetwork ? "Network error — check your connection." : "Failed to load your Codeforces data."} />
      </DashboardLayout>
    );
  }

  const profile = profileQuery.data!;

  return (
    <DashboardLayout title="Codeforces">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1"><CfProfileCard profile={profile} /></div>
          <div className="pt-1"><CfSyncButton /></div>
        </div>
        <CfContestHistory contests={contestsQuery.data ?? []} />
        <CfSubmissions submissions={submissionsQuery.data ?? []} />
      </div>
    </DashboardLayout>
  );
}
