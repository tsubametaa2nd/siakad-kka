// Fitur: layanan bisnis kelompok
import { BadRequest, Conflict, Forbidden, NotFound } from "../../shared/utils/errors";
import * as groupsRepo from "./groups.repository";
import type { CreateGroupBody, JoinGroupBody, LeaveGroupBody } from "./groups.schema";

const handleUniqueConstraintError = (error: any) => {
  const msg = (error?.message || "").toLowerCase();
  if (error?.code === "23505" || msg.includes("23505") || msg.includes("unique") || msg.includes("duplicate")) {
    throw Conflict("Kamu sudah memiliki kelompok di kelas ini. Keluar dari kelompok saat ini terlebih dahulu jika ingin pindah.", "GROUP_CONFLICT");
  }
  throw error;
};

export const createGroup = async (studentId: string, body: CreateGroupBody) => {
  const classId = body.classId || (body as any).class_id;
  const maxMembers = body.maxMembers ?? (body as any).max_members ?? 5;
  if (!classId) throw BadRequest("classId wajib diisi");

  const isEnrolled = await groupsRepo.isStudentEnrolled(studentId, classId);
  if (!isEnrolled) {
    throw Forbidden("Kamu belum terdaftar di kelas ini");
  }

  // Pre-check: pastikan siswa belum memiliki kelompok di kelas ini
  const existingGroups = await groupsRepo.findStudentGroups(studentId);
  const alreadyInGroup = existingGroups.some((g: any) => g.class_id === classId);
  if (alreadyInGroup) {
    throw Conflict("Kamu sudah memiliki kelompok di kelas ini. Keluar dari kelompok saat ini terlebih dahulu.", "GROUP_CONFLICT");
  }

  const group = await groupsRepo.createGroup(body.name, classId, studentId, Number(maxMembers));

  try {
    await groupsRepo.addMember(group.id, studentId, classId);
  } catch (error) {
    await groupsRepo.deleteGroup(group.id);
    handleUniqueConstraintError(error);
  }

  return group;
};

export const joinGroup = async (studentId: string, body: JoinGroupBody) => {
  const groupId = body.groupId || (body as any).group_id;
  if (!groupId) throw BadRequest("groupId wajib diisi");

  const group = await groupsRepo.findGroupById(groupId);
  if (!group) {
    throw NotFound("Kelompok tidak ditemukan");
  }

  const classId = body.classId || (body as any).class_id || group.class_id;

  const isEnrolled = await groupsRepo.isStudentEnrolled(studentId, classId);
  if (!isEnrolled) {
    throw Forbidden("Kamu belum terdaftar di kelas ini");
  }

  if (group.class_id !== classId) {
    throw BadRequest("Kelompok tidak berada di kelas ini");
  }

  // Pre-check: pastikan siswa belum memiliki kelompok di kelas ini
  const existingGroups = await groupsRepo.findStudentGroups(studentId);
  const alreadyInGroup = existingGroups.some((g: any) => g.class_id === classId);
  if (alreadyInGroup) {
    throw Conflict("Kamu sudah memiliki kelompok di kelas ini. Keluar dari kelompok saat ini terlebih dahulu.", "GROUP_CONFLICT");
  }

  const currentCount = await groupsRepo.countMembers(groupId);
  if (currentCount >= group.max_members) {
    throw Conflict("Kelompok sudah penuh", "GROUP_FULL");
  }

  try {
    await groupsRepo.addMember(groupId, studentId, classId);
  } catch (error) {
    handleUniqueConstraintError(error);
  }

  return { joined: true, groupId: group.id };
};

export const leaveGroup = async (studentId: string, body: LeaveGroupBody) => {
  const groupId = body.groupId || (body as any).group_id;
  if (!groupId) throw BadRequest("groupId wajib diisi");

  const group = await groupsRepo.findGroupById(groupId);
  if (!group) {
    throw NotFound("Kelompok tidak ditemukan");
  }

  await groupsRepo.removeMember(groupId, studentId);
  const remaining = await groupsRepo.findRemainingMembers(groupId);

  if (remaining.length === 0) {
    await groupsRepo.deleteGroup(groupId);
  } else if (group.leader_id === studentId) {
    await groupsRepo.updateGroupLeader(groupId, remaining[0].student_id);
  }

  return { left: true };
};

export const inviteStudent = async (leaderId: string, body: any) => {
  const groupId = body.groupId || body.group_id;
  const targetStudentId = body.studentId || body.student_id;
  if (!groupId || !targetStudentId) {
    throw BadRequest("groupId dan studentId wajib diisi");
  }

  const group = await groupsRepo.findGroupById(groupId);
  if (!group) throw NotFound("Kelompok tidak ditemukan");

  if (group.leader_id !== leaderId) {
    throw Forbidden("Hanya ketua kelompok yang dapat mengundang anggota secara langsung");
  }

  const currentCount = await groupsRepo.countMembers(groupId);
  if (currentCount >= group.max_members) {
    throw Conflict("Kelompok sudah penuh", "GROUP_FULL");
  }

  const isEnrolled = await groupsRepo.isStudentEnrolled(targetStudentId, group.class_id);
  if (!isEnrolled) {
    throw BadRequest("Siswa yang diundang tidak terdaftar di kelas ini");
  }

  try {
    await groupsRepo.addMember(groupId, targetStudentId, group.class_id);
  } catch (error) {
    handleUniqueConstraintError(error);
  }

  return { invited: true, groupId: group.id, studentId: targetStudentId };
};

export const getClassGroups = async (classId: string) => {
  return await groupsRepo.findGroupsByClass(classId);
};

export const getStudentGroups = async (studentId: string) => {
  return await groupsRepo.findStudentGroups(studentId);
};
