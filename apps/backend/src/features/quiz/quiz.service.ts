// Fitur: layanan bisnis quiz
import { isStudentEnrolled, findProfilesByIds, findClassesByStudent } from "../classes/classes.repository";
import { assertTeacherOwnsClass } from "../classes/classes.service";
import { BadRequest, Conflict, Forbidden, NotFound } from "../../shared/utils/errors";
import * as quizRepo from "./quiz.repository";
import type { AttemptQuizBody, CreateQuizBody, StartQuizBody } from "./quiz.schema";

/** Fisher-Yates shuffle – menghasilkan array indeks teracak */
const shuffleIndices = (length: number): number[] => {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
};

export const createQuiz = async (teacherId: string, body: CreateQuizBody) => {
  const classId = body.classId || (body as any).class_id;
  const deadline = body.deadline || (body as any).due_date;
  const timeLimitMinutes = Number(body.timeLimitMinutes ?? (body as any).duration_minutes ?? 30);

  if (!classId) throw BadRequest("classId wajib diisi");
  if (!deadline) throw BadRequest("deadline wajib diisi");

  await assertTeacherOwnsClass(teacherId, classId);

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
    throw BadRequest("Deadline harus di masa depan");
  }

  // Normalize questions: accept both {text, answer, points} and {question, answer_index, weight}
  const normalizedQuestions = body.questions.map((q: any, i: number) => {
    const text = q.text || q.question;
    const answer = q.answer !== undefined ? q.answer : q.answer_index;
    const points = q.points !== undefined ? Number(q.points) : Number(q.weight ?? 1);

    if (!text || text.trim().length === 0) throw BadRequest(`Soal ke-${i + 1} tidak boleh kosong`);
    if (!q.options || q.options.length < 2) throw BadRequest(`Soal ke-${i + 1} minimal harus memiliki 2 pilihan jawaban`);
    if (answer === undefined || answer < 0 || answer >= q.options.length) throw BadRequest(`Kunci jawaban soal ke-${i + 1} tidak valid`);

    return { text: text.trim(), options: q.options.map((o: string) => o.trim()), answer, points };
  });

  return await quizRepo.createQuiz({
    classId,
    teacherId,
    title: body.title,
    questions: normalizedQuestions,
    deadline: deadlineDate.toISOString(),
    timeLimitMinutes,
  });
};

export const getClassQuizzes = async (userId: string, userRole: string, classId: string) => {
  if (userRole === "teacher") {
    await assertTeacherOwnsClass(userId, classId);
  } else {
    const enrolled = await isStudentEnrolled(userId, classId);
    if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");
  }
  return await quizRepo.findQuizzesByClass(classId);
};

export const getStudentQuizzes = async (studentId: string, classId?: string) => {
  if (classId) {
    const enrolled = await isStudentEnrolled(studentId, classId);
    if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");
    const quizzes = await quizRepo.findQuizzesByClass(classId);
    return await attachStudentAttemptStatus(quizzes, studentId);
  }

  const enrolledClasses = await findClassesByStudent(studentId);
  if (!enrolledClasses || enrolledClasses.length === 0) return [];

  const allQuizzes = await Promise.all(
    enrolledClasses.map((c: any) => quizRepo.findQuizzesByClass(c.id || c.classId))
  );
  const quizzes = allQuizzes.flat();
  return await attachStudentAttemptStatus(quizzes, studentId);
};

const attachStudentAttemptStatus = async (quizzes: any[], studentId: string) => {
  const attempts = await quizRepo.findStudentAttempts(studentId);
  const attemptMap = new Map((attempts || []).map((a: any) => [a.quizId, a]));

  return quizzes.map((q: any) => {
    const attempt: any = attemptMap.get(q._id);
    let status: string = "Belum";
    let score: number | undefined;
    if (attempt?.submittedAt) {
      status = "Sudah";
      score = attempt.score;
    }
    return {
      ...q,
      studentStatus: status,
      score,
    };
  });
};

export const getQuizForStudent = async (studentId: string, quizId: string) => {
  const quizWithSecret = await quizRepo.findQuizByIdWithSecret(quizId);
  if (!quizWithSecret) throw NotFound("Quiz tidak ditemukan");

  const enrolled = await isStudentEnrolled(studentId, quizWithSecret.classId);
  if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");

  return await quizRepo.findQuizByIdForStudent(quizId);
};

export const startQuiz = async (studentId: string, body: StartQuizBody) => {
  const quizId = body.quiz_id;
  const quiz = await quizRepo.findQuizByIdWithSecret(quizId);
  if (!quiz) throw NotFound("Quiz tidak ditemukan");

  const enrolled = await isStudentEnrolled(studentId, quiz.classId);
  if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");

  const attempt = await quizRepo.findAttempt(quizId, studentId);
  if (attempt && attempt.submittedAt) throw Conflict("Kamu sudah mengerjakan quiz ini", "ALREADY_ATTEMPTED");

  // Jika attempt belum ada, buat urutan soal acak per siswa
  let questionOrder: number[];
  if (attempt && attempt.questionOrder) {
    questionOrder = attempt.questionOrder;
  } else {
    questionOrder = shuffleIndices(quiz.questions.length);
  }

  const started = await quizRepo.recordAttemptStart(quizId, studentId, questionOrder);
  const expiresAt = new Date(new Date(started.startedAt).getTime() + quiz.timeLimitMinutes * 60 * 1000).toISOString();

  // Kembalikan soal sesuai urutan acak (tanpa kunci jawaban)
  const shuffledQuestions = questionOrder.map((origIdx: number) => {
    const q = quiz.questions[origIdx];
    return {
      id: `${quizId}_q${origIdx}`,
      origIndex: origIdx,
      question: q.text,
      options: q.options,
      weight: q.points,
    };
  });

  return {
    attempt_id: started._id,
    started_at: started.startedAt,
    expires_at: expiresAt,
    questions: shuffledQuestions,
  };
};

export const submitAttempt = async (studentId: string, body: AttemptQuizBody) => {
  // Cari attempt berdasarkan attempt_id untuk mendapatkan quizId
  const attemptRecord = await quizRepo.findAttemptById(body.attempt_id);
  if (!attemptRecord || !attemptRecord.startedAt) throw BadRequest("Kamu belum memulai pengerjaan quiz");
  if (attemptRecord.submittedAt) throw Conflict("Kamu sudah mengerjakan quiz ini", "ALREADY_ATTEMPTED");
  if (attemptRecord.studentId !== studentId) throw Forbidden("Bukan attempt Anda");

  const quizId = attemptRecord.quizId;
  const quiz = await quizRepo.findQuizByIdWithSecret(quizId);
  if (!quiz) throw NotFound("Quiz tidak ditemukan");

  const enrolled = await isStudentEnrolled(studentId, quiz.classId);
  if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");

  const now = new Date();
  if (now.getTime() > new Date(quiz.deadline).getTime()) throw BadRequest("Tenggat waktu quiz sudah lewat");

  const elapsedMinutes = (now.getTime() - new Date(attemptRecord.startedAt).getTime()) / (1000 * 60);
  if (elapsedMinutes > quiz.timeLimitMinutes + 1) throw BadRequest("Waktu pengerjaan quiz sudah habis");

  // timeTakenSeconds — dihitung server-side dari startedAt
  const timeTakenSeconds = Math.floor((now.getTime() - new Date(attemptRecord.startedAt).getTime()) / 1000);

  const questionOrder: number[] = attemptRecord.questionOrder ?? quiz.questions.map((_: any, i: number) => i);

  // body.answers adalah array of { question_id, selected_option_index }
  // question_id format: quizId_qOrigIdx
  if (!body.answers || body.answers.length !== quiz.questions.length) {
    throw BadRequest("Jumlah jawaban harus sama dengan jumlah soal");
  }

  let score = 0;
  let maxScore = 0;
  const rawAnswers: number[] = new Array(quiz.questions.length);

  for (let shuffledIdx = 0; shuffledIdx < questionOrder.length; shuffledIdx++) {
    const origIdx = questionOrder[shuffledIdx];
    const q = quiz.questions[origIdx];
    // Cari jawaban berdasarkan question_id
    const expectedQId = `${quizId}_q${origIdx}`;
    const answerEntry = body.answers.find((a: any) => a.question_id === expectedQId);
    const ans = answerEntry?.selected_option_index ?? -1;

    if (typeof ans !== "number" || ans < 0 || ans >= q.options.length) {
      // Jawaban tidak valid atau belum dijawab → skip (score 0 untuk soal ini)
      maxScore += Number(q.points || 0);
      rawAnswers[origIdx] = -1;
      continue;
    }

    maxScore += Number(q.points || 0);
    if (ans === q.answer) score += Number(q.points || 0);
    rawAnswers[origIdx] = ans;
  }

  await quizRepo.saveAttemptResult(quizId, studentId, { answers: rawAnswers, score, maxScore, timeTakenSeconds });
  return { score, max_score: maxScore, time_taken_seconds: timeTakenSeconds };
};

export const reportProgress = async (studentId: string, attemptId: string, answeredCount: number) => {
  const attemptRecord = await quizRepo.findAttemptById(attemptId);
  if (!attemptRecord) throw BadRequest("Attempt tidak ditemukan");
  if (attemptRecord.studentId !== studentId) throw Forbidden("Bukan attempt Anda");
  if (attemptRecord.submittedAt) return; // sudah selesai, abaikan
  await quizRepo.updateAttemptProgress(attemptId, studentId, answeredCount);
};

export const getQuizResults = async (teacherId: string, quizId: string) => {
  const quiz = await quizRepo.findQuizByIdWithSecret(quizId);
  if (!quiz) throw NotFound("Quiz tidak ditemukan");
  await assertTeacherOwnsClass(teacherId, quiz.classId);

  const attempts = await quizRepo.findQuizResults(quizId);
  const inProgressAttempts = await quizRepo.findInProgressAttempts(quizId);

  // Ambil jumlah total siswa di kelas
  let totalStudents = 0;
  try {
    const { findClassStudents } = await import("../classes/classes.repository");
    const students = await findClassStudents(quiz.classId);
    totalStudents = students?.length ?? 0;
  } catch { /* if not available, fallback */ }

  // Ambil profil semua siswa yang terlibat (sudah submit + sedang mengerjakan)
  const allStudentIds = [
    ...attempts.map((a: any) => a.studentId),
    ...inProgressAttempts.map((a: any) => a.studentId),
  ];
  const profiles = await findProfilesByIds(allStudentIds);
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const results = attempts.map((a: any) => {
    const profile = profileMap.get(a.studentId) ?? { full_name: "Anonim", identifier: "-" };
    return {
      student_id: a.studentId,
      student_name: (profile as any).full_name,
      identifier: (profile as any).identifier,
      score: a.score ?? null,
      max_score: a.maxScore ?? 0,
      time_taken_seconds: a.timeTakenSeconds ?? null,
      completed_at: a.submittedAt ?? null,
    };
  });

  const now = new Date();
  const totalQuestions = quiz.questions?.length ?? 0;
  const in_progress = inProgressAttempts.map((a: any) => {
    const profile = profileMap.get(a.studentId) ?? { full_name: "Anonim", identifier: "-" };
    const elapsedSeconds = a.startedAt
      ? Math.floor((now.getTime() - new Date(a.startedAt).getTime()) / 1000)
      : null;
    return {
      student_id: a.studentId,
      student_name: (profile as any).full_name,
      identifier: (profile as any).identifier,
      started_at: a.startedAt,
      elapsed_seconds: elapsedSeconds,
      answered_count: a.answeredCount ?? 0,
      total_questions: totalQuestions,
    };
  });

  return {
    quiz_title: quiz.title,
    total_students: totalStudents || (attempts.length + inProgressAttempts.length),
    attempted_count: attempts.length,
    in_progress_count: inProgressAttempts.length,
    in_progress,
    results,
  };
};

/** Ambil leaderboard — bisa dipanggil guru atau siswa yang sudah submit */
const buildLeaderboard = async (quiz: any, quizId: string) => {
  const attempts = await quizRepo.findQuizLeaderboard(quizId);

  // Ambil data profil siswa dari repository Drizzle sekaligus
  const studentIds = attempts.map((a: any) => a.studentId);
  const profiles = await findProfilesByIds(studentIds);

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  return {
    quiz_id: quizId,
    quiz_title: quiz.title,
    max_score: attempts[0]?.maxScore ?? 0,
    entries: attempts.map((a: any, idx: number) => {
      const profile = profileMap.get(a.studentId) ?? { full_name: "Anonim", identifier: "-" };
      return {
        rank: idx + 1,
        student_id: a.studentId,
        student_name: (profile as any).full_name,
        identifier: (profile as any).identifier,
        score: a.score,
        max_score: a.maxScore,
        time_taken_seconds: a.timeTakenSeconds ?? null,
        submitted_at: a.submittedAt,
      };
    }),
  };
};

export const getQuizLeaderboard = async (teacherId: string, quizId: string) => {
  const quiz = await quizRepo.findQuizByIdWithSecret(quizId);
  if (!quiz) throw NotFound("Quiz tidak ditemukan");
  await assertTeacherOwnsClass(teacherId, quiz.classId);
  return await buildLeaderboard(quiz, quizId);
};

export const getQuizLeaderboardForStudent = async (studentId: string, quizId: string) => {
  const quiz = await quizRepo.findQuizByIdWithSecret(quizId);
  if (!quiz) throw NotFound("Quiz tidak ditemukan");

  const enrolled = await isStudentEnrolled(studentId, quiz.classId);
  if (!enrolled) throw Forbidden("Kamu belum terdaftar di kelas ini");

  // Siswa hanya boleh lihat leaderboard jika sudah submit
  const attempt = await quizRepo.findAttempt(quizId, studentId);
  if (!attempt || !attempt.submittedAt) throw Forbidden("Kamu belum menyelesaikan quiz ini");

  return await buildLeaderboard(quiz, quizId);
};


