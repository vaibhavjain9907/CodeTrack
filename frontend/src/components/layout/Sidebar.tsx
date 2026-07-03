/**
 * Sidebar.
 *
 * Persistent left navigation for authenticated pages. On desktop it's a
 * fixed rail; on small screens it becomes a slide-in drawer controlled by
 * `isOpen` / `onClose` (triggered from the Topbar's menu button).
 */
import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Code2, LayoutDashboard, Settings, Trophy, User, X, Zap } from "lucide-react";

import { useAuth } from "@/store/authStore";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leetcode", label: "LeetCode", icon: Trophy },
  { to: "/codeforces", label: "Codeforces", icon: Zap },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Logo() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-surface-200 px-5 dark:border-surface-800">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
        <Code2 className="h-4 w-4 text-white" />
      </div>
      <span className="text-[15px] font-semibold tracking-tight text-surface-900 dark:text-surface-50">
        CodeTrack
      </span>
    </div>
  );
}

function NavList({ onNavigate, pillId }: { onNavigate?: () => void; pillId: string }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3 scrollbar-thin">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          end={to === "/dashboard"}
          className="relative"
        >
          {({ isActive }) => (
            <div
              className={clsx(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "text-brand-700 dark:text-brand-300"
                  : "text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800/70 dark:hover:text-surface-100",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={pillId}
                  className="absolute inset-0 rounded-md bg-brand-50 dark:bg-brand-500/10"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4 shrink-0" />
              <span className="relative z-10">{label}</span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  const initials =
    user?.full_name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <NavLink
      to="/profile"
      className="flex shrink-0 items-center gap-3 border-t border-surface-200 px-4 py-3.5 transition-colors hover:bg-surface-100 dark:border-surface-800 dark:hover:bg-surface-800/70"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-200 text-xs font-semibold text-surface-700 dark:bg-surface-800 dark:text-surface-200">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">
          {user?.full_name ?? "Loading…"}
        </p>
        <p className="truncate text-xs text-surface-500 dark:text-surface-400">View profile</p>
      </div>
    </NavLink>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Lock body scroll and allow Escape to close while the mobile drawer is open.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900 md:flex">
        <Logo />
        <NavList pillId="sidebar-active-pill-desktop" />
        <ProfileSection />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-surface-950/50 md:hidden"
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col bg-white shadow-popover dark:bg-surface-900 md:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 px-4 dark:border-surface-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
                    <Code2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[15px] font-semibold tracking-tight text-surface-900 dark:text-surface-50">
                    CodeTrack
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close navigation"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <NavList onNavigate={onClose} pillId="sidebar-active-pill-mobile" />
              <ProfileSection />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
