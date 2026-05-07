// lib/api/ai.ts  — uses AI Service via API Gateway (/api/ai/v1/*)
import apiClient from "./client";
import { API_ENDPOINTS, config } from "@/lib/config";
import { toast } from "sonner";
import type {
  OptimizeResult,
} from "./types";

// ── Resume Optimization ────────────────────────────────────────────────────
// Sends job_description + template_id to AI service.
// The AI service fetches the master profile internally via X-User-Id header.
// Returns the completed result directly (synchronous pipeline — no Celery).
export async function startOptimize(
  payload: { jobDescription: string; templateId?: string },
): Promise<OptimizeResult> {
  const res = await apiClient.post<OptimizeResult>(API_ENDPOINTS.ai.startOptimize, {
    job_description: payload.jobDescription,
    template_id: payload.templateId || "resume.html",
  });
  return res.data;
}

export async function pollOptimize(jobId: string): Promise<OptimizeResult> {
  const res = await apiClient.get<OptimizeResult>(API_ENDPOINTS.ai.pollOptimize(jobId));
  const data = res.data;

  // Normalise field names (snake_case -> camelCase)
  data.jobId = data.jobId ?? (data as any).job_id ?? jobId;
  data.bullets = data.bullets ?? data.optimized_bullets ?? [];
  data.originalScore = data.originalScore ?? (data as any).original_score ?? 0;
  data.optimizedScore = data.optimizedScore ?? (data as any).optimized_score ?? 0;

  // Fix relative download URL — backend returns /api/v1/download/{id}
  // Gateway routes /api/ai/* to the AI service, so we rewrite it.
  const dlUrl = (data as any).download_url ?? data.downloadUrl;
  if (dlUrl && dlUrl.startsWith("/api/v1")) {
    // /api/v1/download/{id} → /api/ai/v1/download/{id} (via Gateway)
    data.downloadUrl = `${config.apiBaseUrl}/api/ai${dlUrl}`;
    data.download_url = data.downloadUrl;
  }

  return data;
}

/**
 * Download an optimized resume PDF from the AI service.
 * The backend proxies bytes directly — no Cloudinary URL redirect.
 * Uses blob fetch to trigger a real browser file download.
 */
export async function downloadOptimizedPdf(jobId: string, filename = "optimized_resume.pdf") {
  const url = `${config.apiBaseUrl}/api/ai/v1/download/${jobId}`;
  try {
    const response = await apiClient.get(url, { responseType: "blob" });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error: any) {
    console.error("PDF download failed:", error);
    toast.error("Download failed: " + (error.message || "Try again"));
  }
}

// ── ATS Scorer ──────────────────────────────────────────────────────────────
export async function calculateAtsScore(payload: { jobDescription: string }): Promise<any> {
  const res = await apiClient.post(API_ENDPOINTS.ai.calculateATS, {
    jobDescription: payload.jobDescription,
  });
  return res.data;
}
