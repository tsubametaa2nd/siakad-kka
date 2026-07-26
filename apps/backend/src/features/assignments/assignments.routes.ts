// Fitur: endpoint tugas
import { Elysia } from "elysia";
import { authGuard, requireRole } from "../../shared/middleware/auth";
import { ok } from "../../shared/utils/response";
import * as assignmentsService from "./assignments.service";
import { createAssignmentSchema, updateAssignmentSchema } from "./assignments.schema";

export const assignmentRoutes = new Elysia({ prefix: "/assignments" })
  .use(authGuard)
  // Rute siswa — ambil tugas dari kelas yang diikuti
  .get("/my", async ({ user, query }) => ok(await assignmentsService.getStudentAssignments(user.id, (query as any).class_id)))
  .get("/class/:classId", async ({ user, params }) => ok(await assignmentsService.getClassAssignments(user.id, user.role, params.classId)))
  .get("/:id", async ({ user, params }) => ok(await assignmentsService.getAssignmentDetail(user.id, user.role, params.id)))
  .use(requireRole("teacher"))
  // Rute guru — ambil semua tugas yang dibuat guru ini
  .get("", async ({ user }) => ok(await assignmentsService.getTeacherAssignments(user.id)))
  .post("", async ({ user, body }) => ok(await assignmentsService.createAssignment(user.id, body)), { body: createAssignmentSchema })
  .put("/:id", async ({ user, params, body }) => ok(await assignmentsService.updateAssignment(user.id, params.id, body)), { body: updateAssignmentSchema })
  .delete("/:id", async ({ user, params, query }) => ok(await assignmentsService.deleteAssignment(user.id, params.id, query.force === "true")));

