export interface UpdateProfileDto {
  full_name?: string;
  phone_number?: string;
  email?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
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

export interface ResumeUploadResponseDto {
  id: string;
  resumeId: string;
  versionNumber: number;
  originalFilename: string;
  createdAt: string; // ISO timestamp
}
