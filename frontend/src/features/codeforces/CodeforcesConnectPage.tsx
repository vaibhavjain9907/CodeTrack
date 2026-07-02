/**
 * CodeforcesConnectPage.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trophy, ArrowRight, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { connectCodeforces } from "@/api/codeforces";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { APIErrorResponse } from "@/types/api";

const schema = z.object({
  handle: z.string().min(1, "Handle is required").max(100, "Handle is too long").transform((v) => v.trim()).refine((v) => v.length > 0, "Handle cannot be blank"),
});
type FormValues = z.infer<typeof schema>;

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const body = error.response?.data as APIErrorResponse | undefined;
    const message = body?.message;
    if (status === 422) return "That handle doesn't exist on Codeforces. Check the spelling.";
    if (status === 409) return "A Codeforces account is already connected.";
    if (status === 429) return "Too many requests. Please wait a moment and try again.";
    if (status === 502) return "Codeforces is unreachable right now. Try again shortly.";
    if (!error.response) return "Network error — check your connection and retry.";
    return message ?? "Something went wrong. Please try again.";
  }
  return "An unexpected error occurred.";
}

export function CodeforcesConnectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { handle: "" },
  });

  const handle = watch("handle");

  const mutation = useMutation({
    mutationFn: (values: FormValues) => connectCodeforces({ handle: values.handle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeforces-profile"] });
      navigate("/codeforces", { replace: true });
    },
    onError: (err) => { setServerError(getErrorMessage(err)); },
  });

  return (
    <DashboardLayout title="Connect Codeforces">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-100 dark:ring-brand-800">
              <Trophy className="h-7 w-7 text-brand-600 dark:text-brand-400" />
            </div>
            <h1 className="text-2xl font-semibold text-surface-900 dark:text-surface-50">Connect Codeforces</h1>
            <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
              Enter your Codeforces handle to track your rating, contest history, and submissions. Your profile is public — no password needed.
            </p>
          </div>

          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 shadow-sm">
            <form onSubmit={handleSubmit((v) => { setServerError(null); mutation.mutate(v); })} className="space-y-4">
              <Input label="Codeforces Handle" placeholder="e.g. tourist" autoComplete="off" autoFocus error={errors.handle?.message} {...register("handle")} />
              {serverError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-danger/20 bg-danger/5 px-3.5 py-3 text-sm text-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}
              <Button type="submit" className="w-full" isLoading={mutation.isPending} disabled={!handle.trim()}>
                {mutation.isPending ? "Verifying…" : <><span>Connect account</span><ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>
          </div>
          <p className="mt-4 text-center text-xs text-surface-400 dark:text-surface-500">
            We only read your public Codeforces data. Nothing is written to your account.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
