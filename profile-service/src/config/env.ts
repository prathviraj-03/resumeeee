import dotenv from "dotenv";

// Load environment variables from a .env file in local development.
// This module should be imported before any modules that read process.env.

dotenv.config();

export function ensureEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
