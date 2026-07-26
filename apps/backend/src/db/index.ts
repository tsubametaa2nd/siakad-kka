// Fitur: Klien Drizzle ORM Database Connection
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env";
import * as schema from "./schema";

const getConnectionString = (): string => {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  if (env.SUPABASE_URL) {
    // Extract project ref from SUPABASE_URL (e.g. https://xyz.supabase.co -> xyz)
    const match = env.SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase/);
    if (match && match[1]) {
      const projectRef = match[1];
      return `postgresql://postgres.${projectRef}:${env.SUPABASE_SERVICE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
    }
  }
  return "";
};

const connectionString = getConnectionString();
// Disable prefetch/prepare as it is not supported for Supabase Transaction Pooler mode
const client = postgres(connectionString || "postgresql://localhost:5432/postgres", { prepare: false, max: 10 });

export const db = drizzle(client, { schema });
export { schema };
