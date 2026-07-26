import { api } from './client';

export interface QuestionDraft {
  question: string;
  options: string[];
  answer_index: number;
  weight: number;
}

export interface QuizItem {
  id: string;
  class_id: string;
  class_name?: string;
  title: string;
  duration_minutes: number;
  due_date: string;
  question_count: number;
  status?: 'Belum' | 'Sudah' | 'Ditutup';
  score?: number | null;
  max_score?: number;
}

export interface QuizStartResponse {
  attempt_id: string;
  started_at: string;
  expires_at: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    weight: number;
  }>;
}

export interface QuizSubmitResult {
  score: number;
  max_score: number;
  correct_count: number;
  total_questions: number;
  time_taken_seconds?: number;
}

export interface TeacherQuizResultRow {
  student_id: string;
  student_name: string;
  identifier: string;
  score: number | null;
  max_score: number;
  completed_at: string | null;
}

export interface InProgressStudent {
  student_id: string;
  student_name: string;
  identifier: string;
  started_at: string;
  elapsed_seconds: number | null;
  answered_count: number;
  total_questions: number;
}

export interface TeacherQuizResultsResponse {
  quiz_title: string;
  total_students: number;
  attempted_count: number;
  in_progress_count: number;
  in_progress: InProgressStudent[];
  results: TeacherQuizResultRow[];
}

export interface LeaderboardEntry {
  rank: number;
  student_id: string;
  student_name: string;
  identifier: string;
  score: number;
  max_score: number;
  time_taken_seconds: number | null;
  submitted_at: string;
}

export interface QuizLeaderboardResponse {
  quiz_id: string;
  quiz_title: string;
  max_score: number;
  entries: LeaderboardEntry[];
}

const normalizeQuizItem = (raw: any): QuizItem => ({
  id: raw._id || raw.id || '',
  class_id: raw.classId || raw.class_id || '',
  class_name: raw.className || raw.class_name,
  title: raw.title || '',
  duration_minutes: raw.timeLimitMinutes ?? raw.duration_minutes ?? raw.time_limit_minutes ?? 30,
  due_date: raw.deadline || raw.due_date || raw.dueDate || '',
  question_count: raw.questionCount ?? raw.question_count ?? (Array.isArray(raw.questions) ? raw.questions.length : 0),
  status: raw.studentStatus || raw.status,
  score: raw.score,
  max_score: raw.maxScore ?? raw.max_score,
});

export const getTeacherQuizzesApi = async (classId?: string): Promise<QuizItem[]> => {
  const data = await api.get<any[]>(classId ? `/quiz/class/${classId}` : '/quiz');
  return (data || []).map(normalizeQuizItem);
};

export const getStudentQuizzesApi = async (classId?: string): Promise<QuizItem[]> => {
  try {
    const data = await api.get<any[]>(classId ? `/quiz/my?class_id=${classId}` : '/quiz/my');
    if (!Array.isArray(data)) return [];
    return data.map(normalizeQuizItem);
  } catch {
    return [];
  }
};

export const createQuizApi = async (payload: {
  class_id: string;
  title: string;
  duration_minutes: number;
  due_date: string;
  questions: QuestionDraft[];
}): Promise<QuizItem> => {
  return api.post<QuizItem>('/quiz', payload);
};

export const startQuizApi = async (quizId: string): Promise<QuizStartResponse> => {
  return api.post<QuizStartResponse>('/quiz/start', { quiz_id: quizId });
};

export const submitQuizAttemptApi = async (
  attemptId: string,
  answers: Array<{ question_id: string; selected_option_index: number }>
): Promise<QuizSubmitResult> => {
  return api.post<QuizSubmitResult>('/quiz/attempt', { attempt_id: attemptId, answers });
};

export const reportProgressApi = async (attemptId: string, answeredCount: number): Promise<void> => {
  try {
    await api.patch('/quiz/attempt/progress', { attempt_id: attemptId, answered_count: answeredCount });
  } catch { /* silent — progress is best-effort */ }
};

export const getTeacherQuizResultsApi = async (quizId: string): Promise<TeacherQuizResultsResponse> => {
  return api.get<TeacherQuizResultsResponse>(`/quiz/${quizId}/results`);
};

export const getQuizLeaderboardApi = async (quizId: string): Promise<QuizLeaderboardResponse> => {
  return api.get<QuizLeaderboardResponse>(`/quiz/${quizId}/leaderboard`);
};

export const getStudentQuizLeaderboardApi = async (quizId: string): Promise<QuizLeaderboardResponse> => {
  return api.get<QuizLeaderboardResponse>(`/quiz/${quizId}/leaderboard/siswa`);
};

