import cloudinary from "../config/cloudinary.config";

export class CloudinaryService {
  async uploadFile(
    buffer: Buffer,
    userId: string,
    originalName: string
  ): Promise<{ public_id: string; secure_url: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw", // Resumes should be treated as raw files
          type: "private",
          folder: `users/${userId}/resumes`,
          public_id: `${Date.now()}_${originalName}`, // Keep extension for raw files
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          if (!result || !result.public_id || !result.secure_url) {
            return reject(new Error("Cloudinary upload returned invalid result"));
          }

          return resolve({ public_id: result.public_id, secure_url: result.secure_url });
        }
      );

      uploadStream.end(buffer);
    });
  }

  async getPrivateDownloadUrl(
    publicId: string,
    expiresInSeconds = 900
  ): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    // For raw private files, we need to use the explicit resource_type
    return cloudinary.url(publicId, {
      resource_type: "raw",
      type: "private",
      sign_url: true,
      secure: true,
      expires_at: expiresAt,
      flags: "attachment",
    });
  }

}

export default new CloudinaryService();
