// Fitur: layanan bisnis tugas
import { assertTeacherOwnsClass } from "../classes/classes.service";
import { isStudentEnrolled, findClassesByStudent } from "../classes/classes.repository";
import { BadRequest, Conflict, Forbidden, NotFound } from "../../shared/utils/errors";
import * as assignmentsRepo from "./assignments.repository";
import type { CreateAssignmentBody, UpdateAssignmentBody } from "./assignments.schema";

const validateFutureDeadline = (deadlineStr: string) => {
  const date = new Date(deadlineStr);
  if (isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    throw BadRequest("Deadline harus di masa depan");
  }
  return date.toISOString();
};

export const createAssignment = async (teacherId: string, body: CreateAssignmentBody) => {
  await assertTeacherOwnsClass(teacherId, body.classId);
  const deadlineUtc = validateFutureDeadline(body.deadline);

  return await assignmentsRepo.createAssignment({
    classId: body.classId,
    teacherId,
    title: body.title,
    description: body.description,
    type: body.type,
    groupSubmissionMode: body.type === "group" ? (body.groupSubmissionMode || "representative") : undefined,
    deadline: deadlineUtc,
    maxScore: Number(body.maxScore),
  });
};

export const updateAssignment = async (teacherId: string, assignmentId: string, body: any) => {
  const assignment = await assignmentsRepo.findAssignmentById(assignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");
  if (assignment.teacherId !== teacherId) throw Forbidden("Anda tidak memiliki hak akses untuk mengubah tugas ini");

  const updates: any = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.type !== undefined) updates.type = body.type;

  const gMode = body.groupSubmissionMode || body.group_submission_mode;
  if (gMode !== undefined) {
    updates.groupSubmissionMode = gMode;
  }

  const deadlineStr = body.deadline || body.due_date;
  if (deadlineStr) {
    updates.deadline = validateFutureDeadline(deadlineStr);
  }

  const maxScore = body.maxScore !== undefined ? body.maxScore : body.max_score;
  if (maxScore !== undefined) {
    updates.maxScore = Number(maxScore);
  }

  return await assignmentsRepo.updateAssignment(assignmentId, updates);
};

export const deleteAssignment = async (teacherId: string, assignmentId: string, force = false) => {
  const assignment = await assignmentsRepo.findAssignmentById(assignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");
  if (assignment.teacherId !== teacherId) throw Forbidden("Anda tidak memiliki hak akses untuk menghapus tugas ini");

  const subCount = await assignmentsRepo.countSubmissions(assignmentId);
  if (subCount > 0 && !force) {
    throw Conflict("Tugas sudah memiliki pengumpulan. Gunakan force=true untuk menghapus beserta pengumpulan", "HAS_SUBMISSIONS");
  }

  if (subCount > 0 && force) {
    await assignmentsRepo.deleteSubmissionsByAssignment(assignmentId);
  }

  await assignmentsRepo.deleteAssignment(assignmentId);
  return { deleted: true };
};

export const getClassAssignments = async (userId: string, userRole: string, classId: string) => {
  if (userRole === "teacher") {
    await assertTeacherOwnsClass(userId, classId);
    return await assignmentsRepo.findAssignmentsByClass(classId);
  }

  const enrolled = await isStudentEnrolled(userId, classId);
  if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");

  const assignments = await assignmentsRepo.findAssignmentsByClass(classId);
  const submissions = await assignmentsRepo.findStudentSubmissionsForClass(classId, userId);
  const subMap = new Map<string, any>(submissions.map((s: any) => [s.assignmentId, s]));

  return assignments.map((a: any) => {
    const sub: any = subMap.get(a._id);
    let status = "belum";
    if (sub) {
      if (sub.score !== undefined && sub.score !== null) status = "dinilai";
      else if (sub.isLate) status = "telat";
      else status = "sudah";
    }
    return { ...a, studentStatus: status };
  });
};

export const getAssignmentDetail = async (userId: string, userRole: string, assignmentId: string) => {
  const assignment = await assignmentsRepo.findAssignmentById(assignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");

  if (userRole === "teacher") {
    await assertTeacherOwnsClass(userId, assignment.classId);
  } else {
    const enrolled = await isStudentEnrolled(userId, assignment.classId);
    if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");
  }

  return assignment;
};

/** Ambil semua tugas yang dibuat oleh guru ini (lintas kelas) */
export const getTeacherAssignments = async (teacherId: string) => {
  return await assignmentsRepo.findAssignmentsByTeacher(teacherId);
};

import { findStudentGroups } from "../groups/groups.repository";

/** Ambil semua tugas dari kelas-kelas yang diikuti siswa */
export const getStudentAssignments = async (studentId: string, classId?: string) => {
  const studentGroups = await findStudentGroups(studentId);
  const groupIds = studentGroups.map((g: any) => g.id);

  if (classId) {
    const enrolled = await isStudentEnrolled(studentId, classId);
    if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");
    const assignments = await assignmentsRepo.findAssignmentsByClass(classId);
    const submissions = await assignmentsRepo.findStudentSubmissionsForClass(classId, studentId, groupIds);
    return attachStudentStatus(assignments, submissions);
  }

  const enrolledClasses = await findClassesByStudent(studentId);
  if (!enrolledClasses || enrolledClasses.length === 0) return [];

  const classIds = enrolledClasses.map((c) => c.id);
  const assignments = await assignmentsRepo.findAssignmentsByClassIds(classIds);
  const submissions = await assignmentsRepo.findStudentAllSubmissions(studentId, groupIds);

  return attachStudentStatus(assignments, submissions);
};

const attachStudentStatus = (assignments: any[], submissions: any[]) => {
  const subMap = new Map(submissions.map((s: any) => [s.assignmentId, s]));
  return assignments.map((a: any) => {
    const sub = subMap.get(a._id);
    let status = "belum";
    if (sub) {
      if (sub.score !== undefined && sub.score !== null) status = "dinilai";
      else if (sub.isLate) status = "telat";
      else status = "sudah";
    }
    return { ...a, studentStatus: status };
  });
};
