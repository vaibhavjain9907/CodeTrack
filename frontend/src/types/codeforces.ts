/**
 * Codeforces types.
 *
 * Mirrors backend/app/schemas/codeforces.py. Field names are
 * snake_case to match the FastAPI JSON output directly — no
 * camelCase transformation, consistent with how we handle
 * LeetCode and auth types throughout the app.
 */

export interface CodeforcesProfile {
  id: number;
  user_id: number;
  handle: string;
  avatar_url: string | null;
  country: string | null;
  organization: string | null;
  rank: string | null;
  rating: number | null;
  max_rank: string | null;
  max_rating: number | null;
  contribution: number;
  total_solved: number;
  synced_at: string | null;
}

export interface CodeforcesSubmission {
  submission_id: number;
  contest_id: number | null;
  problem_index: string;
  problem_name: string;
  problem_rating: number | null;
  programming_language: string;
  verdict: string | null;
  passed_test_count: number;
  time_consumed_millis: number;
  memory_consumed_bytes: number;
  creation_time_seconds: number;
}

export interface CodeforcesContestResult {
  contest_id: number;
  contest_name: string;
  rank: number;
  old_rating: number;
  new_rating: number;
  rating_update_time_seconds: number;
  rating_change: number;
}

export interface CodeforcesSyncResponse {
  message: string;
  synced_at: string;
  submissions_saved: number;
  contests_saved: number;
}

export interface CodeforcesConnectRequest {
  handle: string;
}

/** Codeforces rank colour thresholds — matches the official CF rank system. */
export const CF_RANK_COLORS: Record<string, string> = {
  newbie: "#808080",
  pupil: "#008000",
  specialist: "#03a89e",
  expert: "#0000ff",
  "candidate master": "#aa00aa",
  master: "#ff8c00",
  "international master": "#ff8c00",
  grandmaster: "#ff0000",
  "international grandmaster": "#ff0000",
  "legendary grandmaster": "#ff0000",
};
