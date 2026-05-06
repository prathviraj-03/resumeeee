import { Router } from "express";
import { ResumeController } from "../controllers/ResumeController";
import { authGuard } from "../middleware/authGuard";
import { upload } from "../middleware/upload";

const router = Router();

const resumeController = new ResumeController();

router.post(
  "/upload",
  authGuard,
  upload.single("file"),
  (req, res, next) => resumeController.uploadResume(req, res, next)
);

router.get("/", authGuard, (req, res, next) => resumeController.listResumes(req, res, next));
router.get("/:id", authGuard, (req, res, next) => resumeController.getResume(req, res, next));
router.get("/:id/download", authGuard, (req, res, next) => resumeController.getDownloadUrl(req, res, next));
router.delete("/:id", authGuard, (req, res, next) => resumeController.deleteResume(req, res, next));

export default router;
