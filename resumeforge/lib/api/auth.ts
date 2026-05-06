// lib/api/auth.ts
import apiClient, { setTokens, clearTokens } from "./client";
import { API_ENDPOINTS } from "@/lib/config";
import type { LoginRequest, RegisterRequest, AuthResponse, User } from "./types";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.login, data);
  // Backend returns accessToken and refreshToken directly on data
  setTokens(res.data.accessToken, res.data.refreshToken);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.register, data);
  // Backend returns accessToken and refreshToken directly on data
  setTokens(res.data.accessToken, res.data.refreshToken);
  return res.data;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post(API_ENDPOINTS.auth.logout);
  } finally {
    clearTokens();
  }
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>(API_ENDPOINTS.auth.me);
  return res.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.auth.forgotPassword, { email });
}

export async function refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await apiClient.post<{ accessToken: string; refreshToken: string }>(
    API_ENDPOINTS.auth.refresh
  );
  return res.data;
}
