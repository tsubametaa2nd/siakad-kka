// Fitur: skema validasi quiz
import { t } from "elysia";

export const questionSchema = t.Object({
  // camelCase (original)
  text: t.Optional(t.String()),
  answer: t.Optional(t.Integer({ minimum: 0 })),
  points: t.Optional(t.Numeric({ minimum: 1 })),
  // snake_case (frontend)
  question: t.Optional(t.String()),
  answer_index: t.Optional(t.Integer({ minimum: 0 })),
  weight: t.Optional(t.Numeric({ minimum: 1 })),
  // shared
  options: t.Array(t.String({ minLength: 1 }), { minItems: 2 }),
});

export const createQuizSchema = t.Object({
  // camelCase (original)
  classId: t.Optional(t.String()),
  timeLimitMinutes: t.Optional(t.Numeric({ minimum: 1 })),
  deadline: t.Optional(t.String()),
  // snake_case (frontend)
  class_id: t.Optional(t.String()),
  duration_minutes: t.Optional(t.Numeric({ minimum: 1 })),
  due_date: t.Optional(t.String()),
  // shared
  title: t.String({ minLength: 1 }),
  questions: t.Array(questionSchema, { minItems: 1 }),
});

export const startQuizSchema = t.Object({
  quiz_id: t.String({ minLength: 1 }),
});

export const attemptQuizSchema = t.Object({
  attempt_id: t.String({ minLength: 1 }),
  answers: t.Array(t.Object({
    question_id: t.String(),
    selected_option_index: t.Integer({ minimum: 0 }),
  })),
});

export type CreateQuizBody = typeof createQuizSchema.static;
export type StartQuizBody = typeof startQuizSchema.static;
export type AttemptQuizBody = typeof attemptQuizSchema.static;
