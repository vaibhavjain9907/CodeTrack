/**
 * Dashboard types.
 *
 * Mirrors backend/app/schemas/dashboard.py exactly. Note that every
 * field here is currently a real, honest zero/empty value — there is
 * no LeetCode/Codeforces integration yet, so a brand-new user and an
 * existing user look identical on this dashboard today. See that
 * schema file's docstring for the rationale.
 */

export interface PlatformSummary {
  platform: string;
  connected: boolean;
  total_solved: number;
  rating: number | null;
  last_synced_at: string | null;
}

export interface DashboardSummary {
  total_problems_solved: number;
  current_streak_days: number;
  longest_streak_days: number;
  active_platform_count: number;
  connected_platform_count: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface HeatmapResponse {
  days: HeatmapDay[];
  total_submissions: number;
}

export interface PlatformsResponse {
  platforms: PlatformSummary[];
}
