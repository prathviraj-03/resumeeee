import { Router } from "express";
import { body } from "express-validator";
import { TemplateController } from "../controllers/TemplateController";
import { authGuard } from "../middleware/authGuard";
import { validateRequest } from "../middleware/validateRequest";
import { upload } from "../middleware/upload";

const router = Router();
const templateController = new TemplateController();

// Get all supported {tokens}
router.get(
  "/tokens",
  authGuard,
  (req, res, next) => templateController.getSupportedTokens(req, res, next)
);

// List all user's templates
router.get(
  "/",
  authGuard,
  (req, res, next) => templateController.listTemplates(req, res, next)
);

// Create a new template (DOCX upload)
router.post(
  "/",
  authGuard,
  upload.single("file"),
  (req, res, next) => templateController.createTemplate(req, res, next)
);

// Get a single template
router.get(
  "/:id",
  authGuard,
  (req, res, next) => templateController.getTemplate(req, res, next)
);

// Update a template (only metadata)
router.put(
  "/:id",
  authGuard,
  body("name").optional().notEmpty(),
  body("is_default").optional(),
  validateRequest,
  (req, res, next) => templateController.updateTemplate(req, res, next)
);

// Delete a template
router.delete(
  "/:id",
  authGuard,
  (req, res, next) => templateController.deleteTemplate(req, res, next)
);

// Get template URL and profile data for AI service
router.get(
  "/:id/data",
  authGuard,
  (req, res, next) => templateController.getTemplateData(req, res, next)
);

// Render DOCX template to PDF
router.post(
  "/:id/render",
  authGuard,
  (req, res, next) => templateController.renderTemplate(req, res, next)
);

export default router;
