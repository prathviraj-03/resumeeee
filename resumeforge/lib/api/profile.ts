import apiClient from "./client";
import { API_ENDPOINTS } from "@/lib/config";
import { UserProfile, UpdateProfileRequest } from "./types";

/**
 * Fetches the current user's profile details from the Profile Service.
 */
export async function getUserProfile(): Promise<UserProfile> {
  const res = await apiClient.get<UserProfile>(API_ENDPOINTS.profile.get);
  return res.data;
}

/**
 * Updates the user's profile details.
 */
export async function updateUserProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const res = await apiClient.put<UserProfile>(API_ENDPOINTS.profile.update, data);
  return res.data;
}

/**
 * Upserts the user's master profile via the setup wizard.
 */
export async function setupProfile(data: any): Promise<any> {
  const res = await apiClient.post<any>(API_ENDPOINTS.profile.setup, data);
  return res.data;
}

/**
 * Fetches the completion score and missing fields.
 */
export async function getProfileCompletion(): Promise<{ score: number; missing_fields: string[] }> {
  const res = await apiClient.get<{ score: number; missing_fields: string[] }>(API_ENDPOINTS.profile.completion);
  return res.data;
}
