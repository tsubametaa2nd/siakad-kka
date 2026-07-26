// Fitur: klien AstraDB & daftar koleksi
import { DataAPIClient } from "@datastax/astra-db-ts";
import { env } from "./env";

function createAstraDb() {
  const client = new DataAPIClient(env.ASTRA_DB_TOKEN, {
    httpOptions: {
      client: "fetch", // Gunakan native fetch untuk menghindari bug persistent HTTP/2 session ('The stream has been destroyed') dari fetch-h2
    },
  });
  return client.db(env.ASTRA_DB_ENDPOINT, { keyspace: env.ASTRA_DB_KEYSPACE });
}

export let astraDb = createAstraDb();

export const getCollection = (collectionName: string) => {
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

// Memastikan koleksi materials mengabaikan pengindeksan array 'blocks' (agar file HTML berukuran besar > 8KB tidak terkena limit indeks 8000 bytes)
export const initAstraCollections = async () => {
  try {
    await execAstra(() => astraDb.createCollection(ASTRA_COLLECTIONS.MATERIALS, { indexing: { deny: ["blocks"] } }));
  } catch {
    // Koleksi sudah ada
  }
};

initAstraCollections().catch(() => null);
