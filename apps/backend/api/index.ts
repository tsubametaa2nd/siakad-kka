// Vercel Serverless Node.js Function Entry Point for ElysiaJS
import { app } from "../src/index.js";

export default async function handler(req: any, res: any) {
  if (req instanceof Request) {
    return app.fetch(req);
  }

  // Node.js Serverless Function (req: IncomingMessage, res: ServerResponse)
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const fullUrl = `${protocol}://${host}${req.url || ""}`;

  const method = req.method || "GET";
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, value as string);
      }
    }
  }

  let body: any = null;
  if (method !== "GET" && method !== "HEAD") {
    body = await new Promise((resolve) => {
      const chunks: Uint8Array[] = [];
      req.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  const webReq = new Request(fullUrl, {
    method,
    headers,
    body: body && body.length > 0 ? body : undefined,
  });

  const webRes = await app.fetch(webReq);

  res.statusCode = webRes.status;
  webRes.headers.forEach((val: string, key: string) => {
    res.setHeader(key, val);
  });

  const arrayBuffer = await webRes.arrayBuffer();
  res.end(Buffer.from(arrayBuffer));
}
