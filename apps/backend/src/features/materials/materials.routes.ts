// Fitur: endpoint materi
import fs from "fs";
import path from "path";
import { Elysia } from "elysia";
import { authGuard, requireRole } from "../../shared/middleware/auth";
import { ok } from "../../shared/utils/response";
import * as materialsService from "./materials.service";
import { createMaterialSchema, updateMaterialSchema } from "./materials.schema";

export const materialRoutes = new Elysia({ prefix: "/materials" })
  .get("/public/viewer.js", async ({ set }) => {
    set.headers["content-type"] = "application/javascript; charset=utf-8";
    const candidates = [
      path.join(process.cwd(), "public/viewer.js"),
      path.join(process.cwd(), "apps/backend/public/viewer.js"),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return fs.readFileSync(p, "utf-8");
    }
    return "";
  })
  .use(authGuard)
  // Route siswa: ambil materi dari semua kelas yang diikuti (opsional filter class_id)
  .get("/my", async ({ user, query }) => ok(await materialsService.getStudentMaterials(user.id, (query as any).class_id)))
  .get("/class/:classId", async ({ user, params }) => ok(await materialsService.getClassMaterials(user.id, user.role, params.classId)))
  .get("/slug/:slug/view", async ({ user, params, set }) => {
    set.headers["content-type"] = "text/html; charset=utf-8";
    return await materialsService.renderMaterialView(user.id, user.role, params.slug);
  })
  .get("/slug/:slug", async ({ user, params }) => ok(await materialsService.getMaterialDetail(user.id, user.role, params.slug)))
  .post("/:id/presence", async ({ user, params }) => {
    return ok(
      materialsService.recordPresence(params.id, {
        student_id: user.id,
        name: user.name || "Siswa",
        identifier: user.identifier || "SISWA",
      })
    );
  })
  .get("/:id/readers", async ({ params }) => {
    return ok(materialsService.getActiveReaders(params.id));
  })
  .get("/:id/view", async ({ user, params, set }) => {
    set.headers["content-type"] = "text/html; charset=utf-8";
    return await materialsService.renderMaterialView(user.id, user.role, params.id);
  })
  .get("/:id", async ({ user, params }) => ok(await materialsService.getMaterialDetail(user.id, user.role, params.id)))
  .guard({ beforeHandle: requireRole("teacher") }, (app) =>
    app
      .get("", async ({ user }) => ok(await materialsService.getTeacherMaterials(user.id)))
      .post("", async ({ user, body }) => ok(await materialsService.createMaterial(user.id, body)), { body: createMaterialSchema })
      .put("/:id", async ({ user, params, body }) => ok(await materialsService.updateMaterial(user.id, params.id, body)), { body: updateMaterialSchema })
      .delete("/:id", async ({ user, params }) => ok(await materialsService.deleteMaterial(user.id, params.id)))
  );