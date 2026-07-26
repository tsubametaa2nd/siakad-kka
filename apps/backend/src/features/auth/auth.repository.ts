// Fitur: repository autentikasi Drizzle ORM + Supabase REST API Fallback
import { db, schema } from "../../db";
import { supabase } from "../../config/supabase";
import { eq, ilike, or } from "drizzle-orm";
import type { Role } from "../../shared/types";

export const findCredentialByUsername = async (username: string) => {
  const cleanUsername = username.trim();
  if (!cleanUsername) return null;

  // 1. Coba Drizzle ORM query via Postgres Connection Pool
  try {
    const rows = await db
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
      .where(
        or(
          ilike(schema.credentials.username, cleanUsername),
          ilike(schema.profiles.identifier, cleanUsername)
        )
      )
      .limit(1);

    if (rows && rows[0]) return rows[0];
  } catch (err) {
    console.error("[AuthRepo] Drizzle DB pool query error, attempting Supabase REST API fallback:", err);
  }

  // 2. Supabase HTTP REST API Fallback (Tahan banting pada Serverless Vercel, tanpa timeout idle connection)
  try {
    const { data: creds } = await supabase
      .from("credentials")
      .select("profile_id, username, password_hash")
      .ilike("username", cleanUsername)
      .limit(1);

    const credData = creds?.[0];

    if (!credData) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, role, identifier")
        .ilike("identifier", cleanUsername)
        .limit(1);

      if (profiles?.[0]) {
        const { data: credsById } = await supabase
          .from("credentials")
          .select("profile_id, username, password_hash")
          .eq("profile_id", profiles[0].id)
          .limit(1);

        if (credsById?.[0]) {
          return {
            profile_id: credsById[0].profile_id,
            username: credsById[0].username,
            password_hash: credsById[0].password_hash,
            profiles: profiles[0],
          };
        }
      }
    } else {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, role, identifier")
        .eq("id", credData.profile_id)
        .limit(1);

      if (profiles?.[0]) {
        return {
          profile_id: credData.profile_id,
          username: credData.username,
          password_hash: credData.password_hash,
          profiles: profiles[0],
        };
      }
    }
  } catch (err) {
    console.error("[AuthRepo] Supabase REST API query error:", err);
  }

  return null;
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
