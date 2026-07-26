// Vercel Serverless Edge Function Entry Point for ElysiaJS
export const config = {
  runtime: 'edge',
};

import { app } from "../src/index";

export default async function handler(request: Request) {
  return app.handle(request);
}
