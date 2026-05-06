import { Request, Response, NextFunction } from "express";
import { ResumeService } from "../services/ResumeService";

const resumeService = new ResumeService();

export class ResumeController {
  async uploadResume(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const file = req.file;
      const result = await resumeService.uploadResume(userId ?? "", file as Express.Multer.File);
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async listResumes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const list = await resumeService.listResumes(userId ?? "");
      return res.status(200).json(list);
    } catch (error) {
      return next(error);
    }
  }

  async getResume(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const resume = await resumeService.getResumeById(userId ?? "", id as string);
      return res.status(200).json(resume);
    } catch (error) {
      return next(error);
    }
  }

  async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const url = await resumeService.getDownloadUrl(userId ?? "", id as string);
      return res.status(200).json({ url, expiresIn: 900 });
    } catch (error) {
      return next(error);
    }
  }

  async deleteResume(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      await resumeService.softDeleteResume(userId ?? "", id as string);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}
