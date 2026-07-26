// Fitur: layanan bisnis penilaian
import { findAssignmentById, findAssignmentsByClass } from "../assignments/assignments.repository";
import { findClassById, findClassesByTeacher, findProfilesByIds, findClassStudents } from "../classes/classes.repository";
import { assertTeacherOwnsClass } from "../classes/classes.service";
import { findRemainingMembers, findStudentGroups } from "../groups/groups.repository";
import { findActiveSubmissionsByAssignment } from "../submissions/submissions.repository";
import { BadRequest, NotFound } from "../../shared/utils/errors";
import * as gradingRepo from "./grading.repository";
import { syncGradeToSheet } from "./grading.sheets";
import { env } from "../../config/env";
import type { BulkGradeBody, GradeBody } from "./grading.schema";

const processSingleStudentGrade = async (
  teacherId: string,
  assignment: any,
  cls: any,
  studentId: string,
  score: number,
  feedback = ""
) => {
  let syncedToSheet = false;
  let syncError: string | undefined;

  const [studentProfile] = await findProfilesByIds([studentId]);
  if (!studentProfile) throw NotFound(`Siswa dengan ID ${studentId} tidak ditemukan`);

  if (cls?.spreadsheet_id) {
    try {
      await syncGradeToSheet(cls.spreadsheet_id, studentProfile.identifier, studentProfile.full_name, assignment.title, score);
      syncedToSheet = true;
    } catch (e: any) {
      syncedToSheet = false;
      syncError = e.message || "Gagal sinkron ke Google Sheets";
    }
  }

  const grade = await gradingRepo.saveGrade({
    assignmentId: assignment._id,
    classId: assignment.classId,
    studentId,
    score,
    feedback,
    gradedBy: teacherId,
    syncedToSheet,
    syncError,
  });

  await gradingRepo.markSubmissionGraded(assignment._id, studentId, score);
  return grade;
};

export const gradeStudent = async (teacherId: string, body: GradeBody) => {
  const targetAssignmentId = body.assignmentId || (body as any).assignment_id;
  const targetStudentId = body.studentId || (body as any).student_id;
  if (!targetAssignmentId || !targetStudentId) {
    throw BadRequest("assignmentId dan studentId wajib diisi");
  }

  const assignment = await findAssignmentById(targetAssignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");
  await assertTeacherOwnsClass(teacherId, assignment.classId);

  const numScore = Number(body.score);
  if (numScore < 0 || numScore > assignment.maxScore) {
    throw BadRequest(`Skor harus berada dalam rentang 0 sampai ${assignment.maxScore}`);
  }

  const cls = await findClassById(assignment.classId);
  let studentIds = [targetStudentId];

  const isRepresentativeGroup = assignment.type === "group" && assignment.groupSubmissionMode !== "individual";
  if (isRepresentativeGroup) {
    const studentGroups = await findStudentGroups(targetStudentId);
    const classGroup = studentGroups.find((g: any) => g.class_id === assignment.classId);
    if (classGroup) {
      const members = await findRemainingMembers(classGroup.id);
      studentIds = members.map((m: any) => m.student_id);
    }
  }

  const results = [];
  for (const sid of studentIds) {
    const res = await processSingleStudentGrade(teacherId, assignment, cls, sid, numScore, body.feedback || "");
    results.push(res);
  }

  return results.length === 1 ? results[0] : results;
};

export const bulkGrade = async (teacherId: string, body: BulkGradeBody) => {
  const assignment = await findAssignmentById(body.assignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");
  await assertTeacherOwnsClass(teacherId, assignment.classId);

  const cls = await findClassById(assignment.classId);
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const item of body.grades) {
    try {
      const numScore = Number(item.score);
      if (numScore < 0 || numScore > assignment.maxScore) {
        throw BadRequest(`Skor siswa ${item.studentId} tidak valid`);
      }
      const grade = await processSingleStudentGrade(teacherId, assignment, cls, item.studentId, numScore, item.feedback || "");
      results.push({ studentId: item.studentId, success: true, grade });
      successCount++;
    } catch (e: any) {
      results.push({ studentId: item.studentId, success: false, error: e.message });
      failCount++;
    }
    await new Promise((r) => setTimeout(r, 100)); // jeda 100ms cegah rate limit API
  }

  return { successCount, failCount, results };
};

export const getAssignmentGrades = async (teacherId: string, assignmentId: string) => {
  const assignment = await findAssignmentById(assignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");
  await assertTeacherOwnsClass(teacherId, assignment.classId);

  return await gradingRepo.findGradesByAssignment(assignmentId);
};

// Menggabungkan: data tugas + profil siswa di kelas + pengumpulan + nilai.
export const getAssignmentGrading = async (teacherId: string, assignmentId: string) => {
  const assignment = await findAssignmentById(assignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");
  await assertTeacherOwnsClass(teacherId, assignment.classId);

  const cls = await findClassById(assignment.classId);
  const classStudents = await findClassStudents(assignment.classId);
  const submissions = await findActiveSubmissionsByAssignment(assignmentId);
  const grades = await gradingRepo.findGradesByAssignment(String(assignment._id));

  // Map studentId → grade untuk lookup cepat
  const gradeMap = new Map(grades.map((g: any) => [g.studentId, g]));
  // Map studentId → submission
  const submissionMap = new Map(submissions.map((s: any) => [s.studentId, s]));

  const submissionRows = await Promise.all(classStudents.map(async (student: any) => {
    const sub = submissionMap.get(student.id);
    const grade = gradeMap.get(student.id);

    let files: any[] = [];
    if (sub?.files && sub.files.length > 0) {
      // Lampirkan signed URL untuk setiap file
      const { attachSignedUrls } = await import("../submissions/submissions.files");
      const subWithUrls = await attachSignedUrls(sub);
      files = (subWithUrls.files || []).map((f: any) => ({
        name: f.name,
        size: f.size,
        url: f.url || f.signedUrl || "",
      }));
    }

    let status: "Belum" | "Sudah" | "Telat" | "Dinilai" = "Belum";
    if (grade) {
      status = "Dinilai";
    } else if (sub) {
      status = sub.status === "late" ? "Telat" : "Sudah";
    }

    return {
      submission_id: sub?._id || sub?.id,
      student_id: student.id,
      student_name: student.full_name || student.name || "Siswa",
      identifier: student.identifier || "",
      status,
      submitted_at: sub?.submittedAt || sub?.createdAt,
      files,
      links: sub?.links || [],
      score: grade?.score !== undefined ? grade.score : (sub?.score !== undefined ? sub.score : null),
      feedback: grade?.feedback || null,
      syncedToSheet: grade?.syncedToSheet || false,
      graded_at: grade?.gradedAt,
    };
  }));

  return {
    assignment: {
      id: String(assignment._id),
      title: assignment.title,
      max_score: assignment.maxScore || 100,
      type: assignment.type || "individual",
      class_id: assignment.classId,
      class_name: cls?.name || "",
    },
    submissions: submissionRows,
  };
};

export const getStudentMyGrades = async (studentId: string) => {
  return await gradingRepo.findStudentGrades(studentId);
};

export const retryClassSync = async (teacherId: string, classId: string) => {
  await assertTeacherOwnsClass(teacherId, classId);
  const cls = await findClassById(classId);
  if (!cls?.spreadsheet_id) throw BadRequest("Kelas ini tidak memiliki Google Spreadsheet ID");

  const unsyncedGrades = await gradingRepo.findUnsyncedGradesByClass(classId);
  let syncedCount = 0;
  let lastError = "";

  for (const grade of unsyncedGrades) {
    const assignment = await findAssignmentById(grade.assignmentId);
    if (!assignment) continue;

    const [profile] = await findProfilesByIds([grade.studentId]);
    if (!profile) continue;

    try {
      await syncGradeToSheet(cls.spreadsheet_id, profile.identifier || "", profile.full_name || "Siswa", assignment.title, grade.score);
      await gradingRepo.saveGrade({ ...grade, syncedToSheet: true, syncError: undefined });
      syncedCount++;
    } catch (e: any) {
      console.error(`[Google Sheets Sync Error]:`, e);
      lastError = e.message || "Gagal terhubung ke Google Sheets API";
      await gradingRepo.saveGrade({ ...grade, syncedToSheet: false, syncError: lastError });
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  if (syncedCount === 0 && unsyncedGrades.length > 0) {
    throw BadRequest(
      lastError
        ? `Gagal sinkron ke Google Sheets: ${lastError}`
        : `Gagal menyinkronkan nilai. Pastikan ID Spreadsheet valid dan sudah di-share sebagai Editor ke Email Service Account (${env.GOOGLE_SA_EMAIL || 'Service Account'}).`
    );
  }

  return { total: unsyncedGrades.length, syncedCount };
};

// Ringkasan penilaian
export const getTeacherGradingSummary = async (teacherId: string) => {
  const classes = await findClassesByTeacher(teacherId);
  if (!classes || classes.length === 0) return [];

  const summaries = await Promise.all(
    classes.map(async (cls) => {
      const classId = cls.id;
      const [assignments, ungradedCount, pendingSyncCount] = await Promise.all([
        findAssignmentsByClass(classId),
        gradingRepo.countUngradedSubmissionsByClass(classId),
        gradingRepo.countUnsyncedGradesByClass(classId),
      ]);

      return {
        class_id: classId,
        class_name: cls.name,
        spreadsheet_id: cls.spreadsheet_id || undefined,
        total_assignments: assignments.length,
        ungraded_submissions: ungradedCount,
        pending_sync_count: pendingSyncCount,
      };
    })
  );

  return summaries;
};
