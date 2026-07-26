// Fitur: repository quiz AstraDB
import { ASTRA_COLLECTIONS, execAstra, getCollection } from "../../config/astra";

const getQuizzesCol = () => getCollection(ASTRA_COLLECTIONS.QUIZZES);
const getAttemptsCol = () => getCollection(ASTRA_COLLECTIONS.QUIZ_ATTEMPTS);

export const createQuiz = async (data: any) => {
  return execAstra(async () => {
    const doc = { _id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
    await getQuizzesCol().insertOne(doc);
    return doc;
  });
};

export const findQuizByIdWithSecret = async (id: string) => {
  return execAstra(async () => getQuizzesCol().findOne({ _id: id }));
};

export const findQuizByIdForStudent = async (id: string) => {
  return execAstra(async () => {
    const quiz: any = await getQuizzesCol().findOne({ _id: id }, { projection: { "questions.answer": 0 } });
    if (!quiz) return null;
    if (quiz.questions) {
      quiz.questions = quiz.questions.map(({ answer, ...q }: any) => q);
    }
    return quiz;
  });
};

export const findQuizzesByClass = async (classId: string) => {
  return execAstra(async () => {
    const cursor = getQuizzesCol().find({ classId }, { sort: { createdAt: -1 } });
    return await cursor.toArray();
  });
};

export const findAttempt = async (quizId: string, studentId: string) => {
  return execAstra(async () => getAttemptsCol().findOne({ quizId, studentId }));
};

export const findAttemptById = async (attemptId: string) => {
  return execAstra(async () => getAttemptsCol().findOne({ _id: attemptId }));
};

export const recordAttemptStart = async (quizId: string, studentId: string, questionOrder: number[]) => {
  return execAstra(async () => {
    const now = new Date().toISOString();
    const existing = await findAttempt(quizId, studentId);
    if (!existing) {
      const doc = { _id: crypto.randomUUID(), quizId, studentId, startedAt: now, questionOrder };
      await getAttemptsCol().insertOne(doc);
      return doc;
    }
    return existing;
  });
};

export const saveAttemptResult = async (
  quizId: string,
  studentId: string,
  data: { answers: number[]; score: number; maxScore: number; timeTakenSeconds: number }
) => {
  return execAstra(async () => {
    const now = new Date().toISOString();
    await getAttemptsCol().updateOne(
      { quizId, studentId },
      {
        $set: {
          answers: data.answers,
          score: data.score,
          maxScore: data.maxScore,
          timeTakenSeconds: data.timeTakenSeconds,
          submittedAt: now,
        },
      },
      { upsert: true }
    );
  });
};

export const findQuizResults = async (quizId: string) => {
  return execAstra(async () => {
    const cursor = getAttemptsCol().find({ quizId, submittedAt: { $exists: true } });
    return await cursor.toArray();
  });
};

export const updateAttemptProgress = async (attemptId: string, studentId: string, answeredCount: number) => {
  return execAstra(async () => {
    await getAttemptsCol().updateOne(
      { _id: attemptId, studentId },
      { $set: { answeredCount, progressUpdatedAt: new Date().toISOString() } }
    );
  });
};

export const findInProgressAttempts = async (quizId: string) => {
  return execAstra(async () => {
    // Siswa yang sudah startedAt tapi belum submittedAt
    const cursor = getAttemptsCol().find({ quizId, startedAt: { $exists: true }, submittedAt: { $exists: false } });
    return await cursor.toArray();
  });
};

export const findStudentAttempts = async (studentId: string) => {
  return execAstra(async () => {
    const cursor = getAttemptsCol().find({ studentId });
    return await cursor.toArray();
  });
};

export const findQuizLeaderboard = async (quizId: string) => {
  return execAstra(async () => {
    // Ambil semua attempt yang sudah selesai
    const cursor = getAttemptsCol().find({ quizId, submittedAt: { $exists: true } });
    const attempts = await cursor.toArray();

    // Sort: score DESC, timeTakenSeconds ASC (nilai lebih tinggi dulu, jika sama → lebih cepat menang)
    attempts.sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity);
    });

    return attempts;
  });
};
