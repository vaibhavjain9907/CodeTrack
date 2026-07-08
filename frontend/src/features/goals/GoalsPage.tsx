/**
 * GoalsPage — main view for goal tracking (route: /goals).
 *
 * Fetches all goals via useQuery(["goals"]) and passes them to
 * GoalList, which owns create/edit/delete mutations and invalidates
 * this same query key on success.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle, RefreshCw } from "lucide-react";

import { listGoals, refreshGoals } from "@/api/goals";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GoalList } from "@/features/goals/GoalList";

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-5 w-40" />
          <Skeleton className="mt-6 h-8 w-32" />
          <Skeleton className="mt-3 h-2 w-full rounded-full" />
          <Skeleton className="mt-5 h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
        <AlertCircle className="h-7 w-7 text-danger" />
      </div>
      <h2 className="text-base font-semibold text-surface-800 dark:text-surface-200">
        Something went wrong
      </h2>
      <p className="mt-1.5 max-w-xs text-sm text-surface-500">{message}</p>
    </div>
  );
}

export function GoalsPage() {
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: listGoals,
  });

  const refreshMutation = useMutation({
    mutationFn: refreshGoals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return (
    <DashboardLayout title="Goals">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
            Goals
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Set targets across LeetCode and Codeforces. Progress updates live from
            your synced data.
          </p>
        </div>
        {goalsQuery.data && goalsQuery.data.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => refreshMutation.mutate()}
            isLoading={refreshMutation.isPending}
            className="mt-1 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {refreshMutation.isPending ? "Refreshing…" : "Refresh progress"}
          </Button>
        )}
      </div>

      <div className="mt-8">
        {goalsQuery.isLoading ? (
          <LoadingSkeleton />
        ) : goalsQuery.isError ? (
          <ErrorState
            message={
              goalsQuery.error instanceof AxiosError && !goalsQuery.error.response
                ? "Network error — check your connection."
                : "Failed to load your goals."
            }
          />
        ) : (
          <GoalList goals={goalsQuery.data ?? []} />
        )}
      </div>
    </DashboardLayout>
  );
}
