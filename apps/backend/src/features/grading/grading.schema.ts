// Fitur: skema validasi penilaian
import { t } from "elysia";

export const gradeBodySchema = t.Object({
  assignmentId: t.Optional(t.String()),
  assignment_id: t.Optional(t.String()),
  studentId: t.Optional(t.String()),
  student_id: t.Optional(t.String()),
  score: t.Numeric({ minimum: 0 }),
  feedback: t.Optional(t.String()),
});

export const bulkGradeItemSchema = t.Object({
  studentId: t.String({ minLength: 1 }),
  score: t.Numeric({ minimum: 0 }),
  feedback: t.Optional(t.String()),
});

export const bulkGradeBodySchema = t.Object({
  assignmentId: t.String({ minLength: 1 }),
  grades: t.Array(bulkGradeItemSchema, { minItems: 1 }),
});

export type GradeBody = typeof gradeBodySchema.static;
export type BulkGradeBody = typeof bulkGradeBodySchema.static;
