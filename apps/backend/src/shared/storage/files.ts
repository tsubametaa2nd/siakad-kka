// Fitur: manajemen file tanpa Supabase Bucket (Lokal & Data URL Base64 Fallback untuk Serverless)
import fs from "fs";
import os from "os";
import pathModule from "path";

export const uploadFile = async (
  path: string,
  file: Buffer | Blob | Uint8Array,
  contentType?: string
): Promise<string> => {
  const mime = contentType || "application/octet-stream";
  const sanitizedPath = path.replace(/[^a-zA-Z0-9._-]/g, "_");

  // 1. Coba simpan ke folder lokal jika lingkungan mendukung penulisan (Lokal / VPS)
  try {
    const localDir = pathModule.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const fullFilePath = pathModule.join(localDir, sanitizedPath);
    await Bun.write(fullFilePath, file);
    return `/public/uploads/${sanitizedPath}`;
  } catch (fsErr: any) {
    console.warn(`[Storage] Lingkungan bersifat read-only (Serverless/Vercel). Menggunakan Data URL (Base64).`);
  }

  // 2. Lingkungan Serverless (Vercel): Simpan sebagai Data URL (Base64) langsung di database
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
    console.error(`[Storage] Gagal memproses berkas: ${b64Err?.message}`);
    throw new Error("Gagal menyimpan berkas pengumpulan.");
  }
};

export const getSignedUrl = async (
  path: string,
  _expiresInSeconds = 3600
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

  const sanitizedPath = path.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `/public/uploads/${sanitizedPath}`;
};

export const deleteFile = async (path: string): Promise<void> => {
  if (!path || path.startsWith("data:") || path.startsWith("http://") || path.startsWith("https://")) {
    return;
  }
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
  }
};
