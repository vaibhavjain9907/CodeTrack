/**
 * Auth API functions.
 *
 * Thin typed wrappers around apiClient for all /auth/* endpoints.
 * Every call unwraps the backend's APIResponse envelope and returns
 * just the `data` payload — callers never deal with {success,
 * message, data} directly.
 */

import { apiClient } from "@/api/client";
import type { APIResponse } from "@/types/api";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  TokenPair,
  UserPublic,
} from "@/types/auth";

export async function registerUser(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<APIResponse<AuthResponse>>("/auth/register", payload);
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<APIResponse<AuthResponse>>("/auth/login", payload);
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const { data } = await apiClient.post<APIResponse<TokenPair>>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  if (!data.data) throw new Error(data.message);
  return data.data;
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await apiClient.post<APIResponse<null>>("/auth/logout", { refresh_token: refreshToken });
}

export async function fetchCurrentUser(): Promise<UserPublic> {
  const { data } = await apiClient.get<APIResponse<UserPublic>>("/auth/me");
  if (!data.data) throw new Error(data.message);
  return data.data;
}
