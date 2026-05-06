export interface UpdateProfileDto {
  full_name?: string;
  phone_number?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  skills?: string[];
  experience?: any;
  education?: any;
  summary?: string;
}

export interface ResumeUploadResponseDto {
  id: string;
  resumeId: string;
  versionNumber: number;
  originalFilename: string;
  createdAt: string; // ISO timestamp
}
