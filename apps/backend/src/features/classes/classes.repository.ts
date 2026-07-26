// Fitur: repository kelas Drizzle ORM
import { db, schema } from "../../db";
import { eq, inArray, and } from "drizzle-orm";

export const createClass = async (data: { name: string; gradeLevel: string; academicYear: string; homeroomTeacherId: string; spreadsheetId?: string }) => {
  const [res] = await db
    .insert(schema.classes)
    .values({
      name: data.name,
      gradeLevel: data.gradeLevel,
      academicYear: data.academicYear,
      homeroomTeacherId: data.homeroomTeacherId,
      spreadsheetId: data.spreadsheetId || null,
    })
    .returning({
      id: schema.classes.id,
      name: schema.classes.name,
      grade_level: schema.classes.gradeLevel,
      academic_year: schema.classes.academicYear,
      homeroom_teacher_id: schema.classes.homeroomTeacherId,
      spreadsheet_id: schema.classes.spreadsheetId,
      created_at: schema.classes.createdAt,
    });
  return res;
};

export const updateClass = async (
  classId: string,
  data: { name?: string; gradeLevel?: string; academicYear?: string; spreadsheetId?: string | null }
) => {
  const patch: any = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.gradeLevel !== undefined) patch.gradeLevel = data.gradeLevel;
  if (data.academicYear !== undefined) patch.academicYear = data.academicYear;
  if (data.spreadsheetId !== undefined) patch.spreadsheetId = data.spreadsheetId;

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
      created_at: schema.classes.createdAt,
    })
    .from(schema.enrollments)
    .innerJoin(schema.classes, eq(schema.enrollments.classId, schema.classes.id))
    .where(eq(schema.enrollments.studentId, studentId));

  return rows;
};
