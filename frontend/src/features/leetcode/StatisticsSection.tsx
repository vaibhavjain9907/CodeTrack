/**
 * StatisticsSection — displays LeetCode solve stats.
 *
 * Two parts:
 * 1. Top stat cards: total solved, acceptance rate, streak, contribution points.
 * 2. Difficulty breakdown: Easy / Medium / Hard progress bars.
 */

import { clsx } from "clsx";
import { Flame, CheckCircle2, Percent, Star } from "lucide-react";
import type { LeetCodeStatistics } from "@/types/leetcode";

interface StatisticsProps {
  stats: LeetCodeStatistics;
}

// ─── Top stat cards ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
            {label}
          </p>
          <p className={clsx("mt-1.5 text-2xl font-bold tabular-nums", accent)}>
            {value}
          </p>
          {sub && (
            <p className="mt-0.5 text-xs text-surface-400 dark:text-surface-500">
              {sub}
            </p>
          )}
        </div>
        <div
          className={clsx(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
            "bg-surface-50 dark:bg-surface-800",
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Difficulty progress bar ──────────────────────────────────────────────────

interface DifficultyBarProps {
  label: string;
  solved: number;
  total: number;
  color: string;
  bg: string;
  textColor: string;
}

function DifficultyBar({
  label,
  solved,
  total,
  color,
  bg,
  textColor,
}: DifficultyBarProps) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className={clsx("text-sm font-medium", textColor)}>{label}</span>
        <span className="text-sm font-semibold tabular-nums text-surface-700 dark:text-surface-300">
          {solved}
          <span className="font-normal text-surface-400 dark:text-surface-500">
            /{total}
          </span>
        </span>
      </div>
      <div className={clsx("h-2 w-full overflow-hidden rounded-full", bg)}>
        <div
          className={clsx("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-surface-400 dark:text-surface-500">
        {pct}%
      </p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function StatisticsSection({ stats }: StatisticsProps) {
  return (
    <div className="space-y-4">
      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Solved"
          value={stats.total_solved}
          sub={`of ${stats.total_questions} problems`}
          accent="text-brand-600 dark:text-brand-400"
          icon={<CheckCircle2 className="h-4.5 w-4.5 text-brand-500" />}
        />
        <StatCard
          label="Acceptance"
          value={
            stats.acceptance_rate != null
              ? `${stats.acceptance_rate.toFixed(1)}%`
              : "—"
          }
          sub="submissions accepted"
          accent="text-success"
          icon={<Percent className="h-4.5 w-4.5 text-success" />}
        />
        <StatCard
          label="Streak"
          value={stats.streak}
          sub={stats.streak === 1 ? "day" : "days"}
          accent="text-warning"
          icon={<Flame className="h-4.5 w-4.5 text-warning" />}
        />
        <StatCard
          label="Points"
          value={stats.contribution_points.toLocaleString()}
          sub="contribution"
          accent="text-surface-700 dark:text-surface-300"
          icon={<Star className="h-4.5 w-4.5 text-surface-400" />}
        />
      </div>

      {/* Difficulty breakdown */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
        <h3 className="mb-5 text-sm font-semibold text-surface-900 dark:text-surface-50">
          Difficulty Breakdown
        </h3>
        <div className="space-y-5">
          <DifficultyBar
            label="Easy"
            solved={stats.easy_solved}
            total={stats.easy_total}
            color="bg-success"
            bg="bg-success/10 dark:bg-success/20"
            textColor="text-success"
          />
          <DifficultyBar
            label="Medium"
            solved={stats.medium_solved}
            total={stats.medium_total}
            color="bg-warning"
            bg="bg-warning/10 dark:bg-warning/20"
            textColor="text-warning"
          />
          <DifficultyBar
            label="Hard"
            solved={stats.hard_solved}
            total={stats.hard_total}
            color="bg-danger"
            bg="bg-danger/10 dark:bg-danger/20"
            textColor="text-danger"
          />
        </div>
      </div>
    </div>
  );
}
