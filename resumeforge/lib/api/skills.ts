import apiClient from "./client";
import { API_ENDPOINTS } from "@/lib/config";
import type { GapAnalysisResult, UserProfile } from "./types";

export interface GapAnalysisRequest {
  currentSkills?: string[];
  targetRole?: string;
  jobDescription?: string;
  resumeId?: string;
  profileData?: Partial<UserProfile>;
}

export interface RoadmapItem {
  skill: string;
  title: string;
  description: string;
  resource: string;
  priority: string;
}

export interface WeeklyPlan {
  week_number: number;
  focus_area: string;
  items: RoadmapItem[];
}

export interface RoadmapResponse {
  target_role: string;
  estimated_weeks: number;
  weeks: WeeklyPlan[];
}

export async function runGapAnalysis(data: GapAnalysisRequest): Promise<GapAnalysisResult> {
  const res = await apiClient.post<GapAnalysisResult>(API_ENDPOINTS.skills.analyze, {
    current_skills: data.currentSkills || [],
    target_role: data.targetRole,
    job_description: data.jobDescription,
    profile_data: data.profileData,
  });
  return res.data;
}

export async function getRoadmap(data: GapAnalysisRequest): Promise<RoadmapResponse> {
  const res = await apiClient.post<RoadmapResponse>(API_ENDPOINTS.skills.generate, {
    current_skills: data.currentSkills || [],
    target_role: data.targetRole,
    job_description: data.jobDescription,
    profile_data: data.profileData,
  });
  return res.data;
}
