/**
 * TypeScript types for LeetCode API responses.
 *
 * Mirrors backend app/schemas/leetcode.py — keep in sync.
 */

// ─── API response shapes ──────────────────────────────────────────────────────

export interface LeetCodeStatistics {
  total_solved: number;
  total_questions: number;
  easy_solved: number;
  easy_total: number;
  medium_solved: number;
  medium_total: number;
  hard_solved: number;
  hard_total: number;
  acceptance_rate: number | null;
  contribution_points: number;
  streak: number;
}

export interface LeetCodeProfile {
  id: number;
  user_id: number;
  leetcode_username: string;
  display_name: string | null;
  avatar_url: string | null;
  ranking: number | null;
  synced_at: string | null;
  statistics: LeetCodeStatistics | null;
}

export interface LeetCodeSubmission {
  submission_id: number;
  title_slug: string;
  title: string;
  status: string;
  language: string;
  timestamp: number;
  runtime: string | null;
  memory: string | null;
  difficulty: string | null;
}

export interface LeetCodeSyncResponse {
  message: string;
  synced_at: string;
  submissions_saved: number;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface LeetCodeConnectRequest {
  username: string;
}
