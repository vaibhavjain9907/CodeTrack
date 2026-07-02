/**
 * User and authentication types.
 *
 * Mirrors backend/app/schemas/user.py and backend/app/schemas/auth.py.
 * Keep field names and casing identical to the Pydantic schemas —
 * FastAPI returns snake_case JSON by default and we deliberately do
 * not transform it, to avoid a whole class of "works on backend,
 * silently undefined on frontend" bugs.
 */

export type UserRole = "user" | "admin";

export interface UserPublic {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  tokens: TokenPair;
  user: UserPublic;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
}
