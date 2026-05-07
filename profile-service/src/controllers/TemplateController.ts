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
      const tokens = {
        flat: [
          // Identity
          { token: "{{full_name}}",        description: "Full name" },
          { token: "{{email}}",            description: "Email address" },
          { token: "{{phone}}",            description: "Phone number" },
          { token: "{{location}}",         description: "City / Country" },
          // Links
          { token: "{{linkedin_url}}",     description: "LinkedIn URL" },
          { token: "{{github_url}}",       description: "GitHub URL" },
          { token: "{{portfolio_url}}",    description: "Portfolio / website URL" },
          // Career
          { token: "{{target_role}}",      description: "Target job role" },
          { token: "{{target_industry}}", description: "Target industry" },
          { token: "{{years_experience}}", description: "Years of experience" },
          { token: "{{summary}}",          description: "Professional summary" },
          // Flat comma-joined arrays
          { token: "{{skills}}",           description: "Skills — comma-separated string" },
          { token: "{{certifications}}",   description: "Certifications — comma-separated string" },
          { token: "{{languages}}",        description: "Languages spoken — comma-separated" },
          // Flat education shortcuts (from first education entry)
          { token: "{{college_name}}",     description: "Institution / college name (first entry)" },
          { token: "{{degree}}",           description: "Degree title (first entry)" },
          { token: "{{cgpa}}",             description: "CGPA / Grade (first entry)" },
          { token: "{{graduation_year}}",  description: "Graduation year (first entry)" },
        ],
        loops: [
          {
            section: "experience",
            syntax: "{{#experience}} … {{/experience}}",
            description: "Repeats for each work experience entry",
            inner_fields: [
              "{{title}}       — Job title",
              "{{company}}     — Company name",
              "{{duration}}    — Duration (e.g. Jan 2022 – Present)",
              "{{description}} — Role description / achievements",
            ],
          },
          {
            section: "education",
            syntax: "{{#education}} … {{/education}}",
            description: "Repeats for each education entry",
            inner_fields: [
              "{{degree}}          — Degree name",
              "{{institution}}     — University / college name",
              "{{college_name}}    — Alias for institution",
              "{{cgpa}}            — CGPA or grade",
              "{{graduation_year}} — Year of graduation",
            ],
          },
          {
            section: "projects",
            syntax: "{{#projects}} … {{/projects}}",
            description: "Repeats for each project",
            inner_fields: [
              "{{name}}        — Project name",
              "{{description}} — Project description",
              "{{tech_stack}}  — Technologies used",
              "{{url}}         — Project link / URL",
            ],
          },
          {
            section: "certifications_list",
            syntax: "{{#certifications_list}} … {{/certifications_list}}",
            description: "Repeats for each certification",
            inner_fields: [
              "{{name}} — Certification name",
            ],
          },
          {
            section: "awards",
            syntax: "{{#awards}} … {{/awards}}",
            description: "Repeats for each award",
            inner_fields: [
              "{{title}}       — Award title",
              "{{description}} — Award description",
            ],
          },
        ],
      };
      return res.status(200).json(tokens);
    } catch (error) {
      return next(error);
    }
  }
}

export default new TemplateController();
