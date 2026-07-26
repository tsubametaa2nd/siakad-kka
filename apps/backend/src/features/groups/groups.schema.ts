// Fitur: skema validasi kelompok
import { t } from "elysia";

export const createGroupSchema = t.Object({
  name: t.String({ minLength: 1 }),
  classId: t.Optional(t.String()),
  class_id: t.Optional(t.String()),
  maxMembers: t.Optional(t.Numeric({ minimum: 1 })),
  max_members: t.Optional(t.Numeric({ minimum: 1 })),
});

export const joinGroupSchema = t.Object({
  groupId: t.Optional(t.String()),
  group_id: t.Optional(t.String()),
  classId: t.Optional(t.String()),
  class_id: t.Optional(t.String()),
});

export const leaveGroupSchema = t.Object({
  groupId: t.Optional(t.String()),
  group_id: t.Optional(t.String()),
  classId: t.Optional(t.String()),
  class_id: t.Optional(t.String()),
});

export const inviteGroupSchema = t.Object({
  groupId: t.Optional(t.String()),
  group_id: t.Optional(t.String()),
  studentId: t.Optional(t.String()),
  student_id: t.Optional(t.String()),
});

export type CreateGroupBody = typeof createGroupSchema.static;
export type JoinGroupBody = typeof joinGroupSchema.static;
export type LeaveGroupBody = typeof leaveGroupSchema.static;
export type InviteGroupBody = typeof inviteGroupSchema.static;
