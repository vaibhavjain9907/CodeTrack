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
 *
 * Presentation note: "best day", "current streak", "longest streak"
 * and the month labels are all derived client-side from the same
 * `days` array the backend already returns — no new endpoint, no new
 * fetch, just reading the payload we already have to give the graph
 * more editorial context instead of leaving it as a bare grid.
 */

import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { fetchDashboardHeatmap } from "@/api/dashboard";
import type { HeatmapDay } from "@/types/dashboard";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function colorForCount(count: number): string {
  if (count === 0) return "bg-surface-100 dark:bg-surface-800/70";
  if (count <= 2) return "bg-brand-100 dark:bg-brand-900/70";
  if (count <= 5) return "bg-brand-300 dark:bg-brand-700/80";
  if (count <= 9) return "bg-brand-500 dark:bg-brand-500";
  return "bg-brand-700 dark:bg-brand-300/90";
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

/** Longest run of consecutive active (count > 0) days anywhere in the window. */
function longestStreak(days: HeatmapDay[]): number {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    if (day.count > 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

/** Trailing run of consecutive active days ending at the last entry in `days`. */
function currentStreak(days: HeatmapDay[]): number {
  let current = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].count > 0) current += 1;
    else break;
  }
  return current;
}

function bestDay(days: HeatmapDay[]): HeatmapDay | null {
  if (days.length === 0) return null;
  return days.reduce((best, day) => (day.count > best.count ? day : best), days[0]);
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** One label per week where the month differs from the previous week's —
 * mirrors GitHub's contribution graph month row. Purely derived from the
 * dates already in `weeks`, no new data. */
function buildMonthLabels(weeks: (HeatmapDay | null)[][]): (string | null)[] {
  let lastMonth = -1;
  return weeks.map((week) => {
    const firstDay = week.find((d): d is HeatmapDay => d !== null);
    if (!firstDay) return null;
    const month = new Date(firstDay.date).getMonth();
    if (month === lastMonth) return null;
    lastMonth = month;
    return MONTH_LABELS[month];
  });
}

function HeatmapSkeleton() {
  return (
    <div className="h-[240px] animate-pulse rounded-[20px] border border-surface-200 bg-surface-100 dark:border-surface-800 dark:bg-surface-800" />
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
      <div className="rounded-[20px] border border-surface-200 bg-white p-6 text-sm text-surface-500 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400">
        Couldn&apos;t load your activity heatmap right now.
      </div>
    );
  }

  const weeks = buildWeeks(data.days);
  const monthLabels = buildMonthLabels(weeks);
  const best = bestDay(data.days);
  const longest = longestStreak(data.days);
  const current = currentStreak(data.days);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="overflow-hidden rounded-[20px] border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-surface-100 px-7 py-6 dark:border-surface-800 sm:flex-row sm:items-center sm:px-9">
        <div>
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
            Activity
          </h2>
          <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
            Contribution history over the last year
          </p>
        </div>
        <span className="font-mono text-2xl font-semibold tabular-nums text-surface-900 dark:text-surface-50">
          {data.total_submissions}
          <span className="ml-1.5 font-sans text-xs font-medium text-surface-400 dark:text-surface-500">
            submissions
          </span>
        </span>
      </div>

      {/* Derived stat strip — reads the same `days` payload, no new fetch */}
      <div className="grid grid-cols-3 divide-x divide-surface-100 border-b border-surface-100 dark:divide-surface-800 dark:border-surface-800">
        <div className="flex items-center gap-2.5 px-7 py-4 sm:px-9">
          <Zap className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />
          <div>
            <p className="font-mono text-lg font-semibold leading-none text-surface-900 dark:text-surface-50">
              {current}
              <span className="ml-1 font-sans text-[11px] font-medium text-surface-400">
                days
              </span>
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-surface-400 dark:text-surface-500">
              Current streak
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-7 py-4 sm:px-9">
          <Trophy className="h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="font-mono text-lg font-semibold leading-none text-surface-900 dark:text-surface-50">
              {longest}
              <span className="ml-1 font-sans text-[11px] font-medium text-surface-400">
                days
              </span>
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-surface-400 dark:text-surface-500">
              Longest streak
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 px-7 py-4 sm:px-9">
          <Flame className="h-4 w-4 shrink-0 text-success" />
          <div>
            <p className="font-mono text-lg font-semibold leading-none text-surface-900 dark:text-surface-50">
              {best ? best.count : 0}
              <span className="ml-1 font-sans text-[11px] font-medium text-surface-400">
                on best day
              </span>
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-surface-400 dark:text-surface-500">
              {best ? formatShortDate(best.date) : "No data yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-7 py-7 sm:px-9">
        <div className="overflow-x-auto scrollbar-thin">
          <div style={{ minWidth: `${weeks.length * 13 + 24}px` }}>
            {/* Month row */}
            <div className="mb-1 flex gap-[3px] pl-[24px]">
              {monthLabels.map((label, i) => (
                <div key={i} className="w-[10px] text-[9px] leading-[10px] text-surface-400">
                  {label && <span className="whitespace-nowrap">{label}</span>}
                </div>
              ))}
            </div>

            <div className="flex gap-[3px]">
              <div className="flex w-[24px] shrink-0 flex-col gap-[3px]">
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
                      <div key={day.date} className="group/cell relative">
                        <div
                          aria-label={`${formatFullDate(day.date)}: ${day.count} submission${day.count === 1 ? "" : "s"}`}
                          className={`h-[10px] w-[10px] rounded-sm transition-transform duration-100 group-hover/cell:scale-125 group-hover/cell:ring-1 group-hover/cell:ring-surface-400 dark:group-hover/cell:ring-surface-500 ${colorForCount(day.count)}`}
                        />
                        {/* Animated hover tooltip — CSS-driven for performance
                            across ~365 cells, same easing language as the
                            rest of the app's motion. */}
                        <div
                          role="tooltip"
                          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 scale-90 whitespace-nowrap rounded-md bg-surface-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-popover transition-all duration-150 ease-out group-hover/cell:scale-100 group-hover/cell:opacity-100 dark:bg-surface-100 dark:text-surface-900"
                        >
                          <span className="font-semibold">{day.count}</span>{" "}
                          {day.count === 1 ? "submission" : "submissions"}
                          <span className="ml-1 text-surface-400 dark:text-surface-500">
                            · {formatShortDate(day.date)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div key={`empty-${weekIndex}-${dayIndex}`} className="h-[10px] w-[10px]" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
          className="mt-5 flex items-center justify-end gap-1.5 text-[10px] text-surface-400"
        >
          <span>Less</span>
          {[
            "bg-surface-100 dark:bg-surface-800/70",
            "bg-brand-100 dark:bg-brand-900/70",
            "bg-brand-300 dark:bg-brand-700/80",
            "bg-brand-500 dark:bg-brand-500",
            "bg-brand-700 dark:bg-brand-300/90",
          ].map((swatch, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1 } }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`h-[10px] w-[10px] rounded-sm ${swatch}`}
            />
          ))}
          <span>More</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
