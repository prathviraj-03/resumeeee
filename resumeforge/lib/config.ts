// lib/config.ts
// All requests go to the API Gateway at http://localhost:8000
// The gateway routes /api/<service>/* to the correct microservice.

export const config = {
  // Single entry point — API Gateway
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  allowedFileTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  allowedExtensions: [".pdf", ".docx"],
  jdMinLength: 50,
  pollingInterval: 3000,
  pollingMaxRetries: 60,
  tokenKey: "rf_access_token",
  refreshTokenKey: "rf_refresh_token",
  tokenExpiryKey: "rf_token_expiry",
};

export const API_ENDPOINTS = {
  auth: {
    register:       "/api/auth/register",
    login:          "/api/auth/login",
    refresh:        "/api/auth/refresh",
    logout:         "/api/auth/logout",
    me:             "/api/auth/me",
    forgotPassword: "/api/auth/forgot-password",
  },
  profile: {
    get:            "/api/profile",
    update:         "/api/profile",
    setup:          "/api/profile/setup",
    completion:     "/api/profile/completion",
    resumeList:     "/api/profile/resumes",
    resumeDownload: (id: string) => `/api/profile/resumes/${id}/download`,
    resumeDelete:   (id: string) => `/api/profile/resumes/${id}`,
  },

  ai: {
    // Core optimization pipeline
    startOptimize:     "/api/ai/v1/optimize",
    pollOptimize:      (jobId: string) => `/api/ai/v1/optimize/${jobId}`,
    downloadOptimized: (jobId: string) => `/api/ai/v1/download/${jobId}`,
    // Job history
    listJobs:          "/api/ai/v1/jobs",
    deleteJob:         (jobId: string) => `/api/ai/v1/jobs/${jobId}`,
  },
  templates: {
    list:    "/api/templates",
    create:  "/api/templates",
    tokens:  "/api/templates/tokens",
    get:     (id: string) => `/api/templates/${id}`,
    update:  (id: string) => `/api/templates/${id}`,
    delete:  (id: string) => `/api/templates/${id}`,
    render:  (id: string) => `/api/templates/${id}/render`,
  },
  interview: {
    start:        "/api/interview/session/start",
    list:         "/api/interview/session/sessions",
    session:      (id: string) => `/api/interview/session/${id}`,
    submitAnswer: (id: string) => `/api/interview/session/${id}/answer`,
    uploadAudio:  (id: string, resId: string) => `/api/interview/session/${id}/answer/${resId}/audio`,
    end:          (id: string) => `/api/interview/session/${id}/end`,
    questions:    "/api/interview/questions",
  },
  skills: {
    analyze:         "/api/skill-gap/analyze",
    generate:        "/api/skill-gap/generate",
  },
};
