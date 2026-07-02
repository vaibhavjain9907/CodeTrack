/**
 * SyncButton — triggers a manual LeetCode sync.
 *
 * States:
 * - Idle: shows "Sync now"
 * - Loading: spinner + "Syncing…"
 * - Rate-limited (429): disabled + countdown timer until retry allowed
 * - Error: shows a brief error message
 */

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { clsx } from "clsx";

import { syncLeetCode } from "@/api/leetcode";

interface SyncButtonProps {
  /** Display a compact icon-only version (for the profile card header). */
  compact?: boolean;
}

type SyncState = "idle" | "success" | "error" | "rate-limited";

export function SyncButton({ compact = false }: SyncButtonProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SyncState>("idle");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCountdown(seconds: number) {
    setCountdown(seconds);
    setState("rate-limited");
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setState("idle");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const mutation = useMutation({
    mutationFn: () => syncLeetCode(),
    onSuccess: () => {
      // Invalidate all LeetCode queries to refresh everything
      queryClient.invalidateQueries({ queryKey: ["leetcode-profile"] });
      queryClient.invalidateQueries({ queryKey: ["leetcode-submissions"] });
      setState("success");
      // Reset to idle after 3 seconds
      setTimeout(() => setState("idle"), 3000);
    },
    onError: (err) => {
      if (err instanceof AxiosError && err.response?.status === 429) {
        // Parse Retry-After header if available
        const retryAfter = parseInt(
          err.response.headers?.["retry-after"] ?? "300",
          10,
        );
        startCountdown(retryAfter);
      } else {
        setState("error");
        setTimeout(() => setState("idle"), 4000);
      }
    },
  });

  const isDisabled =
    mutation.isPending || state === "rate-limited" || state === "success";

  function formatCountdown(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }

  if (compact) {
    return (
      <button
        onClick={() => mutation.mutate()}
        disabled={isDisabled}
        title={
          state === "rate-limited"
            ? `Rate limited — try again in ${formatCountdown(countdown)}`
            : "Sync now"
        }
        className={clsx(
          "flex items-center justify-center rounded-lg p-2 transition-colors",
          "text-surface-500 dark:text-surface-400",
          "hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          mutation.isPending && "text-brand-600 dark:text-brand-400",
        )}
      >
        <RefreshCw
          className={clsx("h-4 w-4", mutation.isPending && "animate-spin")}
        />
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={() => mutation.mutate()}
        disabled={isDisabled}
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
          "border border-surface-200 dark:border-surface-700",
          "text-surface-700 dark:text-surface-300",
          "hover:bg-surface-50 dark:hover:bg-surface-800 hover:border-surface-300 dark:hover:border-surface-600",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          state === "success" && "border-success/40 bg-success/5 text-success",
          state === "error" && "border-danger/40 bg-danger/5 text-danger",
          state === "rate-limited" &&
            "border-warning/40 bg-warning/5 text-warning",
        )}
      >
        {mutation.isPending && (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        )}
        {state === "success" && <CheckCircle2 className="h-3.5 w-3.5" />}
        {state === "error" && <AlertCircle className="h-3.5 w-3.5" />}
        {state === "rate-limited" && <Clock className="h-3.5 w-3.5" />}
        {!mutation.isPending &&
          state !== "success" &&
          state !== "error" &&
          state !== "rate-limited" && <RefreshCw className="h-3.5 w-3.5" />}

        {mutation.isPending && "Syncing…"}
        {state === "success" && "Synced!"}
        {state === "error" && "Sync failed"}
        {state === "rate-limited" && `Retry in ${formatCountdown(countdown)}`}
        {state === "idle" && !mutation.isPending && "Sync now"}
      </button>
    </div>
  );
}
