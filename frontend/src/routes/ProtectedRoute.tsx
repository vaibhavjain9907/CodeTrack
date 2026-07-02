/**
 * ProtectedRoute.
 *
 * Wraps any route that requires authentication. Renders a minimal
 * loading state while AuthContext's initial session-restore check is
 * in flight (isLoading), then either renders the route's children or
 * redirects to /login — never both, and never a flash of protected
 * content before the check resolves.
 */

import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/store/authStore";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
