// Fitur: layanan bisnis autentikasi
import { hashPassword, verifyPassword } from "../../shared/auth/password";
import { signToken } from "../../shared/auth/jwt";
import type { Role } from "../../shared/types";
import { Conflict, NotFound, Unauthorized } from "../../shared/utils/errors";
import * as authRepo from "./auth.repository";
import type { CreateAccountBody, LoginBody } from "./auth.schema";

export const login = async (body: LoginBody) => {
  const targetUsername = body.username || body.identifier;
  if (!targetUsername) {
    throw Unauthorized("NIS/NIP wajib diisi", "LOGIN_FAILED");
  }

  const credential = await authRepo.findCredentialByUsername(targetUsername);
  if (!credential || !credential.profiles) {
    throw Unauthorized("NIS/NIP atau password salah", "LOGIN_FAILED");
  }

  const isValidPassword = await verifyPassword(body.password, credential.password_hash);
  if (!isValidPassword) {
    throw Unauthorized("NIS/NIP atau password salah", "LOGIN_FAILED");
  }

  const profile = Array.isArray(credential.profiles) ? credential.profiles[0] : credential.profiles;
  const token = await signToken({ id: profile.id, role: profile.role as Role, name: profile.full_name });

  return {
    token,
    user: { id: profile.id, name: profile.full_name, role: profile.role as Role, identifier: profile.identifier },
  };
};

export const createAccount = async (body: CreateAccountBody) => {
  const existingProfile = await authRepo.findProfileByIdentifier(body.username);
  if (existingProfile) {
    throw Conflict("NIS/NIP sudah terdaftar", "IDENTIFIER_CONFLICT");
  }

  const profile = await authRepo.createProfile(body.fullName, body.role, body.username);

  try {
    const passwordHash = await hashPassword(body.password);
    await authRepo.createCredentials(profile.id, body.username, passwordHash);
  } catch (error) {
    await authRepo.deleteProfile(profile.id);
    throw error;
  }

  return { id: profile.id, username: body.username, role: profile.role as Role };
};

export const getProfile = async (userId: string) => {
  const profile = await authRepo.findProfileById(userId);
  if (!profile) {
    throw NotFound("Profil tidak ditemukan");
  }

  return { id: profile.id, fullName: profile.full_name, role: profile.role as Role, identifier: profile.identifier };
};

export const updateProfile = async (userId: string, fullName: string) => {
  const profile = await authRepo.updateProfileName(userId, fullName);
  if (!profile) {
    throw NotFound("Profil tidak ditemukan");
  }
  return { id: profile.id, name: profile.full_name, role: profile.role as Role, identifier: profile.identifier };
};

export const getAllStudents = async () => {
  const rows = await authRepo.findAllStudents();
  return rows.map((r) => ({
    id: r.id,
    name: r.full_name,
    identifier: r.identifier,
    role: r.role,
  }));
};

export const changePassword = async (
  userId: string,
  body: { oldPassword?: string; newPassword?: string }
) => {
  const oldPass = body.oldPassword;
  const newPass = body.newPassword;

  if (!oldPass || !newPass) {
    throw Unauthorized("Password lama dan password baru wajib diisi", "BAD_REQUEST");
  }

  if (newPass.length < 6) {
    throw Unauthorized("Password baru minimal 6 karakter", "BAD_REQUEST");
  }

  const credential = await authRepo.findCredentialByProfileId(userId);
  if (!credential) {
    throw NotFound("Kredensial akun tidak ditemukan");
  }

  const isValidCurrent = await verifyPassword(oldPass, credential.passwordHash);
  if (!isValidCurrent) {
    throw Unauthorized("Password lama tidak sesuai", "INVALID_PASSWORD");
  }

  const newHash = await hashPassword(newPass);
  await authRepo.updatePasswordHash(userId, newHash);

  return { updated: true, message: "Password berhasil diperbarui" };
};
