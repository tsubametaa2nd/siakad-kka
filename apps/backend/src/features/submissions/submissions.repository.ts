// Fitur: repository pengumpulan tugas AstraDB
import { ASTRA_COLLECTIONS, execAstra, getCollection } from "../../config/astra";

const getSubmissionsCol = () => getCollection(ASTRA_COLLECTIONS.SUBMISSIONS);

export const createSubmission = async (data: any) => {
  return execAstra(async () => {
    const now = new Date().toISOString();
    const doc = { _id: crypto.randomUUID(), ...data, version: 1, isDeleted: false, submittedAt: now, updatedAt: now };
    await getSubmissionsCol().insertOne(doc);
    return doc;
  });
};

export const findActiveSubmission = async (assignmentId: string, studentId: string, groupId?: string) => {
  return execAstra(async () => {
    const col = getSubmissionsCol();
    if (groupId) {
      const byGroup = await col.findOne({ assignmentId, groupId, isDeleted: { $ne: true } });
      if (byGroup) return byGroup;
    }
    return await col.findOne({ assignmentId, studentId, isDeleted: { $ne: true } });
  });
};

export const findSubmissionById = async (id: string) => {
  return execAstra(async () => getSubmissionsCol().findOne({ _id: id }));
};

export const updateSubmissionWithVersion = async (id: string, expectedVersion: number, updates: any) => {
  return execAstra(async () => {
    const col = getSubmissionsCol();
    const res = await col.updateOne(
      { _id: id, version: expectedVersion },
      { $set: { ...updates, updatedAt: new Date().toISOString() }, $inc: { version: 1 } }
    );
    if (res.matchedCount === 0) return null;
    return await findSubmissionById(id);
  });
};

export const softDeleteSubmission = async (id: string) => {
  return execAstra(async () => {
    await getSubmissionsCol().updateOne({ _id: id }, { $set: { isDeleted: true, updatedAt: new Date().toISOString() } });
  });
};

export const findActiveSubmissionsByAssignment = async (assignmentId: string, limit = 1000) => {
  return execAstra(async () => {
    const cursor = getSubmissionsCol().find({ assignmentId, isDeleted: { $ne: true } }, { limit });
    const docs = await cursor.toArray();
    return docs.sort((a: any, b: any) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime());
  });
};
