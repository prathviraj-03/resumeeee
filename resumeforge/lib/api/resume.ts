// lib/api/resume.ts  — uses Profile Service via API Gateway
import apiClient from "./client";
import { API_ENDPOINTS } from "@/lib/config";
import type { Resume, UploadResumeResponse, DownloadUrlResponse } from "./types";

export async function listResumes(): Promise<Resume[]> {
  const res = await apiClient.get<{ total: number; data: Resume[] }>(API_ENDPOINTS.profile.resumeList);
  return res.data.data || [];
}


export async function uploadResume(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResumeResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post<UploadResumeResponse>(
    "/api/profile/resumes",   // Profile service handles upload directly
    form,
    {
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    }
  );
  return res.data;
}

export async function getResumeMeta(resumeId: string): Promise<Resume> {
  const res = await apiClient.get<Resume>(`/api/profile/resumes/${resumeId}`);
  return res.data;
}

export async function getDownloadUrl(resumeId: string): Promise<DownloadUrlResponse> {
  const res = await apiClient.get<DownloadUrlResponse>(
    API_ENDPOINTS.profile.resumeDownload(resumeId)
  );
  return res.data;
}

export async function deleteResume(resumeId: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.profile.resumeDelete(resumeId));
}
