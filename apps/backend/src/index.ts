// Fitur: server entry point (updated AstraDB configuration)
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { env } from "./config/env.js";
import { assignmentRoutes } from "./features/assignments/assignments.routes.js";
import { authRoutes } from "./features/auth/auth.routes.js";
import { classRoutes } from "./features/classes/classes.routes.js";
import { gradingRoutes } from "./features/grading/grading.routes.js";
import { groupRoutes } from "./features/groups/groups.routes.js";
import { materialRoutes } from "./features/materials/materials.routes.js";
import { quizRoutes } from "./features/quiz/quiz.routes.js";
import { submissionRoutes } from "./features/submissions/submissions.routes.js";
import fs from "fs";
import os from "os";
import path from "path";
import { errorHandler } from "./shared/middleware/error.js";
import { getApiLandingHtml } from "./shared/utils/apiLandingHtml.js";
import { ok } from "./shared/utils/response.js";

const getMimeType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".gif": return "image/gif";
    case ".svg": return "image/svg+xml";
    case ".pdf": return "application/pdf";
    case ".doc": return "application/msword";
    case ".docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".js": return "application/javascript";
    case ".css": return "text/css";
    case ".json": return "application/json";
    case ".mp3": return "audio/mpeg";
    case ".mp4": return "video/mp4";
    default: return "application/octet-stream";
  }
};

export const app = new Elysia()
  .use(cors({
    origin: (request: Request) => {
      const origin = request.headers.get("origin");
      if (!origin) return true;
      return (
        env.ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".utaaa.my.id")
      );
    },
    credentials: true,
    allowedHeaders: ["content-type", "authorization", "accept", "x-requested-with"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }))
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
    const rawPath = params["*"] || "";
    const sanitizedPath = path.normalize(rawPath).replace(/^(\.\.[\/\\])+/, "");
    if (sanitizedPath.includes("..")) {
      set.status = 400;
      return "Akses ditolak";
    }

    const filePath = path.join(process.cwd(), "public", sanitizedPath);
    const altPath = path.join(process.cwd(), "apps/backend/public", sanitizedPath);
    const tmpPath = path.join(os.tmpdir(), "public", sanitizedPath);

    const allowedDirs = [
      path.resolve(process.cwd(), "public"),
      path.resolve(process.cwd(), "apps/backend/public"),
      path.resolve(os.tmpdir(), "public"),
    ];

    const candidates = [filePath, altPath, tmpPath];
    const targetPath = candidates.find((p) => {
      if (!fs.existsSync(p)) return false;
      const resolved = path.resolve(p);
      return allowedDirs.some((dir) => resolved.startsWith(dir));
    });

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
  .get("/api", async ({ headers, set }) => {
    const accept = headers["accept"] || "";
    if (accept.includes("text/html")) {
      set.headers["content-type"] = "text/html; charset=utf-8";
      return await getApiLandingHtml();
    }
    return ok({ message: "KKA Backend API operational", docs: "/docs", status: "online" });
  })
  .get("/api/", async ({ headers, set }) => {
    const accept = headers["accept"] || "";
    if (accept.includes("text/html")) {
      set.headers["content-type"] = "text/html; charset=utf-8";
      return await getApiLandingHtml();
    }
    return ok({ message: "KKA Backend API operational", docs: "/docs", status: "online" });
  })
  .use(authRoutes)
  .group("/api", (app) =>
    app
      .use(authRoutes)
      .use(classRoutes)
      .use(groupRoutes)
      .use(assignmentRoutes)
      .use(submissionRoutes)
      .use(quizRoutes)
      .use(materialRoutes)
      .use(gradingRoutes)
  );

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  app.listen(env.PORT);
  console.log(`🚀 Server running on port ${app.server?.port}`);
}

export default app;

