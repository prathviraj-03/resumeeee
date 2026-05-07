import prisma from "../config/database.config";
import { AppError } from "../utils/file-validator.util";
import cloudinaryService from "./CloudinaryService";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import libre from "libreoffice-convert";
import { promisify } from "util";

const convertAsync = promisify(libre.convert);

export class TemplateService {
  // ── CRUD ─────────────────────────────────────────────────────────────────

  async getTemplates(userId: string) {
    return prisma.resume_templates.findMany({
      where: {
        OR: [
          { user_id: userId },
          { user_id: null as any }
        ]
      },
      orderBy: [{ is_default: "desc" }, { created_at: "desc" }],
    });
  }

  async getTemplate(userId: string, templateId: string) {
    const tmpl = await prisma.resume_templates.findFirst({
      where: {
        template_id: templateId,
        OR: [
          { user_id: userId },
          { user_id: null as any }
        ]
      },
    });
    if (!tmpl) throw new AppError(404, "Template not found");
    return tmpl;
  }

  async createTemplate(
    userId: string,
    data: { name: string; description?: string; file_url: string; public_id: string; file_size?: number; is_default?: boolean }
  ) {
    // If setting as default, unset all others first
    if (data.is_default) {
      await prisma.resume_templates.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }
    return prisma.resume_templates.create({
      data: { user_id: userId, ...data } as any,
    });
  }

  async updateTemplate(
    userId: string,
    templateId: string,
    data: { name?: string; description?: string; is_default?: boolean }
  ) {
    // Verify ownership
    await this.getTemplate(userId, templateId);

    if (data.is_default) {
      await prisma.resume_templates.updateMany({
        where: { user_id: userId, template_id: { not: templateId } },
        data: { is_default: false },
      });
    }

    return prisma.resume_templates.update({
      where: { template_id: templateId },
      data,
    });
  }

  async deleteTemplate(userId: string, templateId: string) {
    await this.getTemplate(userId, templateId);
    await prisma.resume_templates.delete({ where: { template_id: templateId } });
  }

  /**
   * Prepares data for the AI service to fill the DOCX template.
   */
  async getTemplateData(userId: string, templateId: string) {
    const [tmpl, profile] = await Promise.all([
      this.getTemplate(userId, templateId),
      prisma.user_profiles.findUnique({ where: { user_id: userId } }),
    ]);

    if (!profile) throw new AppError(404, "Profile not found — complete your profile setup first");

    return {
      template_url: (tmpl as any).file_url,
      profile_data: profile,
      template_name: tmpl.name
    };
  }

  /**
   * Renders the DOCX template to PDF using docxtemplater and LibreOffice,
   * then uploads the result to Cloudinary.
   */
  async renderTemplate(userId: string, templateId: string, overrides: Record<string, any> = {}): Promise<{ pdfBuffer: Buffer; filename: string; cloudinaryUrl: string }> {
    // 1. Fetch template data and profile
    const { template_url, profile_data, template_name } = await this.getTemplateData(userId, templateId);
    
    // ── Build template context ──────────────────────────────────────────────
    const raw: Record<string, any> = { ...profile_data, ...overrides };

    const context: Record<string, any> = {};

    // ── Scalar / flat fields ────────────────────────────────────────────────
    const scalarFields = [
      "full_name", "email", "phone_number", "location",
      "linkedin_url", "github_url", "portfolio_url",
      "summary", "target_role", "target_industry", "years_experience",
      "avatar_url",
    ];
    for (const key of scalarFields) {
      context[key] = raw[key] ?? "";
    }

    // Alias: {{phone}} → phone_number
    context["phone"] = context["phone_number"];

    // ── Comma-joined flat strings (for simple {{skills}} etc.) ──────────────
    context["skills"]          = Array.isArray(raw.skills)         ? raw.skills.join(", ")         : "";
    context["certifications"]  = Array.isArray(raw.certifications) ? raw.certifications.join(", ") : "";
    context["languages"]       = Array.isArray(raw.languages)      ? raw.languages.join(", ")      : "";

    // ── Loop arrays for {#tag}…{/tag} repeating sections ───────────────────
    // experience: each item → { title, company, duration, description }
    context["experience"] = Array.isArray(raw.experience)
      ? raw.experience.map((e: any) => ({
          title:       e.title       ?? e.job_title   ?? "",
          company:     e.company     ?? "",
          duration:    e.duration    ?? e.period       ?? "",
          description: e.description ?? e.summary      ?? "",
        }))
      : [];

    // education: each item → { degree, institution, college_name, cgpa, graduation_year }
    context["education"] = Array.isArray(raw.education)
      ? raw.education.map((e: any) => ({
          degree:          e.degree          ?? "",
          institution:     e.institution     ?? e.college_name ?? "",
          college_name:    e.institution     ?? e.college_name ?? "",
          cgpa:            e.cgpa            ?? e.grade         ?? "",
          graduation_year: e.year            ?? e.graduation_year ?? "",
        }))
      : [];

    // projects: each item → { name, description, tech_stack, url }
    context["projects"] = Array.isArray(raw.projects)
      ? raw.projects.map((p: any) => ({
          name:        p.name        ?? p.title       ?? "",
          description: p.description ?? p.summary     ?? "",
          tech_stack:  p.tech_stack  ?? p.technologies ?? "",
          url:         p.url         ?? p.link         ?? "",
        }))
      : [];

    // certifications loop: each item → { name }
    context["certifications_list"] = Array.isArray(raw.certifications)
      ? raw.certifications.map((c: any) => ({
          name: typeof c === "string" ? c : (c.name ?? String(c)),
        }))
      : [];

    // awards loop: each item → { title, description }
    context["awards"] = Array.isArray(raw.awards)
      ? raw.awards.map((a: any) => ({
          title:       a.title       ?? String(a),
          description: a.description ?? "",
        }))
      : [];

    // ── Flat aliases from first education entry ─────────────────────────────
    const edu0: any = Array.isArray(raw.education) && raw.education.length > 0
      ? raw.education[0]
      : {};
    context["college_name"]    = edu0.institution    ?? edu0.college_name    ?? "";
    context["degree"]          = edu0.degree                                 ?? "";
    context["cgpa"]            = edu0.cgpa           ?? edu0.grade           ?? "";
    context["graduation_year"] = edu0.year           ?? edu0.graduation_year ?? "";

    // 2. Download the raw DOCX
    let response;
    try {
      response = await fetch(template_url);
    } catch (error: any) {
      throw new AppError(500, `Network error fetching template: ${error.message}`);
    }

    if (!response.ok) {
      const details = await response.text().catch(() => "No details");
      throw new AppError(500, `Failed to download template file (Status ${response.status}): ${details.substring(0, 100)}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    // 3. Fill the DOCX with user data
    let doc;
    try {
      const zip = new PizZip(buffer);
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{{", end: "}}" },
        // Safety net: any tag not found in context → empty string (never "undefined")
        nullGetter: () => "",
      });
      doc.render(context);
    } catch (error: any) {
      if (error.properties && error.properties.errors instanceof Array) {
        const msgs = error.properties.errors
          .map((e: any) => `${e.properties.explanation}`)
          .join("; ");
        throw new AppError(500, `Template tag errors: ${msgs}`);
      }
      throw new AppError(500, "Failed to render DOCX template: " + error.message);
    }

    const filledDocxBuf = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

    // 4. Convert filled DOCX → PDF via LibreOffice
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await convertAsync(filledDocxBuf, ".pdf", undefined);
    } catch (error: any) {
      console.error("LibreOffice convert error:", error);
      throw new AppError(500, "Failed to convert DOCX to PDF: " + error.message);
    }

    // 5. Upload to Cloudinary for persistent storage
    const safeName = template_name.replace(/\s+/g, "_").toLowerCase();
    let cloudinaryUrl = "";
    try {
      const uploadRes = await cloudinaryService.uploadFile(pdfBuffer, userId, `${safeName}_rendered.pdf`);
      cloudinaryUrl = uploadRes.secure_url;
      console.log(`[TemplateService] Uploaded to Cloudinary: ${uploadRes.public_id}`);
    } catch (err: any) {
      console.warn("[TemplateService] Cloudinary upload failed (non-fatal):", err.message);
    }

    const filename = `${safeName}_resume.pdf`;
    return { pdfBuffer, filename, cloudinaryUrl };
  }
}

export default new TemplateService();
