import prisma from "../config/database.config";
import { resumeQueue } from "../config/queue.config";
import { CloudinaryService } from "./CloudinaryService";
import { validateResumeFile, AppError } from "../utils/file-validator.util";
import { ResumeUploadResponseDto } from "../types/dto.types";
import { Prisma } from "@prisma/client";

const cloudinaryService = new CloudinaryService();

export class ResumeService {
  async uploadResume(userId: string, file: Express.Multer.File): Promise<ResumeUploadResponseDto> {
    if (!file || !file.buffer) {
      throw new AppError(400, "No file uploaded");
    }

    await validateResumeFile(file.buffer);

    const uploadResult = await cloudinaryService.uploadFile(file.buffer, userId, file.originalname);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Ensure the user profile exists before creating a resume (Foreign Key requirement)
      await tx.user_profiles.upsert({
        where: { user_id: userId },
        update: {},
        create: { user_id: userId },
      });

      const aggregate = await tx.resumes.aggregate({
        where: { user_id: userId },
        _max: {
          version_number: true,
        },
      });

      const nextVersion = (aggregate._max.version_number ?? 0) + 1;

      const created = await tx.resumes.create({
        data: {
          user_id: userId,
          version_number: nextVersion,
          cloudinary_public_id: uploadResult.public_id,
          cloudinary_secure_url: uploadResult.secure_url,
          original_filename: file.originalname,
        },
      });

      return created;
    });

    await resumeQueue.add("resume.uploaded", {
      resumeId: result.resume_id,
      userId,
      cloudinaryPublicId: uploadResult.public_id,
    });

    return {
      id: result.resume_id,
      resumeId: result.resume_id,
      versionNumber: result.version_number,
      originalFilename: result.original_filename,
      createdAt: result.created_at.toISOString(),
    };
  }

  async listResumes(userId: string) {
    const resumes = await prisma.resumes.findMany({
      where: {
        user_id: userId,
        is_deleted: false,
      },
      orderBy: {
        version_number: "desc",
      },
    });

    return resumes.map(r => ({ ...r, id: r.resume_id }));
  }

  async getResumeById(userId: string, resumeId: string) {
    const resume = await prisma.resumes.findUnique({
      where: { resume_id: resumeId },
    });

    if (!resume || resume.user_id !== userId) {
      throw new AppError(404, "Resume not found");
    }

    return { ...resume, id: resume.resume_id };
  }

  async getDownloadUrl(userId: string, resumeId: string) {
    const resume = await this.getResumeById(userId, resumeId);
    return cloudinaryService.getPrivateDownloadUrl(resume.cloudinary_public_id, 900);
  }

  async softDeleteResume(userId: string, resumeId: string) {
    const resume = await this.getResumeById(userId, resumeId);

    if (resume.is_deleted) {
      return resume;
    }

    return prisma.resumes.update({
      where: { resume_id: resumeId },
      data: { is_deleted: true },
    });
  }
}

export default new ResumeService();
