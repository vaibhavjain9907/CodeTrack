/**
 * GoalForm — create/edit modal for a Goal.
 *
 * No shared Modal/Dialog primitive exists in this codebase yet, so this
 * builds its own overlay + panel using the same backdrop/AnimatePresence
 * pattern as Sidebar's mobile drawer (fixed overlay, Escape-to-close,
 * body scroll lock) rather than introducing a new dependency for one
 * feature.
 *
 * goal_type is only editable on create — GoalUpdate has no goal_type
 * field on the backend (see schemas/goal.py: changing it would silently
 * repurpose the goal's history), so editing an existing goal shows the
 * type as read-only.
 */
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import type { Goal, GoalType } from "@/types/goals";
import { GOAL_TYPE_LABELS } from "@/types/goals";

const GOAL_TYPE_OPTIONS = Object.entries(GOAL_TYPE_LABELS) as [GoalType, string][];

const goalSchema = z.object({
  goal_type: z.enum([
    "leetcode_problems",
    "leetcode_rating",
    "codeforces_problems",
    "codeforces_rating",
    "daily_streak",
  ] as const),
  title: z.string().min(1, "Title is required.").max(255, "Title is too long."),
  target_value: z.coerce.number().int("Must be a whole number.").positive("Must be greater than 0."),
  deadline: z
    .string()
    .refine((value) => value === "" || new Date(value) >= new Date(new Date().toDateString()), {
      message: "Deadline cannot be in the past.",
    }),
});

export type GoalFormValues = z.infer<typeof goalSchema>;

interface Props {
  isOpen: boolean;
  goal: Goal | null;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (values: GoalFormValues) => void;
  onClose: () => void;
}

export function GoalForm({ isOpen, goal, isSubmitting, serverError, onSubmit, onClose }: Props) {
  const isEditing = goal !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goal_type: "leetcode_problems",
      title: "",
      target_value: 10,
      deadline: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      goal_type: goal?.goal_type ?? "leetcode_problems",
      title: goal?.title ?? "",
      target_value: goal?.target_value ?? 10,
      deadline: goal?.deadline ?? "",
    });
  }, [isOpen, goal, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-surface-950/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="panel"
              role="dialog"
              aria-modal="true"
              aria-label={isEditing ? "Edit goal" : "Create goal"}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-popover dark:border-surface-800 dark:bg-surface-900"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
                  {isEditing ? "Edit goal" : "Create a new goal"}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {serverError && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-950/40">
                    {serverError}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="goal_type"
                    className="text-sm font-medium text-surface-700 dark:text-surface-300"
                  >
                    Goal type
                  </label>
                  <select
                    id="goal_type"
                    disabled={isEditing}
                    className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50"
                    {...register("goal_type")}
                  >
                    {GOAL_TYPE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {isEditing && (
                    <p className="text-xs text-surface-400 dark:text-surface-500">
                      Goal type can&apos;t be changed. Delete and recreate instead.
                    </p>
                  )}
                </div>

                <Input
                  label="Title"
                  placeholder="e.g. Solve 100 problems this quarter"
                  error={errors.title?.message}
                  {...register("title")}
                />

                <Input
                  label="Target value"
                  type="number"
                  min={1}
                  error={errors.target_value?.message}
                  {...register("target_value")}
                />

                <Input
                  label="Deadline (optional)"
                  type="date"
                  error={errors.deadline?.message}
                  {...register("deadline")}
                />

                <div className="mt-2 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {isEditing ? "Save changes" : "Create goal"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
