/**
 * CfProfileCard — shows handle, avatar, rank, rating, and key stats.
 */
import { User, MapPin, Building2, TrendingUp } from "lucide-react";
import type { CodeforcesProfile } from "@/types/codeforces";
import { CF_RANK_COLORS } from "@/types/codeforces";

function getRankColor(rank: string | null): string {
  if (!rank) return "#808080";
  return CF_RANK_COLORS[rank.toLowerCase()] ?? "#808080";
}

interface Props { profile: CodeforcesProfile }

export function CfProfileCard({ profile }: Props) {
  const rankColor = getRankColor(profile.rank);
  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.handle} className="h-16 w-16 rounded-full border-2 border-surface-200 dark:border-surface-700 object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <User className="h-8 w-8 text-surface-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">{profile.handle}</h2>
            {profile.rank && (
              <span className="text-sm font-semibold capitalize" style={{ color: rankColor }}>
                {profile.rank}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-surface-500 dark:text-surface-400">
            {profile.country && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.country}</span>}
            {profile.organization && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{profile.organization}</span>}
          </div>
        </div>
        <div className="flex gap-4 sm:gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{profile.rating ?? "—"}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">Rating</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{profile.total_solved}</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">Solved</p>
          </div>
          {profile.max_rating && (
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-success" />{profile.max_rating}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400">Peak</p>
            </div>
          )}
        </div>
      </div>
      {profile.synced_at && (
        <p className="mt-4 text-xs text-surface-400 dark:text-surface-500">
          Last synced: {new Date(profile.synced_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
