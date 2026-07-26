// Fitur: skema validasi pengumpulan tugas
import { t } from "elysia";

export const submitSchema = t.Object({
  assignmentId: t.Optional(t.String()),
  assignment_id: t.Optional(t.String()),
  links: t.Optional(t.Any()),
  files: t.Optional(t.Any()),
});

export const updateSubmissionSchema = t.Object({
  version: t.Optional(t.Any()),
  links: t.Optional(t.Any()),
  files: t.Optional(t.Any()),
});

export type SubmitBody = typeof submitSchema.static;
export type UpdateSubmissionBody = typeof updateSubmissionSchema.static;
