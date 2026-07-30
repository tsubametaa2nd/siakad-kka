// Fitur: layanan bisnis pengumpulan tugas
import { isStudentEnrolled, findClassStudents } from "../classes/classes.repository";
import { assertTeacherOwnsClass } from "../classes/classes.service";
import { findAssignmentById } from "../assignments/assignments.repository";
import { findStudentGroups } from "../groups/groups.repository";
import { findProfileById } from "../auth/auth.repository";
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
    groupId = (classGroup as any).id;
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

  const rawContent = body.content || body.text;
  const content = typeof rawContent === "string" ? rawContent.trim() : undefined;

  const links = filesHelper.validateAndParseLinks(body.links);
  const files = filesHelper.validateFiles(body.files);
  if (links.length === 0 && files.length === 0 && (!content || content.length === 0)) {
    throw BadRequest("Minimal harus mengumpulkan satu file, satu link, atau menuliskan teks jawaban");
  }

  const uploadedFiles = await filesHelper.uploadSubmissionFiles(assignment.classId, assignmentIdStr, studentId, files);
  const status = new Date().getTime() > new Date(assignment.deadline).getTime() ? "late" : "submitted";

  const sub = await subRepo.createSubmission({
    assignmentId: assignmentIdStr,
    classId: assignment.classId,
    studentId,
    groupId,
    content: content || undefined,
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

  const rawContent = body.content || body.text;
  const content = typeof rawContent === "string" ? rawContent.trim() : undefined;

  const links = filesHelper.validateAndParseLinks(body.links);
  const files = filesHelper.validateFiles(body.files);
  if (links.length === 0 && files.length === 0 && (!content || content.length === 0)) {
    throw BadRequest("Minimal harus mengumpulkan satu file, satu link, atau menuliskan teks jawaban");
  }

  await filesHelper.removeStorageFiles(sub.files);
  const newUploadedFiles = await filesHelper.uploadSubmissionFiles(sub.classId, sub.assignmentId, studentId, files);

  const updated = await subRepo.updateSubmissionWithVersion(submissionId, sub.version, {
    files: newUploadedFiles,
    links,
    content: content !== undefined ? content : sub.content,
  });
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

  let groupId: string | undefined;
  if (assignment.type === "group" && assignment.groupSubmissionMode !== "individual") {
    const studentGroups = await findStudentGroups(studentId);
    const classGroup = studentGroups.find((g: any) => g.class_id === assignment.classId);
    if (classGroup) groupId = (classGroup as any).id;
  }

  const sub = await subRepo.findActiveSubmission(assignmentId, studentId, groupId);
  if (!sub) return null;

  const attached = await filesHelper.attachSignedUrls(sub);
  if (assignment.type === "group" && assignment.groupSubmissionMode !== "individual") {
    const isLeader = sub.studentId === studentId;
    let submitterName: string | undefined;
    if (!isLeader) {
      const studentDoc = await findProfileById(sub.studentId);
      submitterName = studentDoc?.full_name;
    }
    return {
      ...attached,
      isGroupLeader: isLeader,
      submittedByName: submitterName,
    };
  }
  return attached;
};

export const getTeacherSubmissions = async (teacherId: string, assignmentId: string) => {
  const assignment = await findAssignmentById(assignmentId);
  if (!assignment) throw NotFound("Tugas tidak ditemukan");

  await assertTeacherOwnsClass(teacherId, assignment.classId);
  const classStudents = await findClassStudents(assignment.classId);

  const submissions = await subRepo.findActiveSubmissionsByAssignment(assignmentId, 1000);
  const submissionsWithUrls = await Promise.all(submissions.map((s: any) => filesHelper.attachSignedUrls(s)));
  const subMap = new Map<string, any>(submissionsWithUrls.map((s: any) => [s.studentId, s]));
  const groupSubMap = new Map<string, any>();
  submissionsWithUrls.forEach((s: any) => {
    if (s.groupId) groupSubMap.set(s.groupId, s);
  });

  if (assignment.type === "group") {
    const { findGroupsByClass } = await import("../groups/groups.repository");
    const classGroups = await findGroupsByClass(assignment.classId);

    const groupedStudentIds = new Set<string>();
    let submittedCount = 0;

    const submissionRows = classGroups.map((g: any) => {
      let sub: any = groupSubMap.get(g.id);

      const memberDetails = (g.members || []).map((m: any) => {
        groupedStudentIds.add(m.student_id);
        if (!sub) {
          const mSub = subMap.get(m.student_id);
          if (mSub) sub = mSub;
        }
        return {
          student_id: m.student_id,
          name: m.name,
          identifier: m.identifier || "",
          is_leader: m.student_id === g.leader_id,
        };
      });

      let statusLabel: "Sudah" | "Telat" | "Dinilai" | "Belum" = "Belum";
      if (sub) {
        submittedCount++;
        if (sub.score !== undefined && sub.score !== null) statusLabel = "Dinilai";
        else if (sub.status === "late") statusLabel = "Telat";
        else statusLabel = "Sudah";
      }

      const repStudentId = g.leader_id || (g.members && g.members[0]?.student_id) || `group-${g.id}`;

      return {
        id: sub?._id || sub?.id || `unsubmitted-${g.id}`,
        student_id: repStudentId,
        student_name: g.name,
        group_id: g.id,
        group_name: g.name,
        group_members: memberDetails,
        identifier: `${memberDetails.length} Anggota`,
        status: statusLabel,
        submitted_at: sub ? (sub.createdAt || sub.submittedAt || new Date().toISOString()) : null,
        files: sub
          ? (sub.files || []).map((f: any) => ({
              name: f.name,
              size: f.size,
              url: f.url || f.signedUrl,
            }))
          : [],
        links: sub?.links || [],
        content: sub?.content || sub?.text || null,
        score: sub?.score,
        feedback: sub?.feedback,
      };
    });

    const unassignedStudents = classStudents.filter((st: any) => !groupedStudentIds.has(st.id));
    for (const st of unassignedStudents) {
      const s = subMap.get(st.id);
      let statusLabel: "Sudah" | "Telat" | "Dinilai" | "Belum" = "Belum";
      if (s) {
        submittedCount++;
        if (s.score !== undefined && s.score !== null) statusLabel = "Dinilai";
        else if (s.status === "late") statusLabel = "Telat";
        else statusLabel = "Sudah";
      }

      submissionRows.push({
        id: s?._id || s?.id || `unsubmitted-${st.id}`,
        student_id: st.id,
        student_name: `${st?.name || st?.full_name || "Siswa"} (Belum Berkelompok)`,
        group_id: undefined,
        group_name: undefined,
        group_members: [{ student_id: st.id, name: st?.name || st?.full_name || "Siswa", identifier: st?.identifier || "", is_leader: true }],
        identifier: st?.identifier || "",
        status: statusLabel,
        submitted_at: s ? (s.createdAt || s.submittedAt || new Date().toISOString()) : null,
        files: s
          ? (s.files || []).map((f: any) => ({
              name: f.name,
              size: f.size,
              url: f.url || f.signedUrl,
            }))
          : [],
        links: s?.links || [],
        content: s?.content || s?.text || null,
        score: s?.score,
        feedback: s?.feedback,
      });
    }

    return {
      total_students: classStudents.length,
      total_groups: submissionRows.length,
      submitted_count: submittedCount,
      submissions: submissionRows,
    };
  }

  let submittedCount = 0;

  const submissionRows = classStudents.map((student: any) => {
    const s: any = subMap.get(student.id);
    let statusLabel: "Sudah" | "Telat" | "Dinilai" | "Belum" = "Belum";

    if (s) {
      submittedCount++;
      if (s.score !== undefined && s.score !== null) statusLabel = "Dinilai";
      else if (s.status === "late") statusLabel = "Telat";
      else statusLabel = "Sudah";
    }

    return {
      id: s?._id || s?.id || `unsubmitted-${student.id}`,
      student_id: student.id,
      student_name: student?.name || student?.full_name || "Siswa",
      identifier: student?.identifier || "",
      status: statusLabel,
      submitted_at: s ? (s.createdAt || s.submittedAt || new Date().toISOString()) : null,
      files: s
        ? (s.files || []).map((f: any) => ({
            name: f.name,
            size: f.size,
            url: f.url || f.signedUrl,
          }))
        : [],
      links: s?.links || [],
      content: s?.content || s?.text || null,
      score: s?.score,
      feedback: s?.feedback,
    };
  });

  return {
    total_students: classStudents.length,
    submitted_count: submittedCount,
    submissions: submissionRows,
  };
};
