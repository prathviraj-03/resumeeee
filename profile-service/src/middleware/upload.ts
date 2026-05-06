import multer from "multer";

// Stores uploaded files in memory (RAM) and enforces a 10MB limit.
// Files are available on req.file.buffer; nothing is written to disk.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
