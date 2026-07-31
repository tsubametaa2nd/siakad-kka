// Fitur: repository kelas Drizzle ORM
import { db, schema } from "../../db";
import { eq, inArray, and } from "drizzle-orm";

export const createClass = async (data: { name: string; gradeLevel: string; academicYear: string; homeroomTeacherId: string; spreadsheetId?: string; scheduleDay?: string; scheduleTime?: string; room?: string }) => {
  const [res] = await db
    .insert(schema.classes)
    .values({
      name: data.name,
      gradeLevel: data.gradeLevel,
      academicYear: data.academicYear,
      homeroomTeacherId: data.homeroomTeacherId,
      spreadsheetId: data.spreadsheetId || null,
      scheduleDay: data.scheduleDay || null,
      scheduleTime: data.scheduleTime || null,
      room: data.room || null,
    })
    .returning({
      id: schema.classes.id,
      name: schema.classes.name,
      grade_level: schema.classes.gradeLevel,
      academic_year: schema.classes.academicYear,
      homeroom_teacher_id: schema.classes.homeroomTeacherId,
      spreadsheet_id: schema.classes.spreadsheetId,
      schedule_day: schema.classes.scheduleDay,
      schedule_time: schema.classes.scheduleTime,
      room: schema.classes.room,
      created_at: schema.classes.createdAt,
    });
  return res;
};

export const updateClass = async (
  classId: string,
  data: { name?: string; gradeLevel?: string; academicYear?: string; spreadsheetId?: string | null; scheduleDay?: string | null; scheduleTime?: string | null; room?: string | null }
) => {
  const patch: any = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.gradeLevel !== undefined) patch.gradeLevel = data.gradeLevel;
  if (data.academicYear !== undefined) patch.academicYear = data.academicYear;
  if (data.spreadsheetId !== undefined) patch.spreadsheetId = data.spreadsheetId;
  if (data.scheduleDay !== undefined) patch.scheduleDay = data.scheduleDay;
  if (data.scheduleTime !== undefined) patch.scheduleTime = data.scheduleTime;
  if (data.room !== undefined) patch.room = data.room;

  const [updated] = await db
    .update(schema.classes)
    .set(patch)
    .where(eq(schema.classes.id, classId))
    .returning({
      id: schema.classes.id,
      name: schema.classes.name,
      grade_level: schema.classes.gradeLevel,
      academic_year: schema.classes.academicYear,
      homeroom_teacher_id: schema.classes.homeroomTeacherId,
      spreadsheet_id: schema.classes.spreadsheetId,
      schedule_day: schema.classes.scheduleDay,
      schedule_time: schema.classes.scheduleTime,
      room: schema.classes.room,
      created_at: schema.classes.createdAt,
    });

  return updated;
};


export const findClassById = async (classId: string) => {
  const [data] = await db.select().from(schema.classes).where(eq(schema.classes.id, classId));
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    grade_level: data.gradeLevel,
    academic_year: data.academicYear,
    homeroom_teacher_id: data.homeroomTeacherId,
    spreadsheet_id: data.spreadsheetId,
    schedule_day: data.scheduleDay,
    schedule_time: data.scheduleTime,
    room: data.room,
    created_at: data.createdAt,
  };
};

export const isTeacherOfClass = async (teacherId: string, classId: string): Promise<boolean> => {
  const [cls] = await db
    .select({ id: schema.classes.id })
    .from(schema.classes)
    .where(and(eq(schema.classes.id, classId), eq(schema.classes.homeroomTeacherId, teacherId)));
  if (cls) return true;

  const [assign] = await db
    .select({ class_id: schema.teachingAssignments.classId })
    .from(schema.teachingAssignments)
    .where(and(eq(schema.teachingAssignments.classId, classId), eq(schema.teachingAssignments.teacherId, teacherId)));
  return !!assign;
};

export const isStudentEnrolled = async (studentId: string, classId: string): Promise<boolean> => {
  const [data] = await db
    .select({ student_id: schema.enrollments.studentId })
    .from(schema.enrollments)
    .where(and(eq(schema.enrollments.studentId, studentId), eq(schema.enrollments.classId, classId)));
  return !!data;
};

export const findClassesByTeacher = async (teacherId: string) => {
  const hrClasses = await db.select().from(schema.classes).where(eq(schema.classes.homeroomTeacherId, teacherId));

  const taRows = await db
    .select({
      id: schema.classes.id,
      name: schema.classes.name,
      grade_level: schema.classes.gradeLevel,
      academic_year: schema.classes.academicYear,
      homeroom_teacher_id: schema.classes.homeroomTeacherId,
      spreadsheet_id: schema.classes.spreadsheetId,
      schedule_day: schema.classes.scheduleDay,
      schedule_time: schema.classes.scheduleTime,
      room: schema.classes.room,
      created_at: schema.classes.createdAt,
    })
    .from(schema.teachingAssignments)
    .innerJoin(schema.classes, eq(schema.teachingAssignments.classId, schema.classes.id))
    .where(eq(schema.teachingAssignments.teacherId, teacherId));

  const allMap = new Map();
  [...hrClasses.map((c) => ({
    id: c.id,
    name: c.name,
    grade_level: c.gradeLevel,
    academic_year: c.academicYear,
    homeroom_teacher_id: c.homeroomTeacherId,
    spreadsheet_id: c.spreadsheetId,
    schedule_day: c.scheduleDay,
    schedule_time: c.scheduleTime,
    room: c.room,
    created_at: c.createdAt,
  })), ...taRows].forEach((c) => allMap.set(c.id, c));

  return Array.from(allMap.values());
};

export const findProfilesByIds = async (ids: string[]) => {
  if (!ids || ids.length === 0) return [];
  const data = await db
    .select({
      id: schema.profiles.id,
      role: schema.profiles.role,
      full_name: schema.profiles.fullName,
      identifier: schema.profiles.identifier,
    })
    .from(schema.profiles)
    .where(inArray(schema.profiles.id, ids));

  return data || [];
};

export const upsertEnrollments = async (classId: string, studentIds: string[]) => {
  if (!studentIds || studentIds.length === 0) return;
  const records = studentIds.map((studentId) => ({ classId, studentId }));
  await db
    .insert(schema.enrollments)
    .values(records)
    .onConflictDoNothing({ target: [schema.enrollments.studentId, schema.enrollments.classId] });
};

export const findClassStudents = async (classId: string) => {
  const rows = await db
    .select({
      id: schema.profiles.id,
      name: schema.profiles.fullName,
      full_name: schema.profiles.fullName,
      identifier: schema.profiles.identifier,
      enrolledAt: schema.enrollments.enrolledAt,
    })
    .from(schema.enrollments)
    .innerJoin(schema.profiles, eq(schema.enrollments.studentId, schema.profiles.id))
    .where(eq(schema.enrollments.classId, classId));

  return rows;
};

export const findClassesByStudent = async (studentId: string) => {
  const rows = await db
    .select({
      id: schema.classes.id,
      name: schema.classes.name,
      grade_level: schema.classes.gradeLevel,
      academic_year: schema.classes.academicYear,
      homeroom_teacher_id: schema.classes.homeroomTeacherId,
      spreadsheet_id: schema.classes.spreadsheetId,
      schedule_day: schema.classes.scheduleDay,
      schedule_time: schema.classes.scheduleTime,
      room: schema.classes.room,
      created_at: schema.classes.createdAt,
    })
    .from(schema.enrollments)
    .innerJoin(schema.classes, eq(schema.enrollments.classId, schema.classes.id))
    .where(eq(schema.enrollments.studentId, studentId));

  return rows;
};

export const addTeachingAssignment = async (classId: string, teacherId: string) => {
  const [assign] = await db
    .insert(schema.teachingAssignments)
    .values({ classId, teacherId })
    .returning();
  return assign;
};

export const removeTeachingAssignment = async (classId: string, teacherId: string) => {
  await db
    .delete(schema.teachingAssignments)
    .where(and(eq(schema.teachingAssignments.classId, classId), eq(schema.teachingAssignments.teacherId, teacherId)));
};

export const findClassTeachers = async (classId: string) => {
  const cls = await findClassById(classId);
  if (!cls) return [];

  const homeroom = await findProfilesByIds([cls.homeroom_teacher_id]);
  const taRows = await db
    .select({
      id: schema.profiles.id,
      name: schema.profiles.fullName,
      full_name: schema.profiles.fullName,
      identifier: schema.profiles.identifier,
      role: schema.profiles.role,
    })
    .from(schema.teachingAssignments)
    .innerJoin(schema.profiles, eq(schema.teachingAssignments.teacherId, schema.profiles.id))
    .where(eq(schema.teachingAssignments.classId, classId));

  const map = new Map<string, any>();
  if (homeroom[0]) {
    map.set(homeroom[0].id, { ...homeroom[0], is_homeroom: true });
  }
  taRows.forEach((t) => {
    if (!map.has(t.id)) {
      map.set(t.id, { ...t, is_homeroom: false });
    }
  });

  return Array.from(map.values());
};
