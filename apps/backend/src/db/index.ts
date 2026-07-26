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
const client = connectionString
  ? postgres(connectionString, { prepare: false, max: 10 })
  : (null as any);

export const db = client ? drizzle(client, { schema }) : (null as any);
export { schema };
