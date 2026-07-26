// Fitur: layanan bisnis pengumpulan tugas
import { isStudentEnrolled, findClassStudents } from "../classes/classes.repository";
import { assertTeacherOwnsClass } from "../classes/classes.service";
import { findAssignmentById } from "../assignments/assignments.repository";
import { findStudentGroups } from "../groups/groups.repository";
import { BadRequest, Conflict, Forbidden, NotFound } from "../../shared/utils/errors";
import * as filesHelper from "./submissions.files";
import * as subRepo from "./submissions.repository";
import type { SubmitBody, UpdateSubmissionBody } from "./submissions.schema";

export const submitAssignment = async (studentId: string, body: SubmitBody) => {
  const targetAssignmentId = body.assignmentId || (body as any).assignment_id;
  if (!targetAssignmentId) throw BadRequest("assignmentId wajib diisi");

  const assignment = await findAssignmentById(targetAssignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");

  const enrolled = await isStudentEnrolled(studentId, assignment.classId);
  if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");

  let groupId: string | undefined;
  if (assignment.type === "group") {
    const studentGroups = await findStudentGroups(studentId);
    const classGroup = studentGroups.find((g: any) => g.class_id === assignment.classId);
    if (!classGroup) throw BadRequest("Tugas kelompok harus dikumpulkan melalui kelompok");
    groupId = classGroup.id;
  }

  const assignmentIdStr = String(assignment._id);
  const isIndividualGroupMode = assignment.type === "group" && assignment.groupSubmissionMode === "individual";
  const checkGroupId = isIndividualGroupMode ? undefined : groupId;

  const existing = await subRepo.findActiveSubmission(assignmentIdStr, studentId, checkGroupId);
  if (existing) {
    if (!isIndividualGroupMode && groupId && existing.groupId === groupId) {
      throw Conflict("Kelompokmu sudah mengumpulkan tugas ini via perwakilan", "ALREADY_SUBMITTED");
    }
    throw Conflict("Kamu sudah mengumpulkan tugas ini", "ALREADY_SUBMITTED");
  }

  const links = filesHelper.validateAndParseLinks(body.links);
  const files = filesHelper.validateFiles(body.files);
  if (links.length === 0 && files.length === 0) throw BadRequest("Minimal harus mengumpulkan satu file atau satu link");

  const uploadedFiles = await filesHelper.uploadSubmissionFiles(assignment.classId, assignmentIdStr, studentId, files);
  const status = new Date().getTime() > new Date(assignment.deadline).getTime() ? "late" : "submitted";

  const sub = await subRepo.createSubmission({
    assignmentId: assignmentIdStr,
    classId: assignment.classId,
    studentId,
    groupId,
    files: uploadedFiles,
    links,
    status,
  });

  return await filesHelper.attachSignedUrls(sub);
};

export const updateSubmission = async (studentId: string, submissionId: string, body: UpdateSubmissionBody) => {
  const sub = await subRepo.findSubmissionById(submissionId);
  if (!sub || sub.isDeleted) throw NotFound("Pengumpulan tidak ditemukan");
  if (sub.studentId !== studentId) throw Forbidden("Anda tidak memiliki hak akses ke pengumpulan ini");
  if (sub.status === "graded" || sub.score !== undefined) throw Conflict("Pengumpulan yang sudah dinilai tidak dapat diubah", "ALREADY_GRADED");
  if (Number(body.version) !== sub.version) throw Conflict("Data sudah berubah, silakan muat ulang halaman", "VERSION_MISMATCH");

  const links = filesHelper.validateAndParseLinks(body.links);
  const files = filesHelper.validateFiles(body.files);
  if (links.length === 0 && files.length === 0) throw BadRequest("Minimal harus mengumpulkan satu file atau satu link");

  await filesHelper.removeStorageFiles(sub.files);
  const newUploadedFiles = await filesHelper.uploadSubmissionFiles(sub.classId, sub.assignmentId, studentId, files);

  const updated = await subRepo.updateSubmissionWithVersion(submissionId, sub.version, { files: newUploadedFiles, links });
  if (!updated) throw Conflict("Data sudah berubah, silakan muat ulang halaman", "VERSION_MISMATCH");

  return await filesHelper.attachSignedUrls(updated);
};

export const deleteSubmission = async (studentId: string, submissionId: string) => {
  const sub = await subRepo.findSubmissionById(submissionId);
  if (!sub || sub.isDeleted) throw NotFound("Pengumpulan tidak ditemukan");
  if (sub.studentId !== studentId) throw Forbidden("Anda tidak memiliki hak akses ke pengumpulan ini");
  if (sub.status === "graded" || sub.score !== undefined) throw Conflict("Pengumpulan yang sudah dinilai tidak dapat dihapus", "ALREADY_GRADED");

  await filesHelper.removeStorageFiles(sub.files);
  await subRepo.softDeleteSubmission(submissionId);
  return { deleted: true };
};

export const getStudentSubmission = async (studentId: string, assignmentId: string) => {
  const assignment = await findAssignmentById(assignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");

  const sub = await subRepo.findActiveSubmission(assignmentId, studentId);
  if (!sub) return null;
  return await filesHelper.attachSignedUrls(sub);
};

export const getTeacherSubmissions = async (teacherId: string, assignmentId: string) => {
  const assignment = await findAssignmentById(assignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");

  await assertTeacherOwnsClass(teacherId, assignment.classId);
  const classStudents = await findClassStudents(assignment.classId);
  const studentMap = new Map(classStudents.map((s: any) => [s.id, s]));

  const submissions = await subRepo.findActiveSubmissionsByAssignment(assignmentId);
  const submissionsWithUrls = await Promise.all(submissions.map((s: any) => filesHelper.attachSignedUrls(s)));

  const submissionRows = submissionsWithUrls.map((s: any) => {
    const student = studentMap.get(s.studentId);
    let statusLabel: "Sudah" | "Telat" | "Dinilai" = "Sudah";
    if (s.score !== undefined && s.score !== null) statusLabel = "Dinilai";
    else if (s.status === "late") statusLabel = "Telat";

    return {
      id: s._id || s.id,
      student_id: s.studentId,
      student_name: student?.name || student?.full_name || "Siswa",
      identifier: student?.identifier || "",
      status: statusLabel,
      submitted_at: s.createdAt || s.submittedAt || new Date().toISOString(),
      files: (s.files || []).map((f: any) => ({
        name: f.name,
        size: f.size,
        url: f.url || f.signedUrl,
      })),
      links: s.links || [],
      score: s.score,
      feedback: s.feedback,
    };
  });

  return {
    total_students: classStudents.length,
    submitted_count: submissionRows.length,
    submissions: submissionRows,
  };
};
