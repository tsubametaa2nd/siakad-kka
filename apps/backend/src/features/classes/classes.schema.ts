// Fitur: skema validasi kelas & enrollment
import { t } from "elysia";

export const createClassSchema = t.Object({
  name: t.String({ minLength: 1 }),
  gradeLevel: t.String({ minLength: 1 }),
  academicYear: t.String({ minLength: 1 }),
  spreadsheetId: t.Optional(t.String()),
  scheduleDay: t.Optional(t.String()),
  scheduleTime: t.Optional(t.String()),
  startTime: t.Optional(t.String()),
  endTime: t.Optional(t.String()),
  room: t.Optional(t.String()),
});

export const enrollSchema = t.Object({
  studentIds: t.Array(t.String({ minLength: 1 })),
});

export const importSpreadsheetSchema = t.Object({
  spreadsheetUrl: t.String({ minLength: 1 }),
});

export const updateClassSchema = t.Partial(createClassSchema);

export const assignTeacherSchema = t.Object({
  teacherId: t.String({ minLength: 1 }),
});

export type CreateClassBody = typeof createClassSchema.static;
export type UpdateClassBody = typeof updateClassSchema.static;
export type EnrollBody = typeof enrollSchema.static;
export type ImportSpreadsheetBody = typeof importSpreadsheetSchema.static;
export type AssignTeacherBody = typeof assignTeacherSchema.static;

