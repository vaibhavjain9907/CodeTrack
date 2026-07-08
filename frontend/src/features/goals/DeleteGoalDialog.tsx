/**
 * DeleteGoalDialog — confirmation dialog for goal deletion.
 * Mirrors GoalForm's overlay/panel pattern (no shared Modal primitive).
 */
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/common/Button";
import type { Goal } from "@/types/goals";

interface Props {
  goal: Goal | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteGoalDialog({ goal, isDeleting, onConfirm, onCancel }: Props) {
  const isOpen = goal !== null;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && goal && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-surface-950/50 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="panel"
              role="alertdialog"
              aria-modal="true"
              aria-label="Delete goal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-sm rounded-2xl border border-surface-200 bg-white p-6 shadow-popover dark:border-surface-800 dark:bg-surface-900"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger/10">
                <AlertTriangle className="h-5 w-5 text-danger" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-surface-900 dark:text-surface-50">
                Delete &ldquo;{goal.title}&rdquo;?
              </h2>
              <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">
                This can&apos;t be undone. Your progress data on connected platforms is
                unaffected — only this goal is removed.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button type="button" variant="danger" isLoading={isDeleting} onClick={onConfirm}>
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
