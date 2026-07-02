/**
 * StatCard.
 *
 * Generic overview metric card. Used for total problems solved,
 * current streak, longest streak, and connected platform count.
 */

import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  suffix?: string;
  accent?: "brand" | "success" | "warning";
}

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400",
  success: "bg-green-50 text-success dark:bg-green-900/30",
  warning: "bg-amber-50 text-warning dark:bg-amber-900/30",
};

export function StatCard({ label, value, icon: Icon, suffix, accent = "brand" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
          {label}
        </span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClasses[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-surface-900 dark:text-surface-50">
        {value}
        {suffix && <span className="ml-1 text-sm font-medium text-surface-400">{suffix}</span>}
      </p>
    </div>
  );
}
