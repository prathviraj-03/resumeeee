import "./env";
import Queue from "bull";

const { REDIS_URL } = process.env;

if (!REDIS_URL) {
  throw new Error("Missing required environment variable: REDIS_URL");
}

export const resumeQueue = new Queue("resume-events", REDIS_URL);
