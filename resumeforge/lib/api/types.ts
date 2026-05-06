// lib/api/types.ts  — TypeScript interfaces matching real backend contracts

// ─── Auth ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  fullName: string;   // mapped from full_name if backend uses snake_case
  full_name?: string;
  role: "user" | "premium" | "admin";
  avatar?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  is_setup_done?: boolean;
  completion_score?: number;
}

export interface AuthTokens {
  accessToken: string;
  access_token?: string;
  refreshToken: string;
  refresh_token?: string;
  expiresIn?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  [key: string]: any;
}
// ─── Profile / User Detail (Profile Service) ──────────────────────────────
export interface UserProfile {
  profile_id: string;
  user_id: string;
  full_name?: string;
  phone_number?: string;
  email?: string;
  location?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  avatar_url?: string;
  target_role?: string;
  target_industry?: string;
  years_experience?: number;
  summary?: string;
  skills?: string[];
  certifications?: string[];
  languages?: string[];
  experience?: any[];
  education?: any[];
  projects?: any[];
  awards?: any[];
  is_setup_done?: boolean;
  completion_score?: number;
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone_number?: string;
  email?: string;
  location?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  target_role?: string;
  target_industry?: string;
  years_experience?: number;
  summary?: string;
  skills?: string[];
  certifications?: string[];
  languages?: string[];
  experience?: any[];
  education?: any[];
  projects?: any[];
  awards?: any[];
}

// ─── Profile / Resume documents (Profile Service) ─────────────────────────
export type ResumeStatus = "processing" | "ready" | "error" | "uploaded";

export interface Resume {
  id: string;
  resume_id?: string;
  userId?: string;
  user_id?: string;
  filename: string;

  original_filename?: string;
  originalFilename?: string;
  version?: number;
  fileSize?: number;
  file_size?: number;
  mimeType?: string;
  mime_type?: string;
  isActive?: boolean;
  is_active?: boolean;
  status: ResumeStatus;
  storagePath?: string;
  storage_path?: string;
  cloudinaryUrl?: string;
  cloudinary_url?: string;
  uploadedAt?: string;
  uploaded_at?: string;
  updatedAt?: string;
  updated_at?: string;
  createdAt?: string;
  created_at?: string;
}

export interface UploadResumeResponse {
  id: string;
  resume_id: string;
  filename: string;
  status: string;
  parsed_data?: any;
  message: string;
}

export interface DownloadUrlResponse {
  url: string;
  download_url?: string;
  expiresAt?: string;
  expires_at?: string;
}

// ─── AI Service ────────────────────────────────────────────────────────────
export interface ATSScoreRequest {
  resumeId: string;
  jobDescription: string;
  userId?: string;
}


export interface ScorePillar {
  name: string;
  score: number;
  weight: number;
  description?: string;
}

export interface ATSScoreResult {
  id?: string;
  score_id?: string;
  resume_id: string;
  user_id: string;
  composite_score: number;
  keyword_score: number;
  semantic_score: number;
  format_score: number;
  keyword_matches: string[];
  keyword_gaps: string[];
  section_analysis: Record<string, string>;
  category_scores?: Record<string, number>;
  feedback?: string[];
  red_flags?: string[];
  cached?: boolean;
}

export type OptimizeStatus =
  | "pending"
  | "queued"
  | "analyzing"
  | "processing"
  | "generating"
  | "completed"
  | "failed";

export interface OptimizeRequest {
  resumeId: string;
  jobDescription: string;
  userId?: string;
  templateId?: string;
}


export interface OptimizeJobResponse {
  job_id: string;
  status: OptimizeStatus;
  progress: number;
  poll_url: string;
  message?: string;
}

export interface OptimizeBullet {
  original: string;
  optimized: string;
  section?: string;
}

export interface OptimizeResult {
  jobId: string;
  job_id?: string;
  status: OptimizeStatus;
  progress: number;
  optimized_data?: {
    contact?: any;
    summary: string;
    experience: any[];
    skills: string[];
    suggestions: string[];
  };
  bullets?: OptimizeBullet[];
  optimized_bullets?: OptimizeBullet[];
  downloadUrl?: string;
  download_url?: string;
  originalScore?: number;
  original_score?: number;
  optimizedScore?: number;
  optimized_score?: number;
  error?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Interview Service ─────────────────────────────────────────────────────
export type InterviewType = "technical" | "behavioral" | "hr";
export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewStatus = "active" | "completed" | "abandoned";

export interface StartInterviewRequest {
  type: InterviewType;
  difficulty: InterviewDifficulty;
  questionCount: 5 | 10 | 15;
  resumeId?: string;
  jobDescription?: string;
  profileData?: any;
}

export interface AnswerSubmitRequest {
  questionId: string;
  answerText: string;
}

export interface AnswerSubmitResponse {
  responseId: string;
  response_id?: string;
  questionId: string;
  question_id?: string;
  score_for_question: number;
  ai_feedback: string;
  breakdown: {
    relevance: number;
    depth: number;
    clarity: number;
    star_format?: number;
  };
}

export interface SessionEndResponse {
  session_id: string;
  overall_score: number;
  summary_report: string;
  end_time: string;
  responses_evaluated: number;
}

export interface AudioUploadResponse {
  response_id: string;
  s3_url: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  question?: string;        // backend may use "question" instead of "text"
  category?: string;
  order?: number;
  difficulty?: string;
}

export interface QuestionFeedback {
  questionId?: string;
  question_id?: string;
  responseId?: string;
  response_id?: string;
  score?: number;
  score_for_question?: number;
  ai_feedback?: string;
  clarity_score?: number;
  technical_score?: number;
  tone_score?: number;
  strengths?: string[];
  improvements?: string[];
  areas_for_improvement?: string[];
  idealAnswer?: string;
  ideal_answer?: string;
  answerText?: string;
  answer_text?: string;
  audioUrl?: string;
  audio_url?: string;
  breakdown?: {
    relevance: number;
    depth: number;
    clarity: number;
    star_format?: number;
  };
}


export interface RadarScore {
  relevance: number;
  depth: number;
  clarity: number;
  structure: number;
  confidence: number;
}

export interface InterviewSession {
  id: string;
  userId?: string;
  user_id?: string;
  type?: InterviewType;
  role?: string;            // backend uses "role" field
  difficulty: InterviewDifficulty;
  status: InterviewStatus;
  questions: InterviewQuestion[];
  currentQuestionIndex?: number;
  current_question_index?: number;
  feedback?: QuestionFeedback[];
  responses?: QuestionFeedback[];
  overallScore?: number;
  overall_score?: number;
  finalScore?: number;
  final_score?: number;
  radarScores?: RadarScore;
  summary?: string;
  executive_summary?: string;
  startedAt?: string;
  started_at?: string;
  completedAt?: string;
  completed_at?: string;
}

export interface InterviewSummary {
  id: string;
  type?: InterviewType;
  role?: string;
  difficulty: InterviewDifficulty;
  status: InterviewStatus;
  overallScore?: number;
  overall_score?: number;
  questionCount?: number;
  question_count?: number;
  startedAt?: string;
  started_at?: string;
  completedAt?: string;
  completed_at?: string;
}

// ─── Skill Gap Service ─────────────────────────────────────────────────────
export type SkillStatus = "present" | "missing" | "partial" |
  "Matched" | "Partially Matched" | "Missing"; // backend uses capitalised labels

export interface Skill {
  id?: string;
  name: string;
  category?: string;
  status: SkillStatus;
  importance?: "critical" | "important" | "nice_to_have";
}

export interface SkillCategory {
  name: string;
  skills: Skill[];
}

export interface GapAnalysisResult {
  resumeId?: string;
  presentCount?: number;
  missingCount?: number;
  partialCount?: number;
  matched?: string[];
  partially_matched?: string[];
  missing?: string[];
  overallScore?: number;
  overall_score?: number;
  skillCategories?: SkillCategory[];
  analyzedAt?: string;
  analyzed_at?: string;
}

// ─── Dashboard (derived client-side) ──────────────────────────────────────
export interface DashboardStats {
  resumesUploaded: number;
  atsBestScore: number;
  interviewsCompleted: number;
  skillsMastered: number;
}

export type ActivityType =
  | "resume_upload"
  | "ats_scored"
  | "resume_optimized"
  | "interview_completed"
  | "skill_updated";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  metadata?: Record<string, string | number>;
}

// ─── API error shape ───────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  detail?: string;       // FastAPI uses "detail"
  details?: Record<string, string[]>;
}

// ─── Resume Templates ──────────────────────────────────────────────────────
export interface ResumeTemplate {
  template_id: string;
  user_id: string;
  name: string;
  description?: string;
  /** DOCX file info */
  file_url: string;
  public_id: string;
  file_size?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  file: File; // For multipart upload
  is_default?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  is_default?: boolean;
}

export interface SupportedToken {
  token: string;        // e.g. "{{full_name}}"
  description: string;  // e.g. "Your full name"
}

// ─── PDF Generation (AI Service) ──────────────────────────────────────────
export interface GeneratePdfRequest {
  template_id: string;
  overrides?: Record<string, any>;
}

export interface GeneratePdfResponse {
  download_url: string;
  public_id: string;
}


