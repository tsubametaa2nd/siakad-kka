// Fitur: hash & verifikasi password - Dual compatibility untuk Node.js & Bun
import { hash, verify } from "@node-rs/argon2";

export const hashPassword = async (password: string): Promise<string> => {
  if (typeof Bun !== "undefined" && Bun.password) {
    try {
      return await Bun.password.hash(password, { algorithm: "argon2id" });
    } catch {}
  }
  return await hash(password, { algorithm: 2 });
};

export const verifyPassword = async (password: string, hashStr: string): Promise<boolean> => {
  if (!password || !hashStr) return false;

  // 1. Coba verifikasi dengan Bun.password jika berjalan di Bun runtime
  if (typeof Bun !== "undefined" && Bun.password) {
    try {
      const isBunOk = await Bun.password.verify(password, hashStr);
      if (isBunOk) return true;
    } catch {}
  }

  // 2. Coba verifikasi dengan @node-rs/argon2
  try {
    const isNodeOk = await verify(hashStr, password);
    if (isNodeOk) return true;
  } catch (e) {
    console.error("[Auth] Argon2 verify error:", e);
  }

  // 3. Fallback jika hash tersimpan dalam teks biasa (dev/seed)
  if (password === hashStr) return true;

  return false;
};
