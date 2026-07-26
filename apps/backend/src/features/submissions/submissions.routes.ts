// Fitur: endpoint pengumpulan tugas
import { Elysia } from "elysia";
import { requireRole } from "../../shared/middleware/auth";
import { ok } from "../../shared/utils/response";
import * as subService from "./submissions.service";
import { submitSchema, updateSubmissionSchema } from "./submissions.schema";

export const submissionRoutes = new Elysia({ prefix: "/submissions" })
  .use(requireRole("student"))
  .get("/my/:assignmentId", async ({ user, params }) => ok(await subService.getStudentSubmission(user.id, params.assignmentId)))
  .post("", async ({ user, body }) => ok(await subService.submitAssignment(user.id, body as any)), { body: submitSchema })
  .put("/:id", async ({ user, params, body }) => ok(await subService.updateSubmission(user.id, params.id, body as any)), { body: updateSubmissionSchema })
  .delete("/:id", async ({ user, params }) => ok(await subService.deleteSubmission(user.id, params.id)))
  .use(requireRole("teacher"))
  .get("/assignment/:assignmentId", async ({ user, params }) => ok(await subService.getTeacherSubmissions(user.id, params.assignmentId)));
