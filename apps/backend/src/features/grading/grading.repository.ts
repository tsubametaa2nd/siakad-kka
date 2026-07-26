// Fitur: repository penilaian AstraDB
import { ASTRA_COLLECTIONS, execAstra, getCollection } from "../../config/astra";

const getGradesCol = () => getCollection(ASTRA_COLLECTIONS.GRADES);
const getSubmissionsCol = () => getCollection(ASTRA_COLLECTIONS.SUBMISSIONS);

export const saveGrade = async (data: any) => {
  return execAstra(async () => {
    const { _id: rawId, ...rest } = data;
    const _id = rawId || `${data.assignmentId}:${data.studentId}`;
    const now = new Date().toISOString();
    const patch = { ...rest, updatedAt: now, gradedAt: rest.gradedAt || now };
    await getGradesCol().updateOne({ _id }, { $set: patch }, { upsert: true });
    return { _id, ...patch };
  });
};

export const markSubmissionGraded = async (assignmentId: string, studentId: string, score: number) => {
  return execAstra(async () => {
    await getSubmissionsCol().updateOne(
      { assignmentId, studentId, isDeleted: { $ne: true } },
      { $set: { status: "graded", score, updatedAt: new Date().toISOString() } }
    );
  });
};

export const findGradesByAssignment = async (assignmentId: string) => {
  return execAstra(async () => {
    const cursor = getGradesCol().find({ assignmentId });
    return await cursor.toArray();
  });
};

export const findStudentGrades = async (studentId: string) => {
  return execAstra(async () => {
    const cursor = getGradesCol().find({ studentId });
    return await cursor.toArray();
  });
};

export const findUnsyncedGradesByClass = async (classId: string) => {
  return execAstra(async () => {
    const cursor = getGradesCol().find({ classId, syncedToSheet: { $ne: true } });
    return await cursor.toArray();
  });
};

export const countUngradedSubmissionsByClass = async (classId: string): Promise<number> => {
  return execAstra(async () => {
    const cursor = getSubmissionsCol().find({ classId, status: { $ne: "graded" }, isDeleted: { $ne: true } });
    const docs = await cursor.toArray();
    return docs.length;
  });
};

export const countUnsyncedGradesByClass = async (classId: string): Promise<number> => {
  return execAstra(async () => {
    const cursor = getGradesCol().find({ classId, syncedToSheet: { $ne: true } });
    const docs = await cursor.toArray();
    return docs.length;
  });
};

export const countAssignmentsByClass = async (classId: string): Promise<number> => {
  // Assignments disimpan di collection ASSIGNMENTS, bukan GRADES — import di service
  return 0; // dihitung di service layer
};
