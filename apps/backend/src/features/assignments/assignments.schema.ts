// Fitur: skema validasi tugas
import { t } from "elysia";

export const createAssignmentSchema = t.Object({
  classId: t.Optional(t.Any()),
  class_id: t.Optional(t.Any()),
  title: t.Optional(t.Any()),
  description: t.Optional(t.Any()),
  type: t.Optional(t.Any()),
  groupSubmissionMode: t.Optional(t.Any()),
  group_submission_mode: t.Optional(t.Any()),
  deadline: t.Optional(t.Any()),
  due_date: t.Optional(t.Any()),
  maxScore: t.Optional(t.Any()),
  max_score: t.Optional(t.Any()),
  files: t.Optional(t.Any()),
  attachments: t.Optional(t.Any()),
});

export const updateAssignmentSchema = t.Object({
  title: t.Optional(t.Any()),
  description: t.Optional(t.Any()),
  type: t.Optional(t.Any()),
  groupSubmissionMode: t.Optional(t.Any()),
  group_submission_mode: t.Optional(t.Any()),
  deadline: t.Optional(t.Any()),
  due_date: t.Optional(t.Any()),
  maxScore: t.Optional(t.Any()),
  max_score: t.Optional(t.Any()),
  files: t.Optional(t.Any()),
  attachments: t.Optional(t.Any()),
  existing_attachments: t.Optional(t.Any()),
});

export type CreateAssignmentBody = typeof createAssignmentSchema.static;
export type UpdateAssignmentBody = typeof updateAssignmentSchema.static;

