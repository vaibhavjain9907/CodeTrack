/**
 * RecentSubmissions — table of the user's most recent LeetCode submissions.
 *
 * Columns: problem title (links to LeetCode), status badge, language, runtime,
 * memory, time ago.
 */

import { clsx } from "clsx";
import { ExternalLink, Inbox } from "lucide-react";
import type { LeetCodeSubmission } from "@/types/leetcode";

interface RecentSubmissionsProps {
  submissions: LeetCodeSubmission[];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Accepted:
    "bg-success/10 text-success dark:bg-success/20",
  "Wrong Answer":
    "bg-danger/10 text-danger dark:bg-danger/20",
  "Time Limit Exceeded":
    "bg-warning/10 text-warning dark:bg-warning/20",
  "Memory Limit Exceeded":
    "bg-warning/10 text-warning dark:bg-warning/20",
  "Runtime Error":
    "bg-danger/10 text-danger dark:bg-danger/20",
  "Compile Error":
    "bg-danger/10 text-danger dark:bg-danger/20",
};

function statusStyle(status: string): string {
  return (
    STATUS_STYLES[status] ??
    "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300"
  );
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "text-success",
  Medium: "text-warning",
  Hard: "text-danger",
};

// ─── Language display name map ────────────────────────────────────────────────

const LANG_DISPLAY: Record<string, string> = {
  python3: "Python 3",
  python: "Python",
  cpp: "C++",
  c: "C",
  java: "Java",
  javascript: "JS",
  typescript: "TS",
  rust: "Rust",
  go: "Go",
  kotlin: "Kotlin",
  swift: "Swift",
  csharp: "C#",
  ruby: "Ruby",
  scala: "Scala",
  php: "PHP",
};

function formatLang(lang: string): string {
  return LANG_DISPLAY[lang.toLowerCase()] ?? lang;
}

// ─── Time formatter ───────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-800">
        <Inbox className="h-6 w-6 text-surface-400" />
      </div>
      <p className="text-sm font-medium text-surface-600 dark:text-surface-400">
        No submissions yet
      </p>
      <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
        Solve a problem on LeetCode, then sync to see it here.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
        <h3 className="mb-4 text-sm font-semibold text-surface-900 dark:text-surface-50">
          Recent Submissions
        </h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-50">
          Recent Submissions
        </h3>
        <span className="text-xs text-surface-400 dark:text-surface-500">
          Last {submissions.length}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 dark:border-surface-800">
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
                Problem
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
                Status
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
                Lang
              </th>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
                Runtime
              </th>
              <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
                When
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {submissions.map((sub) => (
              <tr
                key={sub.submission_id}
                className="group hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
              >
                <td className="py-3 pr-4">
                  <a
                    href={`https://leetcode.com/problems/${sub.title_slug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-medium text-surface-800 dark:text-surface-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    <span className="line-clamp-1">{sub.title}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  {sub.difficulty && (
                    <span
                      className={clsx(
                        "text-xs font-medium",
                        DIFFICULTY_STYLES[sub.difficulty] ?? "text-surface-400",
                      )}
                    >
                      {sub.difficulty}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={clsx(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      statusStyle(sub.status),
                    )}
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs text-surface-600 dark:text-surface-400">
                    {formatLang(sub.language)}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs text-surface-500 dark:text-surface-400">
                    {sub.runtime ?? "—"}
                  </span>
                </td>
                <td className="py-3 text-right text-xs text-surface-400 dark:text-surface-500">
                  {timeAgo(sub.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="sm:hidden space-y-3">
        {submissions.map((sub) => (
          <div
            key={sub.submission_id}
            className="flex items-start justify-between gap-3 border-b border-surface-100 dark:border-surface-800 pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <a
                href={`https://leetcode.com/problems/${sub.title_slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-surface-800 dark:text-surface-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
              >
                {sub.title}
              </a>
              <div className="mt-1 flex items-center gap-2 text-xs text-surface-400">
                {sub.difficulty && (
                  <span
                    className={clsx(
                      "font-medium",
                      DIFFICULTY_STYLES[sub.difficulty] ?? "",
                    )}
                  >
                    {sub.difficulty}
                  </span>
                )}
                <span className="font-mono">{formatLang(sub.language)}</span>
                <span>{timeAgo(sub.timestamp)}</span>
              </div>
            </div>
            <span
              className={clsx(
                "flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                statusStyle(sub.status),
              )}
            >
              {sub.status === "Accepted" ? "AC" : sub.status.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
