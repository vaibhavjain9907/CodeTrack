/**
 * ActivityHeatmap.
 *
 * Renders a GitHub-style contribution calendar: one column per week,
 * one row per day-of-week (Sun-Sat), cells shaded by submission
 * count. Fetches GET /dashboard/heatmap (365-day window) and owns its
 * own loading/error states.
 *
 * Layout approach: the backend always returns a contiguous run of
 * days ending today. We bucket them into weeks starting on Sunday so
 * the grid lines up with the familiar GitHub layout, padding the
 * first week with empty cells if the data doesn't start on a Sunday.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchDashboardHeatmap } from "@/api/dashboard";
import type { HeatmapDay } from "@/types/dashboard";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function colorForCount(count: number): string {
  if (count === 0) return "bg-surface-100 dark:bg-surface-800";
  if (count <= 2) return "bg-brand-200 dark:bg-brand-900";
  if (count <= 5) return "bg-brand-400 dark:bg-brand-700";
  if (count <= 9) return "bg-brand-600 dark:bg-brand-500";
  return "bg-brand-800 dark:bg-brand-300";
}

/** Groups a contiguous day list into Sunday-starting weeks, padding the first week. */
function buildWeeks(days: HeatmapDay[]): (HeatmapDay | null)[][] {
  if (days.length === 0) return [];

  const firstDayOfWeek = new Date(days[0].date).getDay(); // 0 = Sunday
  const padded: (HeatmapDay | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...days,
  ];

  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

function HeatmapSkeleton() {
  return (
    <div className="h-[140px] animate-pulse rounded-xl border border-surface-200 bg-surface-100 dark:border-surface-800 dark:bg-surface-800" />
  );
}

export function ActivityHeatmap() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-heatmap"],
    queryFn: () => fetchDashboardHeatmap(365),
  });

  if (isLoading) return <HeatmapSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-5 text-sm text-surface-500 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400">
        Couldn&apos;t load your activity heatmap right now.
      </div>
    );
  }

  const weeks = buildWeeks(data.days);

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-800 dark:bg-surface-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
          Activity in the last year
        </h2>
        <span className="text-xs text-surface-500 dark:text-surface-400">
          {data.total_submissions} submissions
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-[3px]" style={{ minWidth: `${weeks.length * 13}px` }}>
          <div className="flex flex-col gap-[3px] pr-1">
            {DAY_LABELS.map((label, i) => (
              <div
                key={label}
                className="h-[10px] text-[9px] leading-[10px] text-surface-400"
                style={{ visibility: i % 2 === 0 ? "visible" : "hidden" }}
              >
                {label}
              </div>
            ))}
          </div>

          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) =>
                day ? (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} submission${day.count === 1 ? "" : "s"}`}
                    className={`h-[10px] w-[10px] rounded-sm ${colorForCount(day.count)}`}
                  />
                ) : (
                  <div key={`empty-${weekIndex}-${dayIndex}`} className="h-[10px] w-[10px]" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-surface-400">
        <span>Less</span>
        <div className="h-[10px] w-[10px] rounded-sm bg-surface-100 dark:bg-surface-800" />
        <div className="h-[10px] w-[10px] rounded-sm bg-brand-200 dark:bg-brand-900" />
        <div className="h-[10px] w-[10px] rounded-sm bg-brand-400 dark:bg-brand-700" />
        <div className="h-[10px] w-[10px] rounded-sm bg-brand-600 dark:bg-brand-500" />
        <div className="h-[10px] w-[10px] rounded-sm bg-brand-800 dark:bg-brand-300" />
        <span>More</span>
      </div>
    </div>
  );
}
