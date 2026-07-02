/**
 * DashboardLayout.
 *
 * The shared shell for every authenticated page: Sidebar on the left
 * (desktop) / bottom (mobile), Topbar across the top, content area in
 * between. Pages provide their own content as children and a title
 * string for the Topbar — they should never render their own nav.
 */

import { type ReactNode } from "react";

import { MobileNav, Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 md:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
