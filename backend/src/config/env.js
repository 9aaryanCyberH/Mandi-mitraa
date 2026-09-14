import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().default("mandi_mitra_default_secret_key"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SCRAPER_CRON: z.string().default("0 */6 * * *"),
  AGMARK_BASE_URL: z.string().default("https://api.data.gov.in/resource"),
  AGMARK_RESOURCE_ID: z.string().default("35985678-0d79-46b4-9ed6-6f13308a1d24"),
  AGMARK_API_KEY: z.string().optional().default("")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
