// Fitur: manajemen file Supabase Storage & local static fallback
import fs from "fs";
import os from "os";
import pathModule from "path";
import { supabase } from "../../config/supabase";

const BUCKET_NAME = "submissions";

export const uploadFile = async (
  path: string,
  file: Buffer | Blob | Uint8Array,
  contentType?: string
): Promise<string> => {
  const mime = contentType || "application/octet-stream";

  // 1. Coba upload ke Supabase Storage
  try {
    let uploadRes = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, { contentType: mime, upsert: true });

    // Jika bucket belum ada di Supabase, coba buat bucket otomatis
    if (uploadRes.error && (uploadRes.error.message?.toLowerCase().includes("bucket") || (uploadRes.error as any).status === 404)) {
      try {
        await supabase.storage.createBucket(BUCKET_NAME, { public: true });
        uploadRes = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, file, { contentType: mime, upsert: true });
      } catch {}
    }

    if (!uploadRes.error && uploadRes.data?.path) {
      return uploadRes.data.path;
    }

    if (uploadRes.error) {
      console.warn(`[Storage] Supabase upload failed: ${uploadRes.error.message}`);
    }
  } catch (err: any) {
    console.warn(`[Storage] Supabase upload exception: ${err?.message}`);
  }

  // 2. Fallback ke disk lokal jika bisa ditulis (misal: localhost / VPS)
  const sanitizedPath = path.replace(/[^a-zA-Z0-9._-]/g, "_");
  try {
    const localDir = pathModule.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const fullFilePath = pathModule.join(localDir, sanitizedPath);
    await Bun.write(fullFilePath, file);
    return `/public/uploads/${sanitizedPath}`;
  } catch (fsErr: any) {
    console.warn(`[Storage] Local disk is read-only (Serverless/Vercel): ${fsErr?.message}`);
  }

  // 3. Fallback Serverless: Konversi ke Data URL (Base64) agar file tidak hilang antar-instance serverless
  try {
    let buffer: Buffer;
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else if (file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = Buffer.from(file);
    }

    const base64 = buffer.toString("base64");
    return `data:${mime};base64,${base64}`;
  } catch (b64Err: any) {
    console.error(`[Storage] All storage fallbacks failed: ${b64Err?.message}`);
    throw new Error("Gagal menyimpan berkas pengumpulan. Layanan penyimpanan tidak tersedia.");
  }
};

export const getSignedUrl = async (
  path: string,
  expiresInSeconds = 3600
): Promise<string> => {
  if (!path) return "";
  if (
    path.startsWith("/public/") ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresInSeconds);

    if (!error && data?.signedUrl) return data.signedUrl;

    const { data: pubData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    if (pubData?.publicUrl) return pubData.publicUrl;
  } catch (err: any) {
    console.warn(`[Storage] getSignedUrl failed (${err?.message}). Fallback to path.`);
  }

  const sanitizedPath = path.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `/public/uploads/${sanitizedPath}`;
};

export const deleteFile = async (path: string): Promise<void> => {
  if (!path || path.startsWith("data:")) return;
  if (path.startsWith("/public/")) {
    const relativePath = path.replace(/^\/public\//, "");
    const localPath = pathModule.join(process.cwd(), "public", relativePath);
    const tmpPath = pathModule.join(os.tmpdir(), "public", relativePath);
    if (fs.existsSync(localPath)) {
      try { fs.unlinkSync(localPath); } catch {}
    }
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
    return;
  }
  try {
    await supabase.storage.from(BUCKET_NAME).remove([path]);
  } catch {
    // Abaikan error hapus storage
  }
};
