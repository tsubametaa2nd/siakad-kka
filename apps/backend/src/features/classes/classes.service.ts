// Fitur: layanan bisnis kelas & enrollment
import { hashPassword } from "../../shared/auth/password";
import { BadRequest, Forbidden, NotFound } from "../../shared/utils/errors";
import * as authRepo from "../auth/auth.repository";
import * as classesRepo from "./classes.repository";
import type { CreateClassBody } from "./classes.schema";

export const assertTeacherOwnsClass = async (teacherId: string, classId: string) => {
  const cls = await classesRepo.findClassById(classId);
  if (!cls) {
    throw NotFound("Kelas tidak ditemukan");
  }

  const isOwner = await classesRepo.isTeacherOfClass(teacherId, classId);
  if (!isOwner) {
    throw Forbidden("Anda tidak memiliki akses ke kelas ini");
  }

  return cls;
};

export const createClass = async (teacherId: string, body: CreateClassBody) => {
  const newClass = await classesRepo.createClass({
    ...body,
    homeroomTeacherId: teacherId,
  });
  await classesRepo.addTeachingAssignment(newClass.id, teacherId);
  return newClass;
};

import { extractSpreadsheetId } from "../grading/grading.sheets";

export const updateClass = async (teacherId: string, classId: string, body: Partial<CreateClassBody>) => {
  await assertTeacherOwnsClass(teacherId, classId);
  return await classesRepo.updateClass(classId, {
    name: body.name,
    gradeLevel: body.gradeLevel,
    academicYear: body.academicYear,
    spreadsheetId: body.spreadsheetId !== undefined ? (extractSpreadsheetId(body.spreadsheetId) || null) : undefined,
    scheduleDay: body.scheduleDay !== undefined ? (body.scheduleDay ? body.scheduleDay.trim() : null) : undefined,
    scheduleTime: body.scheduleTime !== undefined ? (body.scheduleTime ? body.scheduleTime.trim() : null) : undefined,
    room: body.room !== undefined ? (body.room ? body.room.trim() : null) : undefined,
  });
};


export const getTeacherClasses = async (teacherId: string) => {
  return await classesRepo.findClassesByTeacher(teacherId);
};

export const getClassStudents = async (userId: string, userRole: string, classId: string) => {
  if (userRole === "teacher") {
    await assertTeacherOwnsClass(userId, classId);
  } else {
    const enrolled = await classesRepo.isStudentEnrolled(userId, classId);
    if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");
  }
  return await classesRepo.findClassStudents(classId);
};

export const enrollStudents = async (teacherId: string, classId: string, studentIds: string[]) => {
  await assertTeacherOwnsClass(teacherId, classId);

  const uniqueIds = Array.from(new Set(studentIds));
  if (uniqueIds.length === 0) {
    return { enrolled: 0 };
  }

  const profiles = await classesRepo.findProfilesByIds(uniqueIds);

  if (profiles.length !== uniqueIds.length) {
    throw BadRequest("Beberapa ID siswa tidak ditemukan");
  }

  const hasNonStudent = profiles.some((p) => p.role !== "student");
  if (hasNonStudent) {
    throw BadRequest("Hanya akun dengan role siswa yang dapat didaftarkan ke kelas");
  }

  await classesRepo.upsertEnrollments(classId, uniqueIds);
  return { enrolled: uniqueIds.length };
};

export const getStudentClasses = async (studentId: string) => {
  return await classesRepo.findClassesByStudent(studentId);
};

export const getClassById = async (userId: string, classId: string) => {
  const cls = await classesRepo.findClassById(classId);
  if (!cls) {
    throw NotFound("Kelas tidak ditemukan");
  }
  return cls;
};

// Import Spreadsheet

export const importFromSpreadsheet = async (teacherId: string, classId: string, spreadsheetUrl: string) => {
  await assertTeacherOwnsClass(teacherId, classId);

  // Extract spreadsheet ID dari URL
  const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw BadRequest("URL Google Sheets tidak valid. Pastikan URL mengandung ID spreadsheet.");
  }
  const spreadsheetId = match[1];

  // Ambil data CSV dari Google Sheets (export CSV)
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
  let csvText: string;
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    csvText = await response.text();
  } catch (err: any) {
    throw BadRequest(`Gagal mengakses spreadsheet. Pastikan spreadsheet dibagikan ke publik (Anyone with the link). Error: ${err.message}`);
  }

  // Parse CSV
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  // Baris ke-3 (index 2) adalah header, baris ke-4 (index 3) dst adalah data
  if (lines.length < 4) {
    throw BadRequest("Spreadsheet kosong atau format tidak sesuai. Header harus ada di baris ke-3 dan data mulai baris ke-4.");
  }

  const dataLines = lines.slice(3); // Skip baris 1, 2, dan header (baris 3)

  const results: { created: string[]; skipped: string[]; failed: { nis: string; reason: string }[] } = {
    created: [],
    skipped: [],
    failed: [],
  };
  const newStudentIds: string[] = [];

  for (const line of dataLines) {
    // Simple CSV parse (handle quoted fields)
    const cols = parseCSVLine(line);
    const nis = cols[0]?.trim();
    const nama = cols[1]?.trim();
    const password = cols[3]?.trim() || String(nis);

    if (!nis || !nama) {
      continue; // Skip baris kosong
    }

    // Cek apakah NIS sudah terdaftar
    const existing = await authRepo.findProfileByIdentifier(nis);
    if (existing) {
      // Siswa sudah ada, langsung enroll saja
      results.skipped.push(`${nama} (${nis}) - akun sudah ada, langsung didaftarkan`);
      newStudentIds.push(existing.id);
      continue;
    }

    try {
      const profile = await authRepo.createProfile(nama, "student", nis);
      const passwordHash = await hashPassword(password);
      await authRepo.createCredentials(profile.id, nis, passwordHash);
      newStudentIds.push(profile.id);
      results.created.push(`${nama} (${nis})`);
    } catch (err: any) {
      results.failed.push({ nis, reason: err.message || "Gagal membuat akun" });
    }
  }

  // Enroll semua siswa ke kelas
  if (newStudentIds.length > 0) {
    await classesRepo.upsertEnrollments(classId, newStudentIds);
  }

  return {
    total: dataLines.length,
    created: results.created.length,
    skipped: results.skipped.length,
    failed: results.failed.length,
    enrolled: newStudentIds.length,
    details: results,
  };
};

// Helper: parse satu baris CSV dengan dukungan quoted fields
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
};

export const assignTeacherToClass = async (requestingTeacherId: string, classId: string, targetTeacherId: string) => {
  await assertTeacherOwnsClass(requestingTeacherId, classId);

  const teacherProfiles = await classesRepo.findProfilesByIds([targetTeacherId]);
  if (!teacherProfiles || teacherProfiles.length === 0 || teacherProfiles[0].role !== "teacher") {
    throw BadRequest("Akun guru tidak ditemukan atau bukan role guru");
  }

  await classesRepo.addTeachingAssignment(classId, targetTeacherId);
  return { assigned: true, classId, teacherId: targetTeacherId };
};

export const getClassTeachers = async (classId: string) => {
  const cls = await classesRepo.findClassById(classId);
  if (!cls) throw NotFound("Kelas tidak ditemukan");
  return await classesRepo.findClassTeachers(classId);
};
