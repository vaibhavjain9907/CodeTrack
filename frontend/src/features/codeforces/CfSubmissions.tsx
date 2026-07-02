/**
 * CfSubmissions — shows recent submissions including all verdicts.
 * Unlike LeetCode's accepted-only feed, Codeforces returns every
 * submission (WRONG_ANSWER, TLE, etc.) giving a richer history.
 */
import type { CodeforcesSubmission } from "@/types/codeforces";
import { clsx } from "clsx";

const VERDICT_STYLES: Record<string, string> = {
  OK: "bg-green-50 text-success dark:bg-green-900/20",
  WRONG_ANSWER: "bg-red-50 text-danger dark:bg-red-900/20",
  TIME_LIMIT_EXCEEDED: "bg-amber-50 text-warning dark:bg-amber-900/20",
  MEMORY_LIMIT_EXCEEDED: "bg-amber-50 text-warning dark:bg-amber-900/20",
  COMPILATION_ERROR: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300",
  RUNTIME_ERROR: "bg-orange-50 text-orange-600 dark:bg-orange-900/20",
};

const VERDICT_LABELS: Record<string, string> = {
  OK: "Accepted",
  WRONG_ANSWER: "Wrong Answer",
  TIME_LIMIT_EXCEEDED: "TLE",
  MEMORY_LIMIT_EXCEEDED: "MLE",
  COMPILATION_ERROR: "Compile Error",
  RUNTIME_ERROR: "Runtime Error",
  CHALLENGED: "Challenged",
  SKIPPED: "Skipped",
};

function formatMemory(bytes: number): string {
  if (bytes === 0) return "—";
  return `${Math.round(bytes / 1024)} KB`;
}

interface Props { submissions: CodeforcesSubmission[] }

export function CfSubmissions({ submissions }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
        <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4">Recent Submissions</h2>
        <p className="text-sm text-surface-400 text-center py-6">No submissions found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
      <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-4">Recent Submissions</h2>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 dark:border-surface-800 text-left text-xs text-surface-400 uppercase tracking-wide">
              <th className="pb-3 pr-4 font-medium">Problem</th>
              <th className="pb-3 pr-4 font-medium">Verdict</th>
              <th className="pb-3 pr-4 font-medium text-right">Rating</th>
              <th className="pb-3 pr-4 font-medium text-right">Time</th>
              <th className="pb-3 font-medium text-right">Memory</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50 dark:divide-surface-800/50">
            {submissions.map((s) => {
              const verdictStyle = s.verdict ? (VERDICT_STYLES[s.verdict] ?? "bg-surface-50 text-surface-500") : "";
              const verdictLabel = s.verdict ? (VERDICT_LABELS[s.verdict] ?? s.verdict) : "—";
              return (
                <tr key={s.submission_id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-surface-900 dark:text-surface-100">
                      {s.contest_id && <span className="text-xs text-surface-400 mr-1">{s.problem_index}</span>}
                      {s.problem_name}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {new Date(s.creation_time_seconds * 1000).toLocaleDateString()} · {s.programming_language}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", verdictStyle)}>
                      {verdictLabel}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-surface-600 dark:text-surface-300">
                    {s.problem_rating ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-surface-600 dark:text-surface-300">
                    {s.time_consumed_millis > 0 ? `${s.time_consumed_millis} ms` : "—"}
                  </td>
                  <td className="py-3 text-right font-mono text-xs text-surface-600 dark:text-surface-300">
                    {formatMemory(s.memory_consumed_bytes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile list */}
      <div className="sm:hidden space-y-3">
        {submissions.map((s) => {
          const verdictStyle = s.verdict ? (VERDICT_STYLES[s.verdict] ?? "bg-surface-50 text-surface-500") : "";
          const verdictLabel = s.verdict ? (VERDICT_LABELS[s.verdict] ?? s.verdict) : "—";
          return (
            <div key={s.submission_id} className="rounded-xl border border-surface-100 dark:border-surface-800 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100 flex-1 min-w-0 truncate">{s.problem_name}</p>
                <span className={clsx("shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", verdictStyle)}>{verdictLabel}</span>
              </div>
              <p className="mt-1 text-xs text-surface-400">{s.programming_language} · {new Date(s.creation_time_seconds * 1000).toLocaleDateString()}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
