// Fitur: skema validasi auth
import { t } from "elysia";

export const loginSchema = t.Object({
  username: t.Optional(t.String()),
  identifier: t.Optional(t.String()),
  password: t.String({ minLength: 6 }),
});

export const createAccountSchema = t.Object({
  fullName: t.String({ minLength: 1 }),
  username: t.String({ minLength: 1 }),
  role: t.Union([t.Literal("teacher"), t.Literal("student")]),
  password: t.String({ minLength: 6 }),
});

export const updateProfileSchema = t.Object({
  fullName: t.String({ minLength: 1 }),
});

export const changePasswordSchema = t.Object({
  oldPassword: t.String({ minLength: 1 }),
  newPassword: t.String({ minLength: 6 }),
});

export type LoginBody = typeof loginSchema.static;
export type CreateAccountBody = typeof createAccountSchema.static;
export type UpdateProfileBody = typeof updateProfileSchema.static;
export type ChangePasswordBody = typeof changePasswordSchema.static;
