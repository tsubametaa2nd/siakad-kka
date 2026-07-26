// Fitur: endpoint autentikasi
import { Elysia } from "elysia";
import { authGuard, requireRole } from "../../shared/middleware/auth";
import { ok } from "../../shared/utils/response";
import * as authService from "./auth.service";
import { createAccountSchema, loginSchema, updateProfileSchema, changePasswordSchema } from "./auth.schema";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .get("/login", () => ok({ message: "Auth login endpoint operational. Send POST request with credentials to login.", status: "online" }))
  .post(
    "/login",
    async ({ body }) => ok(await authService.login(body)),
    { body: loginSchema }
  )
  .use(authGuard)
  .get(
    "/me",
    async ({ user }) => ok(await authService.getProfile(user.id))
  )
  .patch(
    "/profile",
    async ({ user, body }) => ok(await authService.updateProfile(user.id, body.fullName)),
    { body: updateProfileSchema }
  )
  .post(
    "/change-password",
    async ({ user, body }) => ok(await authService.changePassword(user.id, body as any)),
    { body: changePasswordSchema }
  )
  .use(requireRole("teacher"))
  .post(
    "/accounts",
    async ({ body }) => ok(await authService.createAccount(body)),
    { body: createAccountSchema }
  )
  .get(
    "/students",
    async () => ok(await authService.getAllStudents())
  );

