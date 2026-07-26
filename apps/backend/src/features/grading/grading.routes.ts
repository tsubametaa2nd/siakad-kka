// Fitur: endpoint penilaian
import { Elysia } from "elysia";
import { requireRole } from "../../shared/middleware/auth";
import { ok } from "../../shared/utils/response";
import * as gradingService from "./grading.service";
import { bulkGradeBodySchema, gradeBodySchema } from "./grading.schema";

export const gradingRoutes = new Elysia({ prefix: "/grading" })
  .use(requireRole("student"))
  .get("/my", async ({ user }) => ok(await gradingService.getStudentMyGrades(user.id)))
  .use(requireRole("teacher"))
  .get("/summary", async ({ user }) => ok(await gradingService.getTeacherGradingSummary(user.id)))
  .post("", async ({ user, body }) => ok(await gradingService.gradeStudent(user.id, body)), { body: gradeBodySchema })
  .post("/bulk", async ({ user, body }) => ok(await gradingService.bulkGrade(user.id, body)), { body: bulkGradeBodySchema })
  .get("/assignment/:id", async ({ user, params }) => ok(await gradingService.getAssignmentGrades(user.id, params.id)))
  .get("/assignment/:id/grading", async ({ user, params }) => ok(await gradingService.getAssignmentGrading(user.id, params.id)))
  .post("/sync/:classId", async ({ user, params }) => ok(await gradingService.retryClassSync(user.id, params.classId)));

