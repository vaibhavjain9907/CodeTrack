/**
 * ProfileCard — displays the connected LeetCode user's identity.
 *
 * Shows: avatar, display name, username, global ranking, last sync time,
 * and a sync button.
 */

import { User, Hash, Clock, ExternalLink } from "lucide-react";
import type { LeetCodeProfile } from "@/types/leetcode";
import { SyncButton } from "./SyncButton";

interface ProfileCardProps {
  profile: LeetCodeProfile;
}

function formatSyncTime(synced_at: string | null): string {
  if (!synced_at) return "Never synced";
  const date = new Date(synced_at);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name ?? profile.leetcode_username}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-surface-100 dark:ring-surface-800"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/40 ring-2 ring-surface-100 dark:ring-surface-800">
              <User className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 truncate">
              {profile.display_name ?? profile.leetcode_username}
            </h2>
            <a
              href={`https://leetcode.com/${profile.leetcode_username}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              title="Open on LeetCode"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              @{profile.leetcode_username}
            </span>
            {profile.ranking != null && (
              <span className="flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                Rank {profile.ranking.toLocaleString()}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500">
            <Clock className="h-3 w-3" />
            Synced {formatSyncTime(profile.synced_at)}
          </div>
        </div>

        {/* Sync */}
        <div className="flex-shrink-0">
          <SyncButton />
        </div>
      </div>
    </div>
  );
}
