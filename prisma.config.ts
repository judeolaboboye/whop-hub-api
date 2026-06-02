import dotenv from 'dotenv';
import path from 'path';
import { defineConfig } from "prisma/config";

// Load Next.js environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://mock:mock@localhost:5432/mock",
  },
});
