/**
 * DashboardPage.
 *
 * The authenticated landing page (route: /dashboard). Composes the
 * Module 5 widgets inside DashboardLayout. Each child component owns
 * its own data fetching and loading/error state — this page is pure
 * composition, no fetching of its own.
 */

import { type ReactNode } from "react";
import { motion } from "framer-motion";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ActivityHeatmap } from "@/features/dashboard/ActivityHeatmap";
import { GoalProgress } from "@/features/dashboard/GoalProgress";
import { OverviewCards } from "@/features/dashboard/OverviewCards";
import { PlatformCards } from "@/features/dashboard/PlatformCards";
import { RecentActivity } from "@/features/dashboard/RecentActivity";

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" as const } },
};

/** A quiet, numbered section marker — mono index + a rule that trails off,
 * borrowed from changelog-style layouts rather than a generic <h2>. */
function SectionHeader({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="font-mono text-xs text-surface-300 dark:text-surface-700">{index}</span>
      <h2 className="text-sm font-semibold text-surface-900 dark:text-surface-50">{title}</h2>
      {description && (
        <span className="hidden text-xs text-surface-400 dark:text-surface-600 sm:inline">
          {description}
        </span>
      )}
      <span className="h-px flex-1 bg-surface-200 dark:bg-surface-800" aria-hidden="true" />
    </div>
  );
}

function Section({ children }: { children: ReactNode }) {
  return (
    <motion.div initial="hidden" animate="show" variants={sectionVariants}>
      {children}
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="flex flex-col gap-12 pb-8">
        <Section>
          <OverviewCards />
        </Section>

        <Section>
          <ActivityHeatmap />
        </Section>

        <div className="grid grid-cols-1 gap-x-10 gap-y-12 lg:grid-cols-3">
          <div className="flex flex-col gap-12 lg:col-span-2">
            <Section>
              <SectionHeader index="01" title="Platforms" description="Connected accounts" />
              <PlatformCards />
            </Section>

            <Section>
              <RecentActivity />
            </Section>
          </div>

          <Section>
            <SectionHeader index="02" title="Goals" description="This month" />
            <GoalProgress />
          </Section>
        </div>
      </div>
    </DashboardLayout>
  );
}
