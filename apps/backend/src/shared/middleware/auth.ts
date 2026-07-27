// Fitur: middleware autentikasi & otorisasi role
import { Elysia } from "elysia";
import { verifyToken } from "../auth/jwt";
import type { AuthUser, Role } from "../types";
import { Forbidden, Unauthorized } from "../utils/errors";

export const authGuard = new Elysia({ name: "authGuard" }).derive(
  { as: "global" },
  async ({ request, headers }): Promise<{ user: AuthUser }> => {
    const url = request.url || "";
    const cleanUrl = url.toLowerCase();
    const isPublic =
      request.method === "OPTIONS" ||
      cleanUrl.includes("/auth/login") ||
      cleanUrl.includes("/health") ||
      cleanUrl.includes("/docs") ||
      cleanUrl.includes("/public/") ||
      cleanUrl.endsWith("/api") ||
      cleanUrl.endsWith("/api/");

    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      if (isPublic) return { user: null as any };
      throw Unauthorized("Header Authorization tidak ditemukan atau format salah");
    }

    try {
      const token = authHeader.substring(7).trim();
      const user = await verifyToken(token);
      return { user };
    } catch (err) {
      if (isPublic) return { user: null as any };
      throw err;
    }
  }
);

export const requireRole = (allowedRole: Role | Role[]) => {
  const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  return ({ user }: { user?: AuthUser }) => {
    if (!user) {
      throw Unauthorized("Sesi tidak ditemukan atau telah kedaluwarsa");
    }
    if (!allowed.includes(user.role)) {
      throw Forbidden("Anda tidak memiliki hak akses untuk tindakan ini");
    }
  };
};
