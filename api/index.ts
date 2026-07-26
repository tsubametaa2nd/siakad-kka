// Vercel Serverless Function Entry Point for ElysiaJS
import { app } from "../apps/backend/src/index";

export default async function handler(request: Request) {
  return app.fetch(request);
}
