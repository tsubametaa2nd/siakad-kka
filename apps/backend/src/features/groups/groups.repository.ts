// Fitur: repository kelompok Drizzle ORM
import { db, schema } from "../../db";
import { eq, and, sql, asc } from "drizzle-orm";

export const isStudentEnrolled = async (studentId: string, classId: string) => {
  const [data] = await db
    .select({ student_id: schema.enrollments.studentId })
    .from(schema.enrollments)
    .where(and(eq(schema.enrollments.studentId, studentId), eq(schema.enrollments.classId, classId)));
  return !!data;
};

export const createGroup = async (name: string, classId: string, leaderId: string, maxMembers = 5) => {
  const [data] = await db
    .insert(schema.groups)
    .values({ name, classId, leaderId, maxMembers: Number(maxMembers) })
    .returning({
      id: schema.groups.id,
      name: schema.groups.name,
      class_id: schema.groups.classId,
      leader_id: schema.groups.leaderId,
      max_members: schema.groups.maxMembers,
      created_at: schema.groups.createdAt,
    });
  return data;
};

export const addMember = async (groupId: string, studentId: string, classId: string) => {
  await db.insert(schema.groupMembers).values({ groupId, studentId, classId });
};

export const findGroupById = async (groupId: string) => {
  const [data] = await db.select().from(schema.groups).where(eq(schema.groups.id, groupId));
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    class_id: data.classId,
    leader_id: data.leaderId,
    max_members: data.maxMembers,
    created_at: data.createdAt,
  };
};

export const countMembers = async (groupId: string) => {
  const [res] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.groupMembers)
    .where(eq(schema.groupMembers.groupId, groupId));
  return res?.count || 0;
};

export const removeMember = async (groupId: string, studentId: string) => {
  await db
    .delete(schema.groupMembers)
    .where(and(eq(schema.groupMembers.groupId, groupId), eq(schema.groupMembers.studentId, studentId)));
};

export const findRemainingMembers = async (groupId: string) => {
  const rows = await db
    .select({
      student_id: schema.groupMembers.studentId,
      joined_at: schema.groupMembers.joinedAt,
    })
    .from(schema.groupMembers)
    .where(eq(schema.groupMembers.groupId, groupId))
    .orderBy(asc(schema.groupMembers.joinedAt));
  return rows;
};

export const updateGroupLeader = async (groupId: string, newLeaderId: string) => {
  await db
    .update(schema.groups)
    .set({ leaderId: newLeaderId })
    .where(eq(schema.groups.id, groupId));
};

export const deleteGroup = async (groupId: string) => {
  await db.delete(schema.groups).where(eq(schema.groups.id, groupId));
};

export const findGroupsByClass = async (classId: string) => {
  const groupRows = await db
    .select()
    .from(schema.groups)
    .where(eq(schema.groups.classId, classId));

  const result: any[] = [];
  for (const g of groupRows) {
    const rawMembers = await db
      .select({
        joined_at: schema.groupMembers.joinedAt,
        profiles: {
          id: schema.profiles.id,
          full_name: schema.profiles.fullName,
          identifier: schema.profiles.identifier,
        },
      })
      .from(schema.groupMembers)
      .innerJoin(schema.profiles, eq(schema.groupMembers.studentId, schema.profiles.id))
      .where(eq(schema.groupMembers.groupId, g.id));

    const members = rawMembers.map((m) => ({
      student_id: m.profiles.id,
      name: m.profiles.full_name,
      identifier: m.profiles.identifier,
      joined_at: m.joined_at,
    }));

    result.push({
      id: g.id,
      name: g.name,
      class_id: g.classId,
      leader_id: g.leaderId,
      max_members: g.maxMembers,
      created_at: g.createdAt,
      members,
      member_count: members.length,
    });
  }

  return result;
};

export const findStudentGroups = async (studentId: string) => {
  const rows = await db
    .select({
      groups: {
        id: schema.groups.id,
        name: schema.groups.name,
        class_id: schema.groups.classId,
        leader_id: schema.groups.leaderId,
        max_members: schema.groups.maxMembers,
        created_at: schema.groups.createdAt,
      },
    })
    .from(schema.groupMembers)
    .innerJoin(schema.groups, eq(schema.groupMembers.groupId, schema.groups.id))
    .where(eq(schema.groupMembers.studentId, studentId));

  const result: any[] = [];
  for (const r of rows) {
    const g = r.groups;
    const rawMembers = await db
      .select({
        joined_at: schema.groupMembers.joinedAt,
        profiles: {
          id: schema.profiles.id,
          full_name: schema.profiles.fullName,
          identifier: schema.profiles.identifier,
        },
      })
      .from(schema.groupMembers)
      .innerJoin(schema.profiles, eq(schema.groupMembers.studentId, schema.profiles.id))
      .where(eq(schema.groupMembers.groupId, g.id));

    const members = rawMembers.map((m) => ({
      student_id: m.profiles.id,
      name: m.profiles.full_name,
      identifier: m.profiles.identifier,
      joined_at: m.joined_at,
    }));

    result.push({
      id: g.id,
      name: g.name,
      class_id: g.class_id,
      leader_id: g.leader_id,
      max_members: g.max_members,
      created_at: g.created_at,
      members,
      member_count: members.length,
    });
  }

  return result;
};
