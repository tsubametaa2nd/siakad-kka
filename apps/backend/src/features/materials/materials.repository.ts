// Fitur: repository materi AstraDB
import { ASTRA_COLLECTIONS, execAstra, getCollection } from "../../config/astra";

const getMaterialsCol = () => getCollection(ASTRA_COLLECTIONS.MATERIALS);

export const createMaterial = async (data: any) => {
  return execAstra(async () => {
    const now = new Date().toISOString();
    const doc = { _id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    await getMaterialsCol().insertOne(doc);
    return doc;
  });
};

export const findMaterialById = async (id: string) => {
  return execAstra(async () => getMaterialsCol().findOne({ _id: id }));
};

export const findMaterialBySlug = async (slug: string) => {
  return execAstra(async () => getMaterialsCol().findOne({ slug }));
};

export const findMaterialByIdOrSlug = async (idOrSlug: string) => {
  return execAstra(async () => {
    const col = getMaterialsCol();
    const byId = await col.findOne({ _id: idOrSlug });
    if (byId) return byId;
    return await col.findOne({ slug: idOrSlug });
  });
};

export const findMaterialsByClass = async (classId: string, limit = 1000) => {
  return execAstra(async () => {
    const cursor = getMaterialsCol().find({ classId }, { sort: { createdAt: -1 }, limit });
    return await cursor.toArray();
  });
};

export const findMaterialsByTeacher = async (teacherId: string, limit = 1000) => {
  return execAstra(async () => {
    const cursor = getMaterialsCol().find({ teacherId }, { sort: { createdAt: -1 }, limit });
    return await cursor.toArray();
  });
};

export const findMaterialsByClassIds = async (classIds: string[], limit = 1000) => {
  if (!classIds || classIds.length === 0) return [];
  return execAstra(async () => {
    const col = getMaterialsCol();
    const results = await Promise.all(
      classIds.map((classId) =>
        col.find({ classId }, { sort: { createdAt: -1 }, limit }).toArray()
      )
    );
    // Gabungkan semua, urutkan dari terbaru
    return results.flat().sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  });
};

export const updateMaterial = async (id: string, updates: any) => {
  return execAstra(async () => {
    const patch = { ...updates, updatedAt: new Date().toISOString() };
    await getMaterialsCol().updateOne({ _id: id }, { $set: patch });
    return await findMaterialById(id);
  });
};

export const deleteMaterial = async (id: string) => {
  return execAstra(async () => {
    await getMaterialsCol().deleteOne({ _id: id });
  });
};
