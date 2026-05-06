import dotenv from "dotenv";
import { defineConfig } from "@prisma/config";

// Load environment variables from .env so Prisma CLI commands can access DATABASE_URL.
dotenv.config();

export default defineConfig({
  // Where Prisma should find your schema.
  schema: "prisma/schema.prisma",

  // Datasource URL is now set here (Prisma 7+ requirement).
  datasource: {
    url: process.env.DATABASE_URL,
  },

  // Migrations directory.
  migrations: {
    path: "prisma/migrations",
  },
});
