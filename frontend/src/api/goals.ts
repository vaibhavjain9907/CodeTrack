/**
 * Goal API functions.
 *
 * Thin typed wrappers around apiClient for all /goals/* endpoints.
 * Every call unwraps the backend's {success, message, data} envelope,
 * consistent with api/codeforces.ts and api/leetcode.ts.
 */

import { apiClient } from "@/api/client";
import type { APIResponse } from "@/types/api";
import type { Goal, GoalCreateRequest, GoalUpdateRequest } from "@/types/goals";

export async function createGoal(payload: GoalCreateRequest): Promise<Goal> {
  const { data } = await apiClient.post<APIResponse<Goal>>("/goals", payload);
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function listGoals(): Promise<Goal[]> {
  const { data } = await apiClient.get<APIResponse<Goal[]>>("/goals");
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function getGoal(goalId: number): Promise<Goal> {
  const { data } = await apiClient.get<APIResponse<Goal>>(`/goals/${goalId}`);
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function updateGoal(goalId: number, payload: GoalUpdateRequest): Promise<Goal> {
  const { data } = await apiClient.put<APIResponse<Goal>>(`/goals/${goalId}`, payload);
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function deleteGoal(goalId: number): Promise<void> {
  await apiClient.delete<APIResponse<null>>(`/goals/${goalId}`);
}

export async function refreshGoals(): Promise<Goal[]> {
  const { data } = await apiClient.post<APIResponse<Goal[]>>("/goals/refresh");
  if (!data.data) throw new Error(data.message);
  return data.data;
}
