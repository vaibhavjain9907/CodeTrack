/**
 * Topbar.
 *
 * Shows the current page title (passed by each page) plus the
 * authenticated user's name and a sign-out action. Lives inside
 * DashboardLayout, not duplicated per-page.
 */

import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/common/Button";
import { useAuth } from "@/store/authStore";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-surface-200 bg-white/90 px-6 backdrop-blur-sm dark:border-surface-800 dark:bg-surface-900/90">
      <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-50">{title}</h1>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-surface-500 dark:text-surface-400 sm:block">
          {user?.full_name}
        </span>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="gap-1.5 px-3 py-1.5 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
