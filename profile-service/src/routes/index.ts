import { Router } from "express";
import profileRoutes from "./profile.routes";
import resumeRoutes from "./resume.routes";
import templateRoutes from "./template.routes";

const router = Router();

router.use("/profile", profileRoutes);
router.use("/resumes", resumeRoutes);
router.use("/templates", templateRoutes);

router.get("/health", (_req, res) => res.send({ status: "ok" }));

export default router;
