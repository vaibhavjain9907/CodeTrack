/**
 * Codeforces API functions.
 *
 * Thin typed wrappers around apiClient for all /codeforces/* endpoints.
 * Every call unwraps the backend's {success, message, data} envelope,
 * consistent with api/auth.ts, api/dashboard.ts, and api/leetcode.ts.
 */

import { apiClient } from "@/api/client";
import type { APIResponse } from "@/types/api";
import type {
  CodeforcesConnectRequest,
  CodeforcesContestResult,
  CodeforcesProfile,
  CodeforcesSubmission,
  CodeforcesSyncResponse,
} from "@/types/codeforces";

export async function connectCodeforces(
  payload: CodeforcesConnectRequest,
): Promise<CodeforcesProfile> {
  const { data } = await apiClient.post<APIResponse<CodeforcesProfile>>(
    "/codeforces/connect",
    payload,
  );
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function syncCodeforces(): Promise<CodeforcesSyncResponse> {
  const { data } = await apiClient.post<APIResponse<CodeforcesSyncResponse>>("/codeforces/sync");
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function getCodeforcesProfile(): Promise<CodeforcesProfile> {
  const { data } = await apiClient.get<APIResponse<CodeforcesProfile>>("/codeforces/profile");
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function getCodeforcesSubmissions(limit = 20): Promise<CodeforcesSubmission[]> {
  const { data } = await apiClient.get<APIResponse<CodeforcesSubmission[]>>(
    `/codeforces/submissions?limit=${limit}`,
  );
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function getCodeforcesContests(limit = 50): Promise<CodeforcesContestResult[]> {
  const { data } = await apiClient.get<APIResponse<CodeforcesContestResult[]>>(
    `/codeforces/contests?limit=${limit}`,
  );
  if (!data.data) throw new Error(data.message);
  return data.data;
}
