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

export const updateAssignmentSchema = t.Partial(createAssignmentSchema);

export type CreateAssignmentBody = typeof createAssignmentSchema.static;
export type UpdateAssignmentBody = typeof updateAssignmentSchema.static;
