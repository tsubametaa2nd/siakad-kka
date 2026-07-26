// Fitur: hash & verifikasi password - Dual compatibility untuk Node.js & Bun
import { hash, verify } from "@node-rs/argon2";

export const hashPassword = async (password: string): Promise<string> => {
  if (typeof Bun !== "undefined" && Bun.password) {
    try {
      return await Bun.password.hash(password.trim(), { algorithm: "argon2id" });
    } catch {}
  }
  return await hash(password.trim(), { algorithm: 2 });
};

export const verifyPassword = async (password: string, hashStr: string): Promise<boolean> => {
  if (!password || !hashStr) return false;
  const cleanPassword = password.trim();
  const cleanHash = hashStr.trim();

  // 1. Fallback perbandingan langsung jika password tersimpan sebagai teks biasa
  if (cleanPassword === cleanHash) return true;

  // 2. Coba verifikasi dengan Bun.password jika berjalan di Bun runtime
  if (typeof Bun !== "undefined" && Bun.password) {
    try {
      if (await Bun.password.verify(cleanPassword, cleanHash)) return true;
    } catch {}
  }

  // 3. Coba verifikasi dengan @node-rs/argon2 (signature: verify(hash, plainText))
  try {
    if (await verify(cleanHash, cleanPassword)) return true;
  } catch (e) {}

  return false;
};
