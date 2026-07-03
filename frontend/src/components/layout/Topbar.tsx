/**
 * Topbar.
 *
 * Shows the current page title (passed by each page), a command-style
 * search field, theme toggle, notifications, a manual sync action, and
 * the authenticated user's profile menu (with sign-out). Lives inside
 * DashboardLayout, not duplicated per-page.
 *
 * Search, notifications and sync are presentational in this sprint —
 * they don't call any API yet. Sign-out is the only action wired to
 * real auth logic, unchanged from before.
 */
import { ThemeSwitch } from "@/components/common/ThemeSwitch";
import { type RefObject, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";

import { useAuth } from "@/store/authStore";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

/** Closes a panel when a click/tap lands outside every ref in `refs`. */
function useClickOutside(refs: Array<RefObject<HTMLElement>>, onOutside: () => void) {
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const clickedInside = refs.some((ref) => ref.current?.contains(target));
      if (!clickedInside) onOutside();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [refs, onOutside]);
}

function useTheme() {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", shouldBeDark);
    setIsDark(shouldBeDark);
  }, []);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return { isDark, toggle };
}

const MOCK_NOTIFICATIONS = [
  { id: 1, text: "Your Codeforces rating synced — up 42 points.", time: "2h ago" },
  { id: 2, text: "3 new LeetCode submissions detected.", time: "5h ago" },
  { id: 3, text: "Weekly progress summary is ready.", time: "1d ago" },
];

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle: toggleTheme } = useTheme();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside([notifRef], () => setNotifOpen(false));
  useClickOutside([profileRef], () => setProfileOpen(false));

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function handleSync() {
    if (isSyncing) return;
    setIsSyncing(true);
    // Presentational only — wire up to the real sync endpoint when available.
    window.setTimeout(() => setIsSyncing(false), 1200);
  }

  const initials =
    user?.full_name
      ?.split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-surface-200 bg-white/90 px-4 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-900/90 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="shrink-0 truncate text-lg font-semibold text-surface-900 dark:text-surface-50">
        {title}
      </h1>

      {/* Search */}
      <div className="relative ml-2 hidden flex-1 max-w-md items-center sm:flex">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-surface-400" />
        <input
          type="search"
          placeholder="Search…"
          aria-label="Search"
          className="w-full rounded-lg border border-surface-200 bg-surface-50 py-1.5 pl-9 pr-14 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 dark:border-surface-700 dark:bg-surface-800/60 dark:text-surface-50 dark:placeholder:text-surface-500"
        />
        <kbd className="pointer-events-none absolute right-2.5 rounded border border-surface-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-surface-400 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-500">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Sync */}
        <button
          type="button"
          onClick={handleSync}
          aria-label="Sync data"
          title="Sync data"
          className="flex h-9 w-9 items-center justify-center rounded-md text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
        >
          <motion.span
            animate={isSyncing ? { rotate: 360 } : { rotate: 0 }}
            transition={isSyncing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.2 }}
            className="flex"
          >
            <RefreshCw className="h-4 w-4" />
          </motion.span>
        </button>

        {/* Theme toggle */}
       <ThemeSwitch
    checked={isDark}
    onChange={toggleTheme}
/>
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((open) => !open);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-lg border border-surface-200 bg-white shadow-popover dark:border-surface-800 dark:bg-surface-900"
              >
                <div className="border-b border-surface-200 px-4 py-3 dark:border-surface-800">
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
                    Notifications
                  </p>
                </div>
                <ul className="max-h-72 overflow-y-auto scrollbar-thin">
                  {MOCK_NOTIFICATIONS.map((notification) => (
                    <li
                      key={notification.id}
                      className="border-b border-surface-100 px-4 py-3 last:border-b-0 hover:bg-surface-50 dark:border-surface-800/60 dark:hover:bg-surface-800/50"
                    >
                      <p className="text-sm text-surface-700 dark:text-surface-300">
                        {notification.text}
                      </p>
                      <p className="mt-0.5 text-xs text-surface-400 dark:text-surface-500">
                        {notification.time}
                      </p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative pl-1">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotifOpen(false);
            }}
            aria-label="Account menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-200 text-xs font-semibold text-surface-700 dark:bg-surface-800 dark:text-surface-200">
              {initials}
            </div>
            <span className="hidden text-sm text-surface-600 dark:text-surface-300 sm:block">
              {user?.full_name}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-surface-400 sm:block" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-surface-200 bg-white py-1.5 shadow-popover dark:border-surface-800 dark:bg-surface-900"
              >
                <div className="px-3.5 py-2">
                  <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">
                    {user?.full_name}
                  </p>
                  <p className="truncate text-xs text-surface-500 dark:text-surface-400">
                    {user?.email}
                  </p>
                </div>
                <div className="my-1 h-px bg-surface-100 dark:bg-surface-800" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800/70"
                >
                  <UserIcon className="h-4 w-4 text-surface-400" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800/70"
                >
                  <Settings className="h-4 w-4 text-surface-400" />
                  Settings
                </button>
                <div className="my-1 h-px bg-surface-100 dark:bg-surface-800" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
