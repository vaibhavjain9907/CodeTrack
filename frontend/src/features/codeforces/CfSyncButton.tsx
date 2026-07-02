/**
 * CfSyncButton — triggers a manual Codeforces sync.
 * Mirrors LeetCode's SyncButton pattern with Codeforces-specific
 * query invalidation keys and copy.
 */
import { RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { syncCodeforces } from "@/api/codeforces";
import { Button } from "@/components/common/Button";

export function CfSyncButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: syncCodeforces,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeforces-profile"] });
      queryClient.invalidateQueries({ queryKey: ["codeforces-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["codeforces-contests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-platforms"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-heatmap"] });
    },
  });

  return (
    <Button
      variant="secondary"
      onClick={() => mutation.mutate()}
      isLoading={mutation.isPending}
      className="gap-1.5"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      {mutation.isPending ? "Syncing…" : mutation.isSuccess ? "Synced!" : "Sync"}
    </Button>
  );
}
