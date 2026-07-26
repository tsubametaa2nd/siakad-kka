// Fitur: utilitas response envelope
import type { ApiResponse } from "../types";

export const ok = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

export const fail = (code: string, message: string): ApiResponse<never> => ({
  success: false,
  error: { code, message },
});
