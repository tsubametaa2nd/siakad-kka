import { config } from "dotenv";
config({ override: true });

// Fitur: environment variables dengan fallback aman untuk Vercel Serverless
export const env = {
  PORT: Number(process.env.PORT || 3000),
  AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET || "default_jwt_secret_key_kka_31_smkn",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || "",
  DATABASE_URL: process.env.DATABASE_URL || "",
  ASTRA_DB_ENDPOINT: (process.env.ASTRA_DB_ENDPOINT || "").trim(),
  ASTRA_DB_TOKEN: (process.env.ASTRA_DB_TOKEN || "").trim(),
  ASTRA_DB_KEYSPACE: (process.env.ASTRA_DB_KEYSPACE || "kka31").trim(),
  GOOGLE_SA_EMAIL: (process.env.GOOGLE_SA_EMAIL || "").trim(),
  GOOGLE_SA_PRIVATE_KEY: (process.env.GOOGLE_SA_PRIVATE_KEY || "").trim(),
};

const requiredEnvs = [
  "AUTH_JWT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
  "ASTRA_DB_ENDPOINT",
  "ASTRA_DB_TOKEN",
] as const;

const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);
if (missingEnvs.length > 0) {
  console.warn(`⚠️ Warning: Missing environment variables on server start: ${missingEnvs.join(", ")}`);
}
