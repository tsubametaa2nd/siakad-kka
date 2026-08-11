// Fitur: layanan bisnis tugas
import { assertTeacherOwnsClass } from "../classes/classes.service";
import { isStudentEnrolled, findClassesByStudent } from "../classes/classes.repository";
import { BadRequest, Conflict, Forbidden, NotFound } from "../../shared/utils/errors";
import * as assignmentsRepo from "./assignments.repository";
import type { CreateAssignmentBody, UpdateAssignmentBody } from "./assignments.schema";
import {
  attachSignedUrlsToAssignment,
  removeAssignmentStorageFiles,
  uploadAssignmentFiles,
  validateAssignmentFiles,
} from "./assignments.files";
import { findStudentGroups } from "../groups/groups.repository";

const validateFutureDeadline = (deadlineStr: string) => {
  const date = new Date(deadlineStr);
  if (isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    throw BadRequest("Deadline harus di masa depan");
  }
  return date.toISOString();
};

export const createAssignment = async (teacherId: string, body: any) => {
  const targetClassId = body.classId || body.class_id;
  if (!targetClassId) throw BadRequest("classId wajib diisi");

  const title = body.title;
  const description = body.description;
  const deadlineStr = body.deadline || body.due_date;
  if (!title || !description || !deadlineStr) {
    throw BadRequest("Judul, deskripsi, dan tenggat waktu wajib diisi");
  }

  await assertTeacherOwnsClass(teacherId, targetClassId);
  const deadlineUtc = validateFutureDeadline(deadlineStr);

  const rawFiles = body.files || body.attachments;
  const validatedFiles = validateAssignmentFiles(rawFiles);
  let uploadedAttachments: any[] = [];
  if (validatedFiles.length > 0) {
    uploadedAttachments = await uploadAssignmentFiles(targetClassId, teacherId, validatedFiles);
  }

  const type = body.type || "individual";
  const gMode = body.groupSubmissionMode || body.group_submission_mode;

  const doc = await assignmentsRepo.createAssignment({
    classId: targetClassId,
    teacherId,
    title,
    description,
    type,
    groupSubmissionMode: type === "group" ? (gMode || "representative") : undefined,
    deadline: deadlineUtc,
    maxScore: Number(body.maxScore || body.max_score || 100),
    attachments: uploadedAttachments,
  });

  return await attachSignedUrlsToAssignment(doc);
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

  // Handle attachments
  let currentAttachments: any[] = Array.isArray(assignment.attachments) ? assignment.attachments : [];
  let retainedAttachments: any[] = currentAttachments;

  if (body.existing_attachments !== undefined) {
    let parsedExisting: any[] = [];
    if (typeof body.existing_attachments === "string") {
      try {
        parsedExisting = JSON.parse(body.existing_attachments);
      } catch {
        parsedExisting = [];
      }
    } else if (Array.isArray(body.existing_attachments)) {
      parsedExisting = body.existing_attachments;
    }

    // Identify which current attachments were removed
    const retainedPaths = new Set(parsedExisting.map((item: any) => (typeof item === "string" ? item : item.path || item.name)));
    const removedAttachments = currentAttachments.filter(
      (att) => !retainedPaths.has(att.path) && !retainedPaths.has(att.name)
    );

    if (removedAttachments.length > 0) {
      await removeAssignmentStorageFiles(removedAttachments);
    }

    retainedAttachments = currentAttachments.filter(
      (att) => retainedPaths.has(att.path) || retainedPaths.has(att.name)
    );
  }

  const rawFiles = body.files || body.attachments;
  const validatedFiles = validateAssignmentFiles(rawFiles);
  let newUploadedAttachments: any[] = [];
  if (validatedFiles.length > 0) {
    newUploadedAttachments = await uploadAssignmentFiles(assignment.classId, teacherId, validatedFiles);
  }

  updates.attachments = [...retainedAttachments, ...newUploadedAttachments];

  const updatedDoc = await assignmentsRepo.updateAssignment(assignmentId, updates);
  return await attachSignedUrlsToAssignment(updatedDoc);
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

  if (assignment.attachments && Array.isArray(assignment.attachments)) {
    await removeAssignmentStorageFiles(assignment.attachments);
  }

  await assignmentsRepo.deleteAssignment(assignmentId);
  return { deleted: true };
};

export const getClassAssignments = async (userId: string, userRole: string, classId: string) => {
  if (userRole === "teacher") {
    await assertTeacherOwnsClass(userId, classId);
    const docs = await assignmentsRepo.findAssignmentsByClass(classId);
    return await attachSignedUrlsToAssignment(docs);
  }

  const enrolled = await isStudentEnrolled(userId, classId);
  if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");

  const assignments = await assignmentsRepo.findAssignmentsByClass(classId);
  const submissions = await assignmentsRepo.findStudentSubmissionsForClass(classId, userId);
  const subMap = new Map<string, any>(submissions.map((s: any) => [s.assignmentId, s]));

  const mapped = assignments.map((a: any) => {
    const sub: any = subMap.get(a._id);
    let status = "belum";
    if (sub) {
      if (sub.score !== undefined && sub.score !== null) status = "dinilai";
      else if (sub.isLate) status = "telat";
      else status = "sudah";
    }
    return { ...a, studentStatus: status };
  });

  return await attachSignedUrlsToAssignment(mapped);
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

  return await attachSignedUrlsToAssignment(assignment);
};

/** Ambil semua tugas yang dibuat oleh guru ini (lintas kelas) */
export const getTeacherAssignments = async (teacherId: string) => {
  const docs = await assignmentsRepo.findAssignmentsByTeacher(teacherId);
  return await attachSignedUrlsToAssignment(docs);
};

/** Ambil semua tugas dari kelas-kelas yang diikuti siswa */
export const getStudentAssignments = async (studentId: string, classId?: string) => {
  const studentGroups = await findStudentGroups(studentId);
  const groupIds = studentGroups.map((g: any) => g.id);

  if (classId) {
    const enrolled = await isStudentEnrolled(studentId, classId);
    if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");
    const assignments = await assignmentsRepo.findAssignmentsByClass(classId);
    const submissions = await assignmentsRepo.findStudentSubmissionsForClass(classId, studentId, groupIds);
    const withStatus = attachStudentStatus(assignments, submissions);
    return await attachSignedUrlsToAssignment(withStatus);
  }

  const enrolledClasses = await findClassesByStudent(studentId);
  if (!enrolledClasses || enrolledClasses.length === 0) return [];

  const classIds = enrolledClasses.map((c) => c.id);
  const assignments = await assignmentsRepo.findAssignmentsByClassIds(classIds);
  const submissions = await assignmentsRepo.findStudentAllSubmissions(studentId, groupIds);

  const withStatus = attachStudentStatus(assignments, submissions);
  return await attachSignedUrlsToAssignment(withStatus);
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

