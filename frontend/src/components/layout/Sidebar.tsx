/**
 * Sidebar.
 *
 * Persistent left navigation for authenticated pages. Collapses to a
 * bottom bar on small screens rather than disappearing entirely.
 */
import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { Code2, LayoutDashboard, Settings, Trophy, User, Zap } from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leetcode", label: "LeetCode", icon: Trophy },
  { to: "/codeforces", label: "Codeforces", icon: Zap },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 flex-col border-r border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900 md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-surface-200 px-6 dark:border-surface-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <Code2 className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold tracking-tight text-surface-900 dark:text-surface-50">CodeTrack</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400"
                  : "text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900 md:hidden">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium",
              isActive ? "text-brand-600 dark:text-brand-400" : "text-surface-500 dark:text-surface-400",
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span className="hidden sm:block">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
