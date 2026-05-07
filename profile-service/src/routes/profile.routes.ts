import { Router } from "express";
import { body } from "express-validator";
import { ProfileController } from "../controllers/ProfileController";
import { authGuard } from "../middleware/authGuard";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

const profileController = new ProfileController();

router.get("/", authGuard, (req, res, next) => profileController.getProfile(req, res, next));

router.put(
  "/",
  authGuard,
  body("linkedin_url").optional({ checkFalsy: true }).isURL().withMessage("linkedin_url must be a valid URL"),
  body("github_url").optional({ checkFalsy: true }).isURL().withMessage("github_url must be a valid URL"),
  body("portfolio_url").optional({ checkFalsy: true }).isURL().withMessage("portfolio_url must be a valid URL"),
  validateRequest,
  (req, res, next) => profileController.updateProfile(req, res, next)
);

router.post("/setup", authGuard, (req, res, next) => profileController.setupProfile(req, res, next));
router.get("/completion", authGuard, (req, res, next) => profileController.getCompletionScore(req, res, next));

export default router;
