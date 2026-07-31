// Fitur: skema validasi tugas
import { t } from "elysia";

export const createAssignmentSchema = t.Object({
  classId: t.String({ minLength: 1 }),
  title: t.String({ minLength: 1 }),
  description: t.String({ minLength: 1 }),
  type: t.Union([t.Literal("individual"), t.Literal("group")]),
  groupSubmissionMode: t.Optional(t.Union([t.Literal("representative"), t.Literal("individual")])),
  deadline: t.String({ minLength: 1 }),
  maxScore: t.Numeric({ minimum: 1, maximum: 100 }),
});

export const updateAssignmentSchema = t.Object({
  title: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String({ minLength: 1 })),
  type: t.Optional(t.Union([t.Literal("individual"), t.Literal("group")])),
  groupSubmissionMode: t.Optional(t.Union([t.Literal("representative"), t.Literal("individual")])),
  group_submission_mode: t.Optional(t.Union([t.Literal("representative"), t.Literal("individual")])),
  deadline: t.Optional(t.String({ minLength: 1 })),
  due_date: t.Optional(t.String({ minLength: 1 })),
  maxScore: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  max_score: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
});

export type CreateAssignmentBody = typeof createAssignmentSchema.static;
export type UpdateAssignmentBody = typeof updateAssignmentSchema.static;
