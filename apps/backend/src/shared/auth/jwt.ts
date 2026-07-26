// Fitur: pembuatan & verifikasi JWT (jose)
import { SignJWT, jwtVerify } from "jose";
import { env } from "../../config/env";
import type { AuthUser, Role } from "../types";
import { Unauthorized } from "../utils/errors";

const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

export const signToken = async (payload: { id: string; role: Role; name?: string }): Promise<string> => {
  return await new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
};

export const verifyToken = async (token: string): Promise<AuthUser> => {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (!payload.sub || !payload.role) {
      throw Unauthorized("Token tidak valid");
    }

    return {
      id: payload.sub,
      role: payload.role as Role,
      name: payload.name as string | undefined,
      token,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AppError") throw error;
    throw Unauthorized("Token tidak valid atau telah kedaluwarsa");
  }
};
