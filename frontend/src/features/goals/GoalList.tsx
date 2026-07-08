/**
 * GoalList — grid of GoalCard, owns the create/edit/delete modal state
 * and all mutations (create/update/delete), invalidating the shared
 * "goals" query key on success so GoalsPage and the dashboard's
 * GoalProgress preview both stay in sync.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target } from "lucide-react";

import { createGoal, deleteGoal, updateGoal } from "@/api/goals";
import { Button } from "@/components/common/Button";
import type { Goal } from "@/types/goals";
import { GoalCard } from "./GoalCard";
import { DeleteGoalDialog } from "./DeleteGoalDialog";
import { GoalForm, type GoalFormValues } from "./GoalForm";

interface Props {
  goals: Goal[];
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-surface-300 bg-white px-6 py-20 text-center dark:border-surface-700 dark:bg-surface-900"
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/15 to-brand-600/5 text-brand-500 ring-1 ring-inset ring-brand-500/15 dark:from-brand-400/20 dark:to-brand-600/5 dark:text-brand-400">
        <Target className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-base font-semibold text-surface-900 dark:text-surface-50">
        No goals yet
      </h2>
      <p className="mt-1.5 max-w-xs text-sm text-surface-500 dark:text-surface-400">
        Set a target — problems solved, a rating milestone, or a streak — and
        track it automatically as you sync your platforms.
      </p>
      <Button onClick={onCreate} className="mt-6 gap-1.5">
        <Plus className="h-4 w-4" />
        Create your first goal
      </Button>
    </motion.div>
  );
}

export function GoalList({ goals }: Props) {
  const queryClient = useQueryClient();
  const [formGoal, setFormGoal] = useState<Goal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [goalPendingDelete, setGoalPendingDelete] = useState<Goal | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function invalidateGoals() {
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  }

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      invalidateGoals();
      setIsFormOpen(false);
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: GoalFormValues }) =>
      updateGoal(id, {
        title: values.title,
        target_value: values.target_value,
        deadline: values.deadline || null,
      }),
    onSuccess: () => {
      invalidateGoals();
      setIsFormOpen(false);
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      invalidateGoals();
      setGoalPendingDelete(null);
    },
  });

  function openCreateForm() {
    setFormGoal(null);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEditForm(goal: Goal) {
    setFormGoal(goal);
    setFormError(null);
    setIsFormOpen(true);
  }

  function handleFormSubmit(values: GoalFormValues) {
    setFormError(null);
    if (formGoal) {
      updateMutation.mutate({ id: formGoal.id, values });
    } else {
      createMutation.mutate({
        goal_type: values.goal_type,
        title: values.title,
        target_value: values.target_value,
        deadline: values.deadline || null,
      });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {goals.length === 0
            ? "Nothing tracked yet."
            : `${goals.length} goal${goals.length === 1 ? "" : "s"} tracked.`}
        </p>
        {goals.length > 0 && (
          <Button onClick={openCreateForm} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New goal
          </Button>
        )}
      </div>

      {goals.length === 0 ? (
        <EmptyState onCreate={openCreateForm} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={openEditForm}
                onDelete={setGoalPendingDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <GoalForm
        isOpen={isFormOpen}
        goal={formGoal}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        serverError={formError}
        onSubmit={handleFormSubmit}
        onClose={() => setIsFormOpen(false)}
      />

      <DeleteGoalDialog
        goal={goalPendingDelete}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => goalPendingDelete && deleteMutation.mutate(goalPendingDelete.id)}
        onCancel={() => setGoalPendingDelete(null)}
      />
    </div>
  );
}
