import prisma from "../config/database.config";
import { UpdateProfileDto } from "../types/dto.types";
import { AppError } from "../utils/file-validator.util";

export class ProfileService {
  async getProfile(userId: string) {
    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new AppError(404, "Profile not found");
    }

    return profile;
  }

  computeCompletionScore(profile: any): { score: number; missing_fields: string[] } {
    let score = 0;
    const missing_fields: string[] = [];

    // Required fields (total 100 points, each worth 20 points)
    if (profile.full_name) score += 20; else missing_fields.push("full_name");
    if (profile.email) score += 20; else missing_fields.push("email");
    if (profile.phone_number) score += 20; else missing_fields.push("phone_number");
    if (profile.summary && profile.summary.length >= 50) score += 20; else missing_fields.push("summary");
    if (profile.projects && Array.isArray(profile.projects) && profile.projects.length > 0) score += 20; else missing_fields.push("projects");

    // Ensure score doesn't exceed 100
    score = Math.min(score, 100);

    return { score, missing_fields };
  }

  async upsertFullProfile(userId: string, data: any) {
    const { score } = this.computeCompletionScore(data);
    const is_setup_done = score >= 100;

    const profile = await prisma.user_profiles.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
        completion_score: score,
        is_setup_done,
      },
      update: {
        ...data,
        completion_score: score,
        is_setup_done,
      },
    });

    return profile;
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const existingProfile = await this.getProfile(userId).catch(() => ({}));
    const mergedData = { ...existingProfile, ...data };
    
    const { score } = this.computeCompletionScore(mergedData);
    const is_setup_done = score >= 100;

    const profile = await prisma.user_profiles.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
        completion_score: score,
        is_setup_done,
      },
      update: {
        ...data,
        completion_score: score,
        is_setup_done,
      },
    });

    return profile;
  }
}

export default new ProfileService();
