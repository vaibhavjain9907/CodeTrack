/**
 * Axios client for CodeTrack's API.
 *
 * Responsibilities:
 * 1. Prefix every request with VITE_API_BASE_URL.
 * 2. Attach `Authorization: Bearer <access_token>` to every request,
 *    reading the in-memory token via a getter (see tokenStore below)
 *    so this module never needs to import AuthContext directly
 *    (avoids a circular import: AuthContext uses apiClient, and
 *    apiClient would otherwise need AuthContext).
 * 3. On a 401 response, transparently call POST /auth/refresh once,
 *    update the stored access token, and retry the original request.
 *    Concurrent 401s while a refresh is already in flight are queued
 *    and replayed after that single refresh resolves, rather than
 *    each firing their own /auth/refresh call (our backend rotates
 *    refresh tokens — a second concurrent refresh call would revoke
 *    the first one mid-flight and cause spurious logouts).
 *
 * AuthContext is the only thing that calls `setTokens` / `clearTokens`
 * / `getAccessToken` from outside this module's own refresh logic.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { APIResponse } from "@/types/api";
import type { TokenPair } from "@/types/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

// ─── In-memory token store ──────────────────────────────────────────────────
// Deliberately NOT localStorage/sessionStorage: an access token sitting in
// browser storage is readable by any injected script (XSS), whereas an
// in-memory value disappears the moment the tab closes. The refresh token
// is also kept in memory here for the same reason — the tradeoff is that
// a hard page refresh logs the user out, which `refreshUser()` on app
// startup (calling /auth/refresh via a future httpOnly-cookie flow, or for
// now simply requiring re-login) is the accepted cost of this approach.

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setTokens(tokens: TokenPair): void {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
}

// ─── Axios instance ──────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

// ─── 401 → refresh → retry, with single-flight queueing ───────────────────

type QueuedRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let pendingQueue: QueuedRequest[] = [];

function resolveQueue(newAccessToken: string): void {
  pendingQueue.forEach(({ resolve }) => resolve(newAccessToken));
  pendingQueue = [];
}

function rejectQueue(error: unknown): void {
  pendingQueue.forEach(({ reject }) => reject(error));
  pendingQueue = [];
}

/**
 * Called by AuthContext to react to a fully-failed refresh (e.g. the
 * refresh token itself is expired/revoked) — typically navigates the
 * user to /login. Kept as an injectable callback rather than a direct
 * import so apiClient has no dependency on React Router or context.
 */
let onRefreshFailure: (() => void) | null = null;

export function setOnRefreshFailure(callback: () => void): void {
  onRefreshFailure = callback;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    const isUnauthorized = error.response?.status === 401;
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    // Never attempt to "refresh" on the auth endpoints themselves —
    // a 401 from /auth/login or /auth/refresh means the credentials
    // or refresh token are genuinely invalid, not that the access
    // token expired.
    if (!isUnauthorized || !originalRequest || isAuthEndpoint || originalRequest._retried) {
      return Promise.reject(error);
    }

    if (!refreshToken) {
      onRefreshFailure?.();
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    if (isRefreshing) {
      // A refresh is already in flight — queue this request and
      // replay it once that refresh resolves, instead of firing a
      // second concurrent /auth/refresh call.
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken) => {
            originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post<APIResponse<TokenPair>>(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
      );
      const newTokens = data.data;
      if (!newTokens) {
        throw new Error("Refresh response did not contain a token pair.");
      }

      setTokens(newTokens);
      resolveQueue(newTokens.access_token);

      originalRequest.headers.set("Authorization", `Bearer ${newTokens.access_token}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      rejectQueue(refreshError);
      onRefreshFailure?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
