// Fitur: kelas error dan helper HTTP error
export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export const BadRequest = (msg = "Permintaan tidak valid", code = "BAD_REQUEST") => new AppError(400, code, msg);

export const Unauthorized = (msg = "Tidak terautentikasi", code = "UNAUTHORIZED") => new AppError(401, code, msg);

export const Forbidden = (msg = "Akses ditolak", code = "FORBIDDEN") => new AppError(403, code, msg);

export const NotFound = (msg = "Sumber daya tidak ditemukan", code = "NOT_FOUND") => new AppError(404, code, msg);

export const Conflict = (msg = "Konflik data", code = "CONFLICT") => new AppError(409, code, msg);

export const InternalServerError = (msg = "Terjadi kesalahan pada server", code = "INTERNAL_SERVER_ERROR") =>
  new AppError(500, code, msg);
