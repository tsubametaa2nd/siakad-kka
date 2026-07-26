// Fitur: layanan bisnis materi
import sanitizeHtml from "sanitize-html";
import { isStudentEnrolled, findClassesByStudent } from "../classes/classes.repository";
import { assertTeacherOwnsClass, getTeacherClasses } from "../classes/classes.service";
import { BadRequest, Forbidden, NotFound } from "../../shared/utils/errors";

import * as materialsRepo from "./materials.repository";
import { renderMaterialHtml } from "./materials.render";
import type { CreateMaterialBody, UpdateMaterialBody } from "./materials.schema";

const sanitizeHtmlBlock = (content: string): string => {
  return sanitizeHtml(content, {
    allowedTags: [
      "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
      "strong", "em", "a", "img", "table", "thead", "tbody", "tr", "th", "td",
      "pre", "code", "blockquote", "br", "hr", "div", "span", "style",
      "section", "article", "header", "footer", "nav", "main", "figure", "figcaption",
      "details", "summary", "mark", "ins", "del", "sup", "sub", "iframe"
    ],
    allowedAttributes: {
      a: ["href", "alt", "title", "class", "target", "id"],
      img: ["src", "alt", "title", "class", "width", "height", "id"],
      iframe: ["src", "frameborder", "allowfullscreen", "width", "height", "class"],
      "*": ["alt", "title", "class", "id", "style"],
    },
    allowedSchemes: ["http", "https", "mailto", "data"],
  });
};

const processBlocks = (blocks: any[]) => {
  if (!blocks || blocks.length === 0) throw BadRequest("Materi harus memiliki minimal 1 blok");
  return blocks.map((b) => {
    if (b.type === "html") {
      return { ...b, content: sanitizeHtmlBlock(b.content) };
    }
    if (b.type === "fullhtml") {
      // Raw HTML material — rendered in sandboxed iframe, no sanitization needed
      return { ...b };
    }
    if (b.type === "video") {
      try {
        const u = new URL(b.url);
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
      } catch {
        throw BadRequest("URL video harus berformat http/https yang valid");
      }
    }
    return b;
  });
};

const formatSlug = (str: string): string => {
  return str
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "");
};

export const createMaterial = async (teacherId: string, body: CreateMaterialBody) => {
  const targetClassId = body.classId || body.class_id;
  if (!targetClassId) throw BadRequest("Kelas tujuan (classId) wajib diisi");

  const cleanBlocks = processBlocks(body.blocks);

  let cleanSlug: string = formatSlug(body.slug && body.slug.trim() ? body.slug : body.title);
  if (!cleanSlug) {
    cleanSlug = `materi_${Date.now().toString(36)}`;
  }

  const existing = await materialsRepo.findMaterialBySlug(cleanSlug);
  if (existing) {
    if (body.slug && body.slug.trim()) {
      throw BadRequest(`Slug '${cleanSlug}' sudah digunakan oleh materi lain. Pilih slug lain.`);
    } else {
      cleanSlug = `${cleanSlug}_${Date.now().toString(36).slice(-4)}`;
    }
  }

  if (targetClassId === "ALL_CLASSES" || targetClassId === "ALL") {
    const classes = await getTeacherClasses(teacherId);
    if (classes.length === 0) {
      throw BadRequest("Anda belum memiliki kelas akademik untuk menerbitkan materi.");
    }
    const createdList = await Promise.all(
      classes.map((cls) =>
        materialsRepo.createMaterial({
          classId: cls.id,
          teacherId,
          title: body.title,
          slug: cleanSlug ? `${cleanSlug}_${cls.name.replace(/\s+/g, "_")}` : undefined,
          blocks: cleanBlocks,
        })
      )
    );
    return createdList[0];
  }

  await assertTeacherOwnsClass(teacherId, targetClassId);
  return await materialsRepo.createMaterial({
    classId: targetClassId,
    teacherId,
    title: body.title,
    slug: cleanSlug,
    blocks: cleanBlocks,
  });
};

export const updateMaterial = async (teacherId: string, materialId: string, body: UpdateMaterialBody) => {
  const material = await materialsRepo.findMaterialByIdOrSlug(materialId);
  if (!material) throw NotFound("Materi tidak ditemukan");
  if (material.teacherId !== teacherId) throw Forbidden("Anda tidak memiliki hak akses untuk mengubah materi ini");

  const updates: any = {};
  if (body.title) updates.title = body.title;
  if (body.slug !== undefined) {
    if (body.slug.trim()) {
      const cleanSlug = formatSlug(body.slug);
      const existing = await materialsRepo.findMaterialBySlug(cleanSlug);
      if (existing && String(existing._id) !== String(material._id)) {
        throw BadRequest(`Slug '${cleanSlug}' sudah digunakan oleh materi lain.`);
      }
      updates.slug = cleanSlug;
    } else {
      updates.slug = null;
    }
  }
  if (body.blocks) updates.blocks = processBlocks(body.blocks);

  return await materialsRepo.updateMaterial(String(material._id), updates);
};

export const deleteMaterial = async (teacherId: string, materialId: string) => {
  const material = await materialsRepo.findMaterialByIdOrSlug(materialId);
  if (!material) throw NotFound("Materi tidak ditemukan");
  if (material.teacherId !== teacherId) throw Forbidden("Anda tidak memiliki hak akses untuk menghapus materi ini");

  await materialsRepo.deleteMaterial(String(material._id));
  return { deleted: true };
};

export const getClassMaterials = async (userId: string, userRole: string, classId: string) => {
  if (userRole === "teacher") {
    await assertTeacherOwnsClass(userId, classId);
  } else {
    const enrolled = await isStudentEnrolled(userId, classId);
    if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");
  }
  return await materialsRepo.findMaterialsByClass(classId);
};

export const getTeacherMaterials = async (teacherId: string) => {
  return await materialsRepo.findMaterialsByTeacher(teacherId);
};

/**
 * Mengambil semua materi yang tersedia untuk siswa berdasarkan kelas-kelas yang mereka ikuti.
 * Opsional: filter berdasarkan satu classId tertentu.
 */
export const getStudentMaterials = async (studentId: string, classId?: string) => {
  if (classId) {
    // Filter materi untuk satu kelas saja, sambil verifikasi enrollment
    const enrolled = await isStudentEnrolled(studentId, classId);
    if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");
    return await materialsRepo.findMaterialsByClass(classId);
  }

  // Ambil semua kelas yang diikuti siswa
  const enrolledClasses = await findClassesByStudent(studentId);
  if (!enrolledClasses || enrolledClasses.length === 0) return [];

  const classIds = enrolledClasses.map((c) => c.id);
  return await materialsRepo.findMaterialsByClassIds(classIds);
};

export const getMaterialDetail = async (userId: string, userRole: string, materialIdOrSlug: string) => {
  const material = await materialsRepo.findMaterialByIdOrSlug(materialIdOrSlug);
  if (!material) throw NotFound("Materi tidak ditemukan");

  if (userRole === "teacher") {
    await assertTeacherOwnsClass(userId, material.classId);
  } else {
    const enrolled = await isStudentEnrolled(userId, material.classId);
    if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");
  }

  return material;
};

export const renderMaterialView = async (userId: string, userRole: string, materialIdOrSlug: string) => {
  const material = await getMaterialDetail(userId, userRole, materialIdOrSlug);
  return renderMaterialHtml(material);
};

interface ActiveReaderInfo {
  student_id: string;
  name: string;
  identifier: string;
  last_seen_at: number;
}

const activeMaterialReadersMap = new Map<string, Map<string, ActiveReaderInfo>>();

export const recordPresence = (materialId: string, user: { student_id: string; name: string; identifier: string }) => {
  if (!activeMaterialReadersMap.has(materialId)) {
    activeMaterialReadersMap.set(materialId, new Map());
  }
  const readers = activeMaterialReadersMap.get(materialId)!;
  readers.set(user.student_id, {
    student_id: user.student_id,
    name: user.name,
    identifier: user.identifier || "SISWA",
    last_seen_at: Date.now(),
  });
  return { success: true };
};

export const getActiveReaders = (materialId: string) => {
  const readersMap = activeMaterialReadersMap.get(materialId);
  if (!readersMap) return { material_id: materialId, active_count: 0, readers: [] };

  const now = Date.now();
  const activeList: ActiveReaderInfo[] = [];

  for (const [studentId, reader] of readersMap.entries()) {
    if (now - reader.last_seen_at <= 25000) {
      activeList.push(reader);
    } else {
      readersMap.delete(studentId);
    }
  }

  return {
    material_id: materialId,
    active_count: activeList.length,
    readers: activeList.map((r) => ({
      student_id: r.student_id,
      name: r.name,
      identifier: r.identifier,
      last_seen_at: new Date(r.last_seen_at).toISOString(),
    })),
  };
};
