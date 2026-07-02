/**
 * LeetCodeConnectPage — allows the user to link their LeetCode username.
 *
 * Handles:
 * - Username validation (empty, whitespace, too long)
 * - 422 from backend: username not found on LeetCode
 * - 409: already connected (should not reach here normally)
 * - 502: LeetCode unreachable (our backend's LeetCodeSyncFailedError maps to 502, not 503)
 * - Network errors
 *
 * Adapted from the original Module 4B implementation: swapped
 * FormField (never built) for the existing Input component, and
 * AppLayout (superseded) for DashboardLayout. Error status codes
 * below were updated to match what our real backend actually returns
 * (see app/core/exception_handlers.py's _LEETCODE_ERROR_STATUS_MAP) —
 * the original assumed 503 for "LeetCode unreachable"; our backend
 * uses 502, since LeetCodeSyncFailedError is a bad-gateway condition
 * (we successfully reached our own server, which then failed talking
 * to a third party), not our own service being unavailable.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trophy, ArrowRight, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { connectLeetCode } from "@/api/leetcode";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { APIErrorResponse } from "@/types/api";

const schema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(100, "Username is too long")
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, "Username cannot be blank"),
});

type FormValues = z.infer<typeof schema>;

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const body = error.response?.data as APIErrorResponse | undefined;
    const message = body?.message;

    if (status === 422) {
      return "That username doesn't exist on LeetCode. Double-check the spelling.";
    }
    if (status === 409) return "A LeetCode account is already connected.";
    if (status === 429) return "Too many requests. Please wait a moment and try again.";
    if (status === 502) return "LeetCode is unreachable right now. Try again shortly.";
    if (!error.response) return "Network error — check your connection and retry.";
    return message ?? "Something went wrong. Please try again.";
  }
  return "An unexpected error occurred.";
}

export function LeetCodeConnectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "" },
  });

  const username = watch("username");

  const mutation = useMutation({
    mutationFn: (values: FormValues) => connectLeetCode({ username: values.username }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leetcode-profile"] });
      navigate("/leetcode", { replace: true });
    },
    onError: (err) => {
      setServerError(getErrorMessage(err));
    },
  });

  function onSubmit(values: FormValues) {
    setServerError(null);
    mutation.mutate(values);
  }

  return (
    <DashboardLayout title="Connect LeetCode">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-100 dark:ring-brand-800">
              <Trophy className="h-7 w-7 text-brand-600 dark:text-brand-400" />
            </div>
            <h1 className="text-2xl font-semibold text-surface-900 dark:text-surface-50">
              Connect LeetCode
            </h1>
            <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
              Enter your LeetCode username to start tracking your progress. Your profile is
              public — no password needed.
            </p>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="LeetCode Username"
                placeholder="e.g. neal_wu"
                autoComplete="off"
                autoFocus
                error={errors.username?.message}
                {...register("username")}
              />

              {serverError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-danger/20 bg-danger/5 px-3.5 py-3 text-sm text-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={mutation.isPending}
                disabled={!username.trim()}
              >
                {mutation.isPending ? (
                  "Verifying…"
                ) : (
                  <>
                    Connect account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-surface-400 dark:text-surface-500">
            We only read your public LeetCode data. Nothing is written to your account.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
