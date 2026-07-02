/**
 * DashboardPage.
 *
 * The authenticated landing page (route: /dashboard). Composes the
 * Module 5 widgets inside DashboardLayout. Each child component owns
 * its own data fetching and loading/error state — this page is pure
 * composition, no fetching of its own.
 */

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ActivityHeatmap } from "@/features/dashboard/ActivityHeatmap";
import { GoalProgress } from "@/features/dashboard/GoalProgress";
import { OverviewCards } from "@/features/dashboard/OverviewCards";
import { PlatformCards } from "@/features/dashboard/PlatformCards";
import { RecentActivity } from "@/features/dashboard/RecentActivity";

export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="flex flex-col gap-6">
        <OverviewCards />

        <ActivityHeatmap />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-surface-900 dark:text-surface-50">
                Platforms
              </h2>
              <PlatformCards />
            </div>
            <RecentActivity />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-surface-900 dark:text-surface-50">
              Goals
            </h2>
            <GoalProgress />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
