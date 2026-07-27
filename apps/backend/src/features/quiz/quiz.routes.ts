// Fitur: endpoint quiz
import { Elysia } from "elysia";
import { authGuard, requireRole } from "../../shared/middleware/auth";
import { ok } from "../../shared/utils/response";
import * as quizService from "./quiz.service";
import { attemptQuizSchema, createQuizSchema, startQuizSchema } from "./quiz.schema";

export const quizRoutes = new Elysia({ prefix: "/quiz" })
  .use(authGuard)
  .get("/class/:classId", async ({ user, params }) => ok(await quizService.getClassQuizzes(user.id, user.role, params.classId)))
  .guard({ beforeHandle: requireRole("student") }, (app) =>
    app
      .get("/my", async ({ user, query }) => ok(await quizService.getStudentQuizzes(user.id, (query as any).class_id)))
      .get("/:id", async ({ user, params }) => ok(await quizService.getQuizForStudent(user.id, params.id)))
      .post("/start", async ({ user, body }) => ok(await quizService.startQuiz(user.id, body)), { body: startQuizSchema })
      .post("/attempt", async ({ user, body }) => ok(await quizService.submitAttempt(user.id, body)), { body: attemptQuizSchema })
      .patch("/attempt/progress", async ({ user, body }) => {
        await quizService.reportProgress(user.id, (body as any).attempt_id, (body as any).answered_count);
        return ok({ ok: true });
      })
      .get("/:id/leaderboard/siswa", async ({ user, params }) => ok(await quizService.getQuizLeaderboardForStudent(user.id, params.id)))
  )
  .guard({ beforeHandle: requireRole("teacher") }, (app) =>
    app
      .post("", async ({ user, body }) => ok(await quizService.createQuiz(user.id, body)), { body: createQuizSchema })
      .get("/:id/results", async ({ user, params }) => ok(await quizService.getQuizResults(user.id, params.id)))
      .get("/:id/leaderboard", async ({ user, params }) => ok(await quizService.getQuizLeaderboard(user.id, params.id)))
  );

