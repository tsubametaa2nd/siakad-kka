// Fitur: middleware autentikasi & otorisasi role
import { Elysia } from "elysia";
import { verifyToken } from "../auth/jwt";
import type { AuthUser, Role } from "../types";
import { Forbidden, Unauthorized } from "../utils/errors";

export const authGuard = new Elysia({ name: "authGuard" }).derive(
  { as: "global" },
  async ({ request, headers }): Promise<{ user: AuthUser }> => {
    if (request.method === "OPTIONS") {
      return { user: null as any };
    }

    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw Unauthorized("Header Authorization tidak ditemukan atau format salah");
    }

    const token = authHeader.substring(7).trim();
    const user = await verifyToken(token);
    return { user };
  }
);

export const requireRole = (allowedRole: Role | Role[]) => {
  const allowed = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  return new Elysia({ name: "requireRole" })
    .use(authGuard)
    .onBeforeHandle(({ user }: { user: AuthUser }) => {
      if (!user || !allowed.includes(user.role)) {
        throw Forbidden("Anda tidak memiliki hak akses untuk tindakan ini");
      }
    });
};
