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
import fs from "fs";
import path from "path";
import { errorHandler } from "./shared/middleware/error";
import { getApiLandingHtml } from "./shared/utils/apiLandingHtml";
import { ok } from "./shared/utils/response";

const getMimeType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".gif": return "image/gif";
    case ".svg": return "image/svg+xml";
    case ".pdf": return "application/pdf";
    case ".mp3": return "audio/mpeg";
    case ".mp4": return "video/mp4";
    default: return "application/octet-stream";
  }
};

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
  .get("/public/*", async ({ params, set }) => {
    const relativePath = params["*"];
    const filePath = path.join(process.cwd(), "public", relativePath);
    const altPath = path.join(process.cwd(), "apps/backend/public", relativePath);
    const targetPath = fs.existsSync(filePath) ? filePath : fs.existsSync(altPath) ? altPath : null;

    if (!targetPath) {
      set.status = 404;
      return "File tidak ditemukan";
    }

    if (typeof Bun !== "undefined") {
      return Bun.file(targetPath);
    }

    set.headers["content-type"] = getMimeType(targetPath);
    return fs.readFileSync(targetPath);
  })
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
  );

if (!process.env.VERCEL) {
  app.listen(env.PORT);
  console.log(`🚀 Server running on port ${app.server?.port}`);
}
