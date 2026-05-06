import { Request, Response, NextFunction } from "express";
import templateService from "../services/TemplateService";

export class TemplateController {
  // GET /api/profile/templates
  async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId ?? "";
      const templates = await templateService.getTemplates(userId);
      return res.status(200).json(templates);
    } catch (error) {
      return next(error);
    }
  }

  // POST /api/profile/templates
  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId ?? "";
      const { name, description, is_default } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Template DOCX file is required" });
      }

      // Upload buffer to Cloudinary
      const cloudinary = require("cloudinary").v2;
      
      const uploadPromise = new Promise<{ secure_url: string, public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "templates", resource_type: "raw" },
          (error: any, result: any) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(file.buffer);
      });

      const cloudinaryResult = await uploadPromise;

      const tmpl = await templateService.createTemplate(userId, {
        name,
        description,
        file_url: cloudinaryResult.secure_url,
        public_id: cloudinaryResult.public_id,
        file_size: file.size,
        is_default: is_default === 'true' || is_default === true,
      });

      return res.status(201).json(tmpl);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/profile/templates/:id
  async getTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId ?? "";
      const tmpl = await templateService.getTemplate(userId, req.params.id as string);
      return res.status(200).json(tmpl);
    } catch (error) {
      return next(error);
    }
  }

  // PUT /api/profile/templates/:id
  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId ?? "";
      const { name, description, is_default } = req.body;
      const tmpl = await templateService.updateTemplate(userId, req.params.id as string, {
        name,
        description,
        is_default: is_default === 'true' || is_default === true,
      });
      return res.status(200).json(tmpl);
    } catch (error) {
      return next(error);
    }
  }

  // DELETE /api/profile/templates/:id
  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId ?? "";
      await templateService.deleteTemplate(userId, req.params.id as string);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/profile/templates/:id/data
  // Returns template URL and profile data for AI service
  async getTemplateData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId ?? "";
      const data = await templateService.getTemplateData(userId, req.params.id as string);
      return res.status(200).json(data);
    } catch (error) {
      return next(error);
    }
  }

  // POST /api/profile/templates/:id/render
  // Renders a DOCX template into a PDF and streams it directly to the browser
  async renderTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId ?? "";
      const overrides = req.body?.overrides || {};
      const { pdfBuffer, filename } = await templateService.renderTemplate(userId, req.params.id as string, overrides);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (error) {
      return next(error);
    }
  }

  // GET /api/profile/templates/tokens
  async getSupportedTokens(_req: Request, res: Response, next: NextFunction) {
    try {
      const tokens = [
        { token: "{{full_name}}",      description: "Your full name" },
        { token: "{{email}}",          description: "Email address" },
        { token: "{{phone}}",          description: "Phone number" },
        { token: "{{location}}",       description: "City / Country" },
        { token: "{{linkedin_url}}",   description: "LinkedIn profile URL" },
        { token: "{{github_url}}",     description: "GitHub profile URL" },
        { token: "{{portfolio_url}}",  description: "Portfolio / website URL" },
        { token: "{{target_role}}",    description: "Target job role" },
        { token: "{{target_industry}}",description: "Target industry" },
        { token: "{{summary}}",        description: "Professional summary" },
        { token: "{{skills}}",         description: "Skills (comma-separated)" },
        { token: "{{certifications}}", description: "Certifications (comma-separated)" },
        { token: "{{languages}}",      description: "Languages (comma-separated)" },
        { token: "{{years_experience}}",description: "Years of experience" },
      ];
      return res.status(200).json(tokens);
    } catch (error) {
      return next(error);
    }
  }
}

export default new TemplateController();
