/**
 * DashboardPage.
 *
 * The authenticated landing page (route: /dashboard). Composes the
 * Module 5 widgets inside DashboardLayout. Each child component owns
 * its own data fetching and loading/error state — this page is pure
 * composition, no fetching of its own, with one deliberate exception:
 *
 * The hero banner below wants a streak badge and a platform-status
 * indicator. Rather than invent a new endpoint or move OverviewCards'
 * fetch up here, it calls `useQuery` with the *exact same* key/fn
 * (`["dashboard-summary"]`, `fetchDashboardSummary`) that OverviewCards
 * already uses. TanStack Query dedupes identical keys across
 * components by design, so this doesn't trigger a second network
 * request or create a second source of truth — it's the same cached
 * entry, read from two places.
 */

import { type ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, RefreshCw } from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ActivityHeatmap } from "@/features/dashboard/ActivityHeatmap";
import { GoalProgress } from "@/features/dashboard/GoalProgress";
import { OverviewCards } from "@/features/dashboard/OverviewCards";
import { PlatformCards } from "@/features/dashboard/PlatformCards";
import { RecentActivity } from "@/features/dashboard/RecentActivity";
import { fetchDashboardSummary } from "@/api/dashboard";
import { useAuth } from "@/store/authStore";

const sectionVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" as const } },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Hero banner: greeting, today's date, a live streak badge and platform
 * status (both read from the shared dashboard-summary cache — see file
 * header), and a presentational "quick sync" action mirroring the one in
 * the Topbar. This is UI only; it doesn't call a sync endpoint. */
function Hero() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const firstName = user?.full_name?.split(" ")[0];

  function handleSync() {
    if (isSyncing) return;
    setIsSyncing(true);
    window.setTimeout(() => setIsSyncing(false), 1200);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[24px] border border-surface-200 bg-gradient-to-br from-white via-white to-brand-50/40 p-8 dark:border-surface-800 dark:from-surface-900 dark:via-surface-900 dark:to-brand-950/30 sm:p-10"
    >
      {/* Subtle grain texture — reads as "developer tool" rather than a visible pattern */}
      <div className="bg-noise pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* Two soft ambient glows — decorative only, not a full-bleed gradient */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-400/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-success/5 blur-3xl dark:bg-success/10"
        aria-hidden="true"
      />

      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
            {formatToday()}
          </p>
          <h1 className="mt-2 text-[28px] font-bold tracking-tight text-surface-900 dark:text-surface-50 sm:text-[34px]">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ""} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">
            Welcome back. Keep your coding streak alive today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-surface-200 bg-white/70 px-3.5 py-2 text-sm font-medium text-surface-700 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-900/60 dark:text-surface-200">
            <Flame className="h-4 w-4 text-warning" />
            {data ? (
              <span className="font-mono tabular-nums">{data.current_streak_days}-day streak</span>
            ) : (
              <span className="text-surface-400">—</span>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-surface-200 bg-white/70 px-3.5 py-2 text-sm font-medium text-surface-700 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-900/60 dark:text-surface-200">
            <span
              className={`h-2 w-2 rounded-full ${
                data && data.connected_platform_count > 0 ? "bg-success" : "bg-surface-400"
              }`}
            />
            {data ? (
              <span className="font-mono tabular-nums">
                {data.connected_platform_count}/{data.active_platform_count} platforms
              </span>
            ) : (
              <span className="text-surface-400">—</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSync}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            <motion.span
              animate={isSyncing ? { rotate: 360 } : { rotate: 0 }}
              transition={
                isSyncing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.2 }
              }
              className="flex"
            >
              <RefreshCw className="h-4 w-4" />
            </motion.span>
            Quick sync
          </button>
        </div>
      </div>
    </motion.div>
  );
}

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
        <Hero />

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
