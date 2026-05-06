// lib/api/templates.ts — Template CRUD (DOCX) + PDF generation pipeline

import apiClient from "./client";
import { API_ENDPOINTS } from "@/lib/config";
import type {
  ResumeTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  SupportedToken,
  GeneratePdfRequest,
  GeneratePdfResponse,
} from "./types";

// ── Template CRUD ──────────────────────────────────────────────────────────

export async function listTemplates(): Promise<ResumeTemplate[]> {
  const res = await apiClient.get<ResumeTemplate[]>(API_ENDPOINTS.templates.list);
  return res.data;
}

export async function getTemplate(id: string): Promise<ResumeTemplate> {
  const res = await apiClient.get<ResumeTemplate>(API_ENDPOINTS.templates.get(id));
  return res.data;
}

export async function createTemplate(data: CreateTemplateRequest): Promise<ResumeTemplate> {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  formData.append("file", data.file);
  if (data.is_default) formData.append("is_default", String(data.is_default));

  const res = await apiClient.post<ResumeTemplate>(API_ENDPOINTS.templates.create, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateTemplate(
  id: string,
  data: UpdateTemplateRequest
): Promise<ResumeTemplate> {
  const res = await apiClient.put<ResumeTemplate>(API_ENDPOINTS.templates.update(id), data);
  return res.data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.templates.delete(id));
}

// ── Token support ──────────────────────────────────────────────────────────

export async function getSupportedTokens(): Promise<SupportedToken[]> {
  const res = await apiClient.get<SupportedToken[]>(API_ENDPOINTS.templates.tokens);
  return res.data;
}

// PDF generation from the AI service was removed in v2.
// Use the Optimize flow (POST /api/ai/v1/optimize) to generate PDFs.

/**
 * Render a DOCX template → returns a blob URL for direct download.
 * The backend streams the PDF binary directly (no cross-origin Cloudinary URL).
 */
export async function renderAndDownload(
  templateId: string,
  overrides?: Record<string, any>
): Promise<string> {
  const res = await apiClient.post(
    API_ENDPOINTS.templates.render(templateId),
    { overrides: overrides ?? {} },
    { responseType: "blob" }
  );
  // Create a local object URL from the PDF blob
  const blob = new Blob([res.data], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

// ── Helper: trigger browser download ──────────────────────────────────────

export function triggerDownload(url: string, filename = "resume.pdf") {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke blob URL to free memory
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
