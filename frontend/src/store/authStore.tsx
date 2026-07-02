/**
 * AuthContext.
 *
 * The single source of truth on the frontend for "who is logged in".
 * Deliberately minimal — this is NOT a reimplementation of the
 * backend's auth logic (that lives entirely in app/services/auth_service.py
 * and app/security/*). This context only:
 *
 *   1. Holds the current user + tokens in React state.
 *   2. Calls the real /auth/login, /auth/register, /auth/logout,
 *      /auth/me endpoints we already built.
 *   3. On mount, tries to restore a session via /auth/me (which works
 *      whenever apiClient has tokens — i.e. immediately after login/
 *      register in the same tab session) and resolves the loading
 *      state so consumers know whether to render the app shell or
 *      redirect to /login.
 *   4. Registers itself with apiClient's refresh-failure callback, so
 *      a refresh-token rejection anywhere in the app (any 401 that
 *      survives the interceptor's retry) clears local state too.
 *
 * Token persistence, refresh-token rotation, and retry-on-401 already
 * live in src/api/client.ts — this file does not duplicate any of
 * that logic, it just reacts to it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "@/api/auth";
import { clearTokens, getRefreshToken, setOnRefreshFailure, setTokens } from "@/api/client";
import type { LoginRequest, RegisterRequest, UserPublic } from "@/types/auth";

interface AuthContextValue {
  user: UserPublic | null;
  isAuthenticated: boolean;
  /** True only during the initial session-restore check on app load. */
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const { tokens, user: loggedInUser } = await loginUser(payload);
    setTokens(tokens);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const { tokens, user: registeredUser } = await registerUser(payload);
    setTokens(tokens);
    setUser(registeredUser);
  }, []);

  const logout = useCallback(async () => {
    const token = getRefreshToken();
    if (token) {
      // Best-effort: even if the network call fails (e.g. already
      // offline), we still clear local state so the UI reflects
      // "logged out" immediately.
      try {
        await logoutUser(token);
      } catch {
        // Intentionally swallowed — see comment above.
      }
    }
    clearTokens();
    setUser(null);
  }, []);

  // On app startup, there are no tokens yet (we deliberately don't
  // persist them to storage — see src/api/client.ts), so there is
  // nothing to restore within the same browser session after a full
  // reload. This effect exists for the case where AuthProvider mounts
  // after a login/register already populated tokens earlier in the
  // same session (e.g. a top-level remount), and to give the rest of
  // the app a single, reliable "loading" → "resolved" lifecycle to
  // depend on.
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      if (!getRefreshToken()) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  // Wire apiClient's "refresh ultimately failed" callback to clear
  // local auth state, so a revoked/expired session anywhere in the
  // app correctly drops the user back to a logged-out state instead
  // of leaving stale `user` data in context.
  useEffect(() => {
    setOnRefreshFailure(() => {
      clearTokens();
      setUser(null);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
