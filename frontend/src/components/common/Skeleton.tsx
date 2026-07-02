/**
 * Skeleton — animated placeholder for loading states.
 *
 * Used wherever data is being fetched to prevent layout shift
 * and provide a polished loading experience.
 */

import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-lg bg-surface-200 dark:bg-surface-700",
        className,
      )}
    />
  );
}

/** Full LeetCode dashboard skeleton */
export function LeetCodeSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile card skeleton */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 space-y-2"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Difficulty breakdown skeleton */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Submissions skeleton */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-surface-100 dark:border-surface-800 pb-3 last:border-0 last:pb-0"
            >
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-20 ml-auto" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
