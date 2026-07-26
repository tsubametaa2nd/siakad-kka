// Fitur: endpoint kelas & enrollment
import { Elysia } from "elysia";
import { authGuard, requireRole } from "../../shared/middleware/auth";
import { ok } from "../../shared/utils/response";
import * as classesService from "./classes.service";
import { createClassSchema, updateClassSchema, enrollSchema, importSpreadsheetSchema } from "./classes.schema";

export const classRoutes = new Elysia({ prefix: "/classes" })
  .use(authGuard)
  .get("/my", async ({ user }) => ok(await classesService.getStudentClasses(user.id)))
  .get("/:id/students", async ({ user, params }) => ok(await classesService.getClassStudents(user.id, user.role, params.id)))
  .use(requireRole("teacher"))
  .post("", async ({ user, body }) => ok(await classesService.createClass(user.id, body)), { body: createClassSchema })
  .get("", async ({ user }) => ok(await classesService.getTeacherClasses(user.id)))
  .get("/:id", async ({ user, params }) => ok(await classesService.getClassById(user.id, params.id)))
  .put("/:id", async ({ user, params, body }) => ok(await classesService.updateClass(user.id, params.id, body)), { body: updateClassSchema })
  .post("/:id/enroll", async ({ user, params, body }) => ok(await classesService.enrollStudents(user.id, params.id, body.studentIds)), { body: enrollSchema })
  .post("/:id/import-spreadsheet", async ({ user, params, body }) => ok(await classesService.importFromSpreadsheet(user.id, params.id, body.spreadsheetUrl)), { body: importSpreadsheetSchema });


