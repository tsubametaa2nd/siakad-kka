import { api } from './client';

export interface SubmissionFile {
  name: string;
  size: number;
  url: string;
}

export interface SubmissionItem {
  id: string;
  assignment_id: string;
  student_id: string;
  version: number;
  status: 'Sudah' | 'Telat' | 'Dinilai';
  submitted_at: string;
  files: SubmissionFile[];
  links: string[];
  content?: string | null;
  score?: number | null;
  feedback?: string | null;
  is_group_leader?: boolean;
  submitted_by_name?: string;
}

export interface TeacherSubmissionRow {
  id?: string;
  student_id: string;
  student_name: string;
  identifier: string;
  status: 'Belum' | 'Sudah' | 'Telat' | 'Dinilai';
  submitted_at?: string;
  files?: SubmissionFile[];
  links?: string[];
  content?: string | null;
  score?: number | null;
  feedback?: string | null;
}

export interface TeacherSubmissionsResponse {
  total_students: number;
  submitted_count: number;
  submissions: TeacherSubmissionRow[];
}

const normalizeSubmissionItem = (raw: any): SubmissionItem | null => {
  if (!raw) return null;
  return {
    id: raw._id || raw.id || '',
    assignment_id: raw.assignmentId || raw.assignment_id || '',
    student_id: raw.studentId || raw.student_id || '',
    version: raw.version || 1,
    status: raw.status === 'graded' ? 'Dinilai' : raw.status === 'late' ? 'Telat' : 'Sudah',
    submitted_at: raw.createdAt || raw.submitted_at || new Date().toISOString(),
    files: raw.files || [],
    links: raw.links || [],
    content: raw.content || raw.text || raw.text_content || null,
    score: raw.score,
    feedback: raw.feedback,
    is_group_leader: raw.isGroupLeader || raw.is_group_leader,
    submitted_by_name: raw.submittedByName || raw.submitted_by_name,
  };
};

export const getMySubmissionApi = async (assignmentId: string): Promise<SubmissionItem | null> => {
  const res = await api.get<any>(`/submissions/my/${assignmentId}`);
  return normalizeSubmissionItem(res);
};

export const getAssignmentSubmissionsApi = async (assignmentId: string): Promise<TeacherSubmissionsResponse> => {
  return api.get<TeacherSubmissionsResponse>(`/submissions/assignment/${assignmentId}`);
};

export const submitAssignmentApi = async (
  assignmentId: string,
  files: File[],
  links: string[],
  content?: string,
  onProgress?: (percent: number) => void
): Promise<SubmissionItem> => {
  const formData = new FormData();
  formData.append('assignmentId', assignmentId);
  formData.append('assignment_id', assignmentId);
  formData.append('links', JSON.stringify(links));
  if (content !== undefined && content !== null) {
    formData.append('content', content);
  }
  files.forEach((f) => formData.append('files', f));
  const res = await api.upload<any>('/submissions', formData, onProgress, 'POST');
  return normalizeSubmissionItem(res)!;
};

export const updateSubmissionApi = async (
  id: string,
  version: number,
  files: File[],
  links: string[],
  content?: string,
  onProgress?: (percent: number) => void
): Promise<SubmissionItem> => {
  const formData = new FormData();
  formData.append('version', String(version));
  formData.append('links', JSON.stringify(links));
  if (content !== undefined && content !== null) {
    formData.append('content', content);
  }
  files.forEach((f) => formData.append('files', f));
  return api.upload<SubmissionItem>(`/submissions/${id}`, formData, onProgress, 'PUT');
};

export const deleteSubmissionApi = async (id: string): Promise<{ success: boolean }> => {
  return api.delete(`/submissions/${id}`);
};
