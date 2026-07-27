// Fitur: klien AstraDB & daftar koleksi
import { DataAPIClient } from "@datastax/astra-db-ts";
import { env } from "./env";

function createAstraDb() {
  if (!env.ASTRA_DB_TOKEN || !env.ASTRA_DB_ENDPOINT) {
    console.warn("[AstraDB] Warning: ASTRA_DB_TOKEN or ASTRA_DB_ENDPOINT is missing.");
    return null as any;
  }
  try {
    const client = new DataAPIClient(env.ASTRA_DB_TOKEN, {
      httpOptions: {
        client: "fetch",
      },
    });
    return client.db(env.ASTRA_DB_ENDPOINT, { keyspace: env.ASTRA_DB_KEYSPACE });
  } catch (e) {
    console.error("[AstraDB] Initialization error:", e);
    return null as any;
  }
}

export let astraDb = createAstraDb();

export const getCollection = (collectionName: string) => {
  if (!astraDb) {
    astraDb = createAstraDb();
  }
  if (!astraDb) {
    throw new Error("AstraDB client is not initialized. Please check ASTRA_DB_ENDPOINT and ASTRA_DB_TOKEN in environment variables.");
  }
  return astraDb.collection(collectionName);
};

export const refreshAstraDb = () => {
  try {
    astraDb = createAstraDb();
    console.log("[AstraDB] Re-initialized AstraDB client instance.");
  } catch (e) {
    console.error("[AstraDB] Failed to re-initialize AstraDB client:", e);
  }
};

export const ASTRA_COLLECTIONS = {
  MATERIALS: "materials",
  ASSIGNMENTS: "assignments",
  SUBMISSIONS: "submissions",
  QUIZZES: "quizzes",
  QUIZ_ATTEMPTS: "quiz_attempts",
  GRADES: "grades",
} as const;

export const execAstra = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const errStr = (
        String(err) +
        " " +
        (err?.message || "") +
        " " +
        (err?.cause ? String(err.cause) : "")
      ).toLowerCase();
      
      const isConnectionOrStreamError =
        errStr.includes("destroyed") ||
        errStr.includes("stream") ||
        errStr.includes("socket") ||
        errStr.includes("fetch") ||
        errStr.includes("timeout") ||
        errStr.includes("timed out") ||
        errStr.includes("aborted") ||
        errStr.includes("econnreset") ||
        errStr.includes("etimedout") ||
        errStr.includes("503") ||
        errStr.includes("502") ||
        errStr.includes("504");

      if (isConnectionOrStreamError && attempt < maxRetries) {
        refreshAstraDb();
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000) + Math.floor(Math.random() * 500);
        console.warn(`[AstraDB] Stream/connection issue detected (attempt ${attempt}/${maxRetries}). Resetting client & retrying in ${Math.round(backoffMs)}ms... Error: ${err?.message || err}`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }
      throw err;
    }
  }
  return await fn();
};

const LARGE_FIELDS_DENY = [
  "content",
  "text",
  "description",
  "htmlContent",
  "blocks",
  "files",
  "links",
  "attachments",
  "questions",
  "answers",
  "feedback"
];

export const initAstraCollections = async () => {
  if (!astraDb) return;
  const collections = Object.values(ASTRA_COLLECTIONS);
  for (const colName of collections) {
    try {
      await execAstra(() =>
        astraDb.createCollection(colName, {
          indexing: { deny: LARGE_FIELDS_DENY }
        })
      );
    } catch {
    // Koleksi sudah ada atau opsi indeks telah diatur
    }
  }
};

initAstraCollections().catch(() => null);
