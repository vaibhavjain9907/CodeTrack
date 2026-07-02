/**
 * CfContestHistory — ranked table of contest results with rating delta.
 * This is the key differentiator from LeetCode — Codeforces actually
 * provides full contest rating history through its public API.
 */
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { CodeforcesContestResult } from "@/types/codeforces";

interface Props { contests: CodeforcesContestResult[] }

function RatingDelta({ change }: { change: number }) {
  if (change > 0) return <span className="flex items-center gap-1 text-success font-semibold"><TrendingUp className="h-3.5 w-3.5" />+{change}</span>;
  if (change < 0) return <span className="flex items-center gap-1 text-danger font-semibold"><TrendingDown className="h-3.5 w-3.5" />{change}</span>;
  return <span className="flex items-center gap-1 text-surface-400"><Minus className="h-3.5 w-3.5" />0</span>;
}

export function CfContestHistory({ contests }: Props) {
  if (contests.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4">Contest History</h2>
        <p className="text-sm text-surface-400 dark:text-surface-500 text-center py-6">No rated contests yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
      <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4">
        Contest History
        <span className="ml-2 text-xs font-normal text-surface-400">({contests.length} rated)</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 dark:border-surface-800 text-left text-xs text-surface-400 uppercase tracking-wide">
              <th className="pb-3 pr-4 font-medium">Contest</th>
              <th className="pb-3 pr-4 font-medium text-right">Rank</th>
              <th className="pb-3 pr-4 font-medium text-right">Rating</th>
              <th className="pb-3 font-medium text-right">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50 dark:divide-surface-800/50">
            {contests.map((c) => (
              <tr key={c.contest_id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30">
                <td className="py-3 pr-4">
                  <p className="font-medium text-surface-900 dark:text-surface-100 line-clamp-1">{c.contest_name}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{new Date(c.rating_update_time_seconds * 1000).toLocaleDateString()}</p>
                </td>
                <td className="py-3 pr-4 text-right text-surface-600 dark:text-surface-300">#{c.rank}</td>
                <td className="py-3 pr-4 text-right font-mono text-surface-700 dark:text-surface-200">{c.new_rating}</td>
                <td className="py-3 text-right"><RatingDelta change={c.rating_change} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
