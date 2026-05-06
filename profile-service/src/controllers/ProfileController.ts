import { Request, Response, NextFunction } from "express";
import { ProfileService } from "../services/ProfileService";

const profileService = new ProfileService();

export class ProfileController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const profile = await profileService.getProfile(userId ?? "");
      return res.status(200).json(profile);
    } catch (error) {
      return next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const updated = await profileService.updateProfile(userId ?? "", req.body);
      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  }

  async setupProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const profile = await profileService.upsertFullProfile(userId ?? "", req.body);
      return res.status(200).json(profile);
    } catch (error) {
      return next(error);
    }
  }

  async getCompletionScore(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const profile = await profileService.getProfile(userId ?? "");
      const result = profileService.computeCompletionScore(profile);
      return res.status(200).json(result);
    } catch (error) {
      // If profile doesn't exist, return 0
      return res.status(200).json({ score: 0, missing_fields: ["full_name", "email", "phone_number", "summary", "projects"] });
    }
  }
}

export default new ProfileController();
