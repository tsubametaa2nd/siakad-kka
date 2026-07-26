// Fitur: tipe data shared
export type Role = "teacher" | "student";

export interface AuthUser {
  id: string;
  role: Role;
  name?: string;
  identifier?: string;
  token?: string;
}

export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
