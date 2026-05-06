// lib/api/error.ts  — shared error extraction helpers
import type { AxiosError } from "axios";
import type { ApiError } from "./types";

/** Extract a human-readable message from an Axios error */
export function getErrorMessage(error: unknown): string {
  const e = error as AxiosError<ApiError>;
  if (!e.response) return "Network error — check your connection.";

  const status = e.response.status;
  const data = e.response.data;

  if (status === 429) return "Too many requests — please wait a moment and try again.";
  if (status === 401) return "Session expired. Please log in again.";
  if (status === 403) return "Access denied. Your session may have expired.";
  if (status === 502) return "Service temporarily unavailable. Please try again shortly.";

  // FastAPI returns { detail: "..." }
  if (data?.detail) return String(data.detail);
  if (data?.message) return data.message;

  return `Request failed (${status})`;
}

/** Returns true when the error is an HTTP 429 rate-limit hit */
export function isRateLimitError(error: unknown): boolean {
  const e = error as AxiosError;
  return e.response?.status === 429;
}

/** Returns true when the error is an auth error (401 or 403) */
export function isAuthError(error: unknown): boolean {
  const e = error as AxiosError;
  return e.response?.status === 401 || e.response?.status === 403;
}

/** Normalise snake_case backend user to camelCase */
export function normaliseUser(u: Record<string, unknown>) {
  return {
    ...u,
    fullName: (u.fullName ?? u.full_name ?? "") as string,
    createdAt: (u.createdAt ?? u.created_at ?? "") as string,
    updatedAt: (u.updatedAt ?? u.updated_at ?? "") as string,
  };
}
