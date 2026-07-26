// Fitur: repository autentikasi Drizzle ORM
import { db, schema } from "../../db";
import { eq } from "drizzle-orm";
import type { Role } from "../../shared/types";

export const findCredentialByUsername = async (username: string) => {
  const cleanUsername = username.trim();
  let rows = await db
    .select({
      profile_id: schema.credentials.profileId,
      username: schema.credentials.username,
      password_hash: schema.credentials.passwordHash,
      profiles: {
        id: schema.profiles.id,
        full_name: schema.profiles.fullName,
        role: schema.profiles.role,
        identifier: schema.profiles.identifier,
      },
    })
    .from(schema.credentials)
    .innerJoin(schema.profiles, eq(schema.credentials.profileId, schema.profiles.id))
    .where(eq(schema.credentials.username, cleanUsername))
    .limit(1);

  if (!rows[0]) {
    rows = await db
      .select({
        profile_id: schema.credentials.profileId,
        username: schema.credentials.username,
        password_hash: schema.credentials.passwordHash,
        profiles: {
          id: schema.profiles.id,
          full_name: schema.profiles.fullName,
          role: schema.profiles.role,
          identifier: schema.profiles.identifier,
        },
      })
      .from(schema.credentials)
      .innerJoin(schema.profiles, eq(schema.credentials.profileId, schema.profiles.id))
      .where(eq(schema.profiles.identifier, cleanUsername))
      .limit(1);
  }

  return rows[0] || null;
};

export const findProfileByIdentifier = async (identifier: string) => {
  const rows = await db
    .select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(eq(schema.profiles.identifier, identifier))
    .limit(1);

  return rows[0] || null;
};

export const createProfile = async (fullName: string, role: Role, identifier: string) => {
  const [data] = await db
    .insert(schema.profiles)
    .values({ fullName, role, identifier })
    .returning({
      id: schema.profiles.id,
      full_name: schema.profiles.fullName,
      role: schema.profiles.role,
      identifier: schema.profiles.identifier,
    });

  return data;
};

export const deleteProfile = async (id: string) => {
  await db.delete(schema.profiles).where(eq(schema.profiles.id, id));
};

export const createCredentials = async (profileId: string, username: string, passwordHash: string) => {
  await db.insert(schema.credentials).values({
    profileId,
    username,
    passwordHash,
  });
};

export const findProfileById = async (id: string) => {
  const [data] = await db
    .select({
      id: schema.profiles.id,
      full_name: schema.profiles.fullName,
      role: schema.profiles.role,
      identifier: schema.profiles.identifier,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.id, id));

  return data || null;
};

export const updateProfileName = async (id: string, fullName: string) => {
  const [data] = await db
    .update(schema.profiles)
    .set({ fullName })
    .where(eq(schema.profiles.id, id))
    .returning({
      id: schema.profiles.id,
      full_name: schema.profiles.fullName,
      role: schema.profiles.role,
      identifier: schema.profiles.identifier,
    });

  return data;
};

export const findAllStudents = async () => {
  const rows = await db
    .select({
      id: schema.profiles.id,
      full_name: schema.profiles.fullName,
      identifier: schema.profiles.identifier,
      role: schema.profiles.role,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.role, "student"))
    .orderBy(schema.profiles.fullName);

  return rows;
};

export const findCredentialByProfileId = async (profileId: string) => {
  const rows = await db
    .select({
      profileId: schema.credentials.profileId,
      username: schema.credentials.username,
      passwordHash: schema.credentials.passwordHash,
    })
    .from(schema.credentials)
    .where(eq(schema.credentials.profileId, profileId))
    .limit(1);

  return rows[0] || null;
};

export const updatePasswordHash = async (profileId: string, passwordHash: string) => {
  await db
    .update(schema.credentials)
    .set({ passwordHash })
    .where(eq(schema.credentials.profileId, profileId));
};
