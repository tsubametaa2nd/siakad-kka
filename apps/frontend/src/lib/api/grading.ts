import { api } from './client';
import { getFileUrl } from '../config/api';

export interface GradeResult {
  id?: string;
  score: number;
  feedback?: string;
  syncedToSheet: boolean;
  synced_at?: string;
}

export interface StudentGradeItem {
  assignment_id: string;
  assignment_title: string;
  class_name: string;
  score: number;
  max_score: number;
  feedback?: string;
  graded_at: string;
  due_date: string;
}

export interface SubmissionGradingRow {
  submission_id?: string;
  student_id: string;
  student_name: string;
  identifier: string;
  group_id?: string;
  group_name?: string;
  group_members?: Array<{ student_id: string; name: string; identifier?: string; is_leader?: boolean }>;
  status: 'Belum' | 'Sudah' | 'Telat' | 'Dinilai';
  submitted_at?: string;
  files?: Array<{ name: string; url: string; size?: number; type?: string }>;
  links?: string[];
  content?: string | null;
  score?: number | null;
  feedback?: string | null;
  syncedToSheet?: boolean;
  graded_at?: string;
}

export interface AssignmentGradingResponse {
  assignment: {
    id: string;
    title: string;
    max_score: number;
    type: 'individual' | 'group';
    class_id: string;
    class_name: string;
    group_member_counts?: Record<string, number>;
  };
  submissions: SubmissionGradingRow[];
}

export interface ClassGradingSummary {
  class_id: string;
  class_name: string;
  spreadsheet_id?: string;
  total_assignments: number;
  ungraded_submissions: number;
  pending_sync_count: number;
}

export const gradeStudentApi = async (payload: {
  assignment_id: string;
  student_id: string;
  submission_id?: string;
  score: number;
  feedback?: string;
}): Promise<GradeResult> => {
  return api.post<GradeResult>('/grading', {
    assignmentId: payload.assignment_id,
    assignment_id: payload.assignment_id,
    studentId: payload.student_id,
    student_id: payload.student_id,
    score: payload.score,
    feedback: payload.feedback,
  });
};

export const getAssignmentGradingApi = async (assignmentId: string): Promise<AssignmentGradingResponse> => {
  const res = await api.get<AssignmentGradingResponse>(`/grading/assignment/${assignmentId}/grading`);
  if (res && res.submissions) {
    res.submissions = res.submissions.map((sub: any) => ({
      ...sub,
      files: (sub.files || []).map((f: any) => ({
        ...f,
        url: getFileUrl(f.url || f.signedUrl || f.path),
      })),
    }));
  }
  return res;
};

export const getStudentGradesApi = async (): Promise<StudentGradeItem[]> => {
  return api.get<StudentGradeItem[]>('/grading/my');
};

export const syncClassGradesApi = async (classId: string): Promise<{ synced_count: number; pending_count: number }> => {
  return api.post<{ synced_count: number; pending_count: number }>(`/grading/sync/${classId}`);
};

export const getGradingSummaryApi = async (): Promise<ClassGradingSummary[]> => {
  return api.get<ClassGradingSummary[]>('/grading/summary');
};
