// Fitur: repository tugas AstraDB
import { ASTRA_COLLECTIONS, execAstra, getCollection } from "../../config/astra";

const getAssignmentsCol = () => getCollection(ASTRA_COLLECTIONS.ASSIGNMENTS);
const getSubmissionsCol = () => getCollection(ASTRA_COLLECTIONS.SUBMISSIONS);

export const createAssignment = async (data: any) => {
  return execAstra(async () => {
    const doc = { _id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await getAssignmentsCol().insertOne(doc);
    return doc;
  });
};

export const findAssignmentById = async (id: string) => {
  return execAstra(async () => getAssignmentsCol().findOne({ _id: id }));
};

export const findAssignmentsByClass = async (classId: string, limit = 1000) => {
  return execAstra(async () => {
    const cursor = getAssignmentsCol().find({ classId }, { sort: { createdAt: -1 }, limit });
    return await cursor.toArray();
  });
};

export const findAssignmentsByTeacher = async (teacherId: string, limit = 1000) => {
  return execAstra(async () => {
    const cursor = getAssignmentsCol().find({ teacherId }, { sort: { createdAt: -1 }, limit });
    return await cursor.toArray();
  });
};

export const findAssignmentsByClassIds = async (classIds: string[], limit = 1000) => {
  if (!classIds || classIds.length === 0) return [];
  return execAstra(async () => {
    const col = getAssignmentsCol();
    const results = await Promise.all(
      classIds.map((classId) =>
        col.find({ classId }, { sort: { createdAt: -1 }, limit }).toArray()
      )
    );
    return results.flat().sort((a: any, b: any) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  });
};

export const updateAssignment = async (id: string, updates: any) => {
  return execAstra(async () => {
    const patch = { ...updates, updatedAt: new Date().toISOString() };
    await getAssignmentsCol().updateOne({ _id: id }, { $set: patch });
    return await findAssignmentById(id);
  });
};

export const deleteAssignment = async (id: string) => {
  return execAstra(async () => {
    await getAssignmentsCol().deleteOne({ _id: id });
  });
};

export const countSubmissions = async (assignmentId: string) => {
  return execAstra(async () => {
    const sub = await getSubmissionsCol().findOne({ assignmentId });
    return sub ? 1 : 0;
  });
};

export const deleteSubmissionsByAssignment = async (assignmentId: string) => {
  return execAstra(async () => {
    await getSubmissionsCol().deleteMany({ assignmentId });
  });
};

export const findStudentSubmissionsForClass = async (classId: string, studentId: string, groupIds: string[] = [], limit = 1000) => {
  return execAstra(async () => {
    const col = getSubmissionsCol();
    const cursorByStudent = col.find({ classId, studentId, isDeleted: { $ne: true } }, { limit });
    const studentSubs = await cursorByStudent.toArray();

    if (!groupIds || groupIds.length === 0) return studentSubs;

    const groupSubPromises = groupIds.map((groupId) =>
      col.find({ classId, groupId, isDeleted: { $ne: true } }, { limit }).toArray()
    );
    const groupSubsResults = await Promise.all(groupSubPromises);
    const all = [...studentSubs, ...groupSubsResults.flat()];

    const seen = new Set();
    return all.filter((s: any) => {
      const id = s._id || s.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  });
};

export const findStudentAllSubmissions = async (studentId: string, groupIds: string[] = [], limit = 1000) => {
  return execAstra(async () => {
    const col = getSubmissionsCol();
    const cursorByStudent = col.find({ studentId, isDeleted: { $ne: true } }, { limit });
    const studentSubs = await cursorByStudent.toArray();

    if (!groupIds || groupIds.length === 0) return studentSubs;

    const groupSubPromises = groupIds.map((groupId) =>
      col.find({ groupId, isDeleted: { $ne: true } }, { limit }).toArray()
    );
    const groupSubsResults = await Promise.all(groupSubPromises);
    const all = [...studentSubs, ...groupSubsResults.flat()];

    const seen = new Set();
    return all.filter((s: any) => {
      const id = s._id || s.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  });
};
