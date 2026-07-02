/**
 * Generic API response envelope.
 *
 * Mirrors backend/app/schemas/response.py — every successful response
 * from our FastAPI backend is wrapped in this exact shape. Keep these
 * two files in sync; this is the single source of truth on the
 * frontend for "what does a response from our API look like".
 */
export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Error response shape, produced by the backend's global exception
 * handlers (app/core/exception_handlers.py) for 4xx/5xx/422 responses.
 */
export interface APIErrorResponse {
  success: false;
  message: string;
  errors: Array<{ field: string; message: string }> | null;
}
