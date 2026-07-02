/**
 * LeetCode API functions.
 *
 * Thin typed wrappers around apiClient for all /leetcode/* endpoints.
 *
 * Adapted from the original Module 4B implementation: that version
 * assumed raw, unwrapped response bodies. Our real backend (built
 * during reconciliation) wraps every response in the standard
 * {success, message, data} envelope — see src/types/api.ts — so every
 * function here unwraps `.data.data`, matching the pattern already
 * used in src/api/auth.ts and src/api/dashboard.ts.
 *
 * Note: getLeetCodeStatistics() is kept for API completeness but has
 * no backing endpoint — the backend nests statistics inside the
 * profile response (LeetCodeProfile.statistics) rather than exposing
 * a separate /leetcode/statistics route, since the frontend's actual
 * usage (ProfileCard, StatisticsSection) only ever needs them
 * alongside the rest of the profile. Calling it will 404.
 */

import { apiClient } from "@/api/client";
import type { APIResponse } from "@/types/api";
import type {
  LeetCodeConnectRequest,
  LeetCodeProfile,
  LeetCodeStatistics,
  LeetCodeSubmission,
  LeetCodeSyncResponse,
} from "@/types/leetcode";

/** Connect a LeetCode username to the authenticated user's account. */
export async function connectLeetCode(payload: LeetCodeConnectRequest): Promise<LeetCodeProfile> {
  const { data } = await apiClient.post<APIResponse<LeetCodeProfile>>(
    "/leetcode/connect",
    payload,
  );
  if (!data.data) throw new Error(data.message);
  return data.data;
}

/** Trigger a manual sync of LeetCode data. */
export async function syncLeetCode(): Promise<LeetCodeSyncResponse> {
  const { data } = await apiClient.post<APIResponse<LeetCodeSyncResponse>>("/leetcode/sync");
  if (!data.data) throw new Error(data.message);
  return data.data;
}

/** Get the connected LeetCode profile (with nested statistics). */
export async function getLeetCodeProfile(): Promise<LeetCodeProfile> {
  const { data } = await apiClient.get<APIResponse<LeetCodeProfile>>("/leetcode/profile");
  if (!data.data) throw new Error(data.message);
  return data.data;
}

/**
 * Get LeetCode solve statistics. No backing endpoint today — prefer
 * reading `.statistics` off getLeetCodeProfile()'s result instead.
 */
export async function getLeetCodeStatistics(): Promise<LeetCodeStatistics> {
  const { data } = await apiClient.get<APIResponse<LeetCodeStatistics>>("/leetcode/statistics");
  if (!data.data) throw new Error(data.message);
  return data.data;
}

/** Get recent LeetCode submissions. */
export async function getLeetCodeSubmissions(limit = 20): Promise<LeetCodeSubmission[]> {
  const { data } = await apiClient.get<APIResponse<LeetCodeSubmission[]>>(
    `/leetcode/submissions?limit=${limit}`,
  );
  if (!data.data) throw new Error(data.message);
  return data.data;
}
