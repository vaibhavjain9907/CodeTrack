/**
 * Dashboard API functions.
 *
 * Thin typed wrappers around apiClient for all /dashboard/* endpoints.
 */

import { apiClient } from "@/api/client";
import type { APIResponse } from "@/types/api";
import type { DashboardSummary, HeatmapResponse, PlatformsResponse } from "@/types/dashboard";

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<APIResponse<DashboardSummary>>("/dashboard/summary");
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function fetchDashboardHeatmap(days = 365): Promise<HeatmapResponse> {
  const { data } = await apiClient.get<APIResponse<HeatmapResponse>>("/dashboard/heatmap", {
    params: { days },
  });
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function fetchDashboardPlatforms(): Promise<PlatformsResponse> {
  const { data } = await apiClient.get<APIResponse<PlatformsResponse>>("/dashboard/platforms");
  if (!data.data) throw new Error(data.message);
  return data.data;
}
