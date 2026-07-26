// Fitur: error handler global
import { Elysia } from "elysia";
import { AppError } from "../utils/errors";

export const errorHandler = new Elysia({ name: "errorHandler" }).onError(({ code, error, set }) => {
  set.headers["content-type"] = "application/json; charset=utf-8";

  if (error instanceof AppError) {
    set.status = error.status;
    return { success: false, error: { code: error.code, message: error.message } };
  }

  if (code === "VALIDATION") {
    set.status = 400;
    return { success: false, error: { code: "BAD_REQUEST", message: error.message } };
  }

  console.error("Unhandled Server Error:", error);
  set.status = 500;
  return {
    success: false,
    error: { code: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan internal pada server" },
  };
});
