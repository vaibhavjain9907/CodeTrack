/**
 * DashboardLayout.
 *
 * The shared shell for every authenticated page: Sidebar on the left
 * (desktop) / slide-in drawer (mobile), Topbar across the top, content
 * area in between. Pages provide their own content as children and a
 * title string for the Topbar — they should never render their own nav.
 */

import { type ReactNode, useState } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onMenuClick={() => setIsMobileNavOpen(true)} />
        <main className="mx-auto w-full flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
