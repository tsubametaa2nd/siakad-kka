// Fitur: server entry point (updated AstraDB configuration)
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { env } from "./config/env";
import { assignmentRoutes } from "./features/assignments/assignments.routes";
import { authRoutes } from "./features/auth/auth.routes";
import { classRoutes } from "./features/classes/classes.routes";
import { gradingRoutes } from "./features/grading/grading.routes";
import { groupRoutes } from "./features/groups/groups.routes";
import { materialRoutes } from "./features/materials/materials.routes";
import { quizRoutes } from "./features/quiz/quiz.routes";
import { submissionRoutes } from "./features/submissions/submissions.routes";
import { errorHandler } from "./shared/middleware/error";
import { getApiLandingHtml } from "./shared/utils/apiLandingHtml";
import { ok } from "./shared/utils/response";

export const app = new Elysia()
  .use(cors())
  .use(swagger({ path: "/docs" }))
  .use(errorHandler)
  .get("/", async ({ headers, set }) => {
    const accept = headers["accept"] || "";
    if (accept.includes("text/html")) {
      set.headers["content-type"] = "text/html; charset=utf-8";
      return await getApiLandingHtml();
    }
    return ok({ message: "Ngajar Backend API operational", docs: "/docs", status: "online" });
  })
  .get("/health", () => ok({ status: "ok" }))
  .get("/public/*", ({ params }) => Bun.file("public/" + params["*"]))
  .group("/api", (app) =>
    app
      .get("", async ({ headers, set }) => {
        const accept = headers["accept"] || "";
        if (accept.includes("text/html")) {
          set.headers["content-type"] = "text/html; charset=utf-8";
          return await getApiLandingHtml();
        }
        return ok({ message: "Ngajar Backend API operational", docs: "/docs", status: "online" });
      })
      .use(authRoutes)
      .use(classRoutes)
      .use(groupRoutes)
      .use(assignmentRoutes)
      .use(submissionRoutes)
      .use(quizRoutes)
      .use(materialRoutes)
      .use(gradingRoutes)
  )
  .listen(env.PORT);

console.log(`🚀 Server running on port ${app.server?.port}`);
