import "./env";
import { v2 as cloudinary } from "cloudinary";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME) {
  throw new Error("Missing required environment variable: CLOUDINARY_CLOUD_NAME");
}

if (!CLOUDINARY_API_KEY) {
  throw new Error("Missing required environment variable: CLOUDINARY_API_KEY");
}

if (!CLOUDINARY_API_SECRET) {
  throw new Error("Missing required environment variable: CLOUDINARY_API_SECRET");
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
