import { fileTypeFromBuffer } from "file-type";

export class AppError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

export async function validateResumeFile(buffer: Buffer): Promise<void> {
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType || !ALLOWED_MIME_TYPES.has(fileType.mime)) {
    throw new AppError(400, "Invalid file type. Only PDF and DOCX are allowed.");
  }
}
