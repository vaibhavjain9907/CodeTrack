/**
 * Goal types.
 *
 * Mirrors backend/app/schemas/goal.py exactly. goal_type values match
 * app/models/enums.py's GoalType — snake_case, no transformation.
 */

export type GoalType =
  | "leetcode_problems"
  | "leetcode_rating"
  | "codeforces_problems"
  | "codeforces_rating"
  | "daily_streak";

export interface Goal {
  id: number;
  user_id: number;
  goal_type: GoalType;
  title: string;
  target_value: number;
  deadline: string | null;
  current_value: number;
  progress_percentage: number;
  is_achieved: boolean;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalCreateRequest {
  goal_type: GoalType;
  title: string;
  target_value: number;
  deadline: string | null;
}

export interface GoalUpdateRequest {
  title: string;
  target_value: number;
  deadline: string | null;
}

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  leetcode_problems: "Solve LeetCode Problems",
  leetcode_rating: "Reach LeetCode Rating",
  codeforces_problems: "Solve Codeforces Problems",
  codeforces_rating: "Reach Codeforces Rating",
  daily_streak: "Daily Streak",
};

export const GOAL_TYPE_UNITS: Record<GoalType, string> = {
  leetcode_problems: "problems",
  leetcode_rating: "rating",
  codeforces_problems: "problems",
  codeforces_rating: "rating",
  daily_streak: "days",
};
