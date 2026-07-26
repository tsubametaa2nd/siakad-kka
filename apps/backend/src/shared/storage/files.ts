// Fitur: manajemen file Supabase Storage & local static fallback
import fs from "fs";
import pathModule from "path";
import { supabase } from "../../config/supabase";

const BUCKET_NAME = "submissions";

export const uploadFile = async (
  path: string,
  file: Buffer | Blob | Uint8Array,
  contentType?: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, { contentType, upsert: true });

    if (error) throw error;
    return data.path;
  } catch (err: any) {
    console.warn(`[Storage] Supabase upload failed (${err?.message}). Falling back to local static storage.`);
    const sanitizedPath = path.replace(/[^a-zA-Z0-9._-]/g, "_");
    const localDir = pathModule.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const fullFilePath = pathModule.join(localDir, sanitizedPath);
    await Bun.write(fullFilePath, file);
    return `/public/uploads/${sanitizedPath}`;
  }
};

export const getSignedUrl = async (
  path: string,
  expiresInSeconds = 3600
): Promise<string> => {
  if (!path) return "";
  if (path.startsWith("/public/") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data?.signedUrl) throw error || new Error("URL kosong");
    return data.signedUrl;
  } catch (err: any) {
    console.warn(`[Storage] getSignedUrl failed (${err?.message}). Fallback to local URL.`);
    const sanitizedPath = path.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `/public/uploads/${sanitizedPath}`;
  }
};

export const deleteFile = async (path: string): Promise<void> => {
  if (path.startsWith("/public/")) {
    const localPath = pathModule.join(process.cwd(), path);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    return;
  }
  try {
    await supabase.storage.from(BUCKET_NAME).remove([path]);
  } catch {
    // Abaikan error hapus storage
  }
};

