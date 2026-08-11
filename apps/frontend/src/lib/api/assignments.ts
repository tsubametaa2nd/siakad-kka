import { api } from './client';

export interface AssignmentAttachment {
  name: string;
  url: string;
  signedUrl?: string;
  path?: string;
  size?: number;
  mime?: string;
}

export interface AssignmentItem {
  id: string;
  class_id: string;
  class_name?: string;
  title: string;
  description: string;
  type: 'individual' | 'group';
  group_submission_mode?: 'representative' | 'individual';
  due_date: string;
  max_score: number;
  created_at?: string;
  status?: 'Belum' | 'Sudah' | 'Telat' | 'Dinilai';
  score?: number | null;
  group_name?: string;
  submission_count?: number;
  attachments?: AssignmentAttachment[];
}

const normalizeStatus = (rawStatus: any): 'Belum' | 'Sudah' | 'Telat' | 'Dinilai' => {
  if (!rawStatus) return 'Belum';
  const str = String(rawStatus).toLowerCase();
  if (str === 'dinilai' || str === 'graded') return 'Dinilai';
  if (str === 'sudah' || str === 'submitted') return 'Sudah';
  if (str === 'telat' || str === 'late') return 'Telat';
  return 'Belum';
};

const normalizeAssignmentItem = (raw: any): AssignmentItem => {
  if (!raw) return raw;
  return {
    id: raw._id || raw.id || '',
    class_id: raw.classId || raw.class_id || '',
    class_name: raw.className || raw.class_name,
    title: raw.title || '',
    description: raw.description || '',
    type: raw.type || 'individual',
    group_submission_mode: raw.groupSubmissionMode || raw.group_submission_mode,
    due_date: raw.deadline || raw.due_date || raw.dueDate || '',
    max_score: raw.maxScore !== undefined ? Number(raw.maxScore) : (raw.max_score !== undefined ? Number(raw.max_score) : 100),
    created_at: raw.createdAt || raw.created_at || new Date().toISOString(),
    status: normalizeStatus(raw.studentStatus || raw.status),
    score: raw.score,
    group_name: raw.groupName || raw.group_name,
    submission_count: raw.submissionCount || raw.submission_count,
    attachments: (raw.attachments || []).map((att: any) => ({
      name: att.name || 'berkas',
      url: att.url || att.signedUrl || att.path || '',
      signedUrl: att.signedUrl || att.url || '',
      path: att.path || '',
      size: att.size,
      mime: att.mime,
    })),
  };
};

export const getTeacherAssignmentsApi = async (classId?: string): Promise<AssignmentItem[]> => {
  const res = await api.get<any[]>(classId ? `/assignments/class/${classId}` : '/assignments');
  return (res || []).map(normalizeAssignmentItem);
};

export const getStudentAssignmentsApi = async (classId?: string): Promise<AssignmentItem[]> => {
  try {
    const res = await api.get<any[]>(classId ? `/assignments/my?class_id=${classId}` : '/assignments/my');
    if (!Array.isArray(res)) return [];
    return res.map(normalizeAssignmentItem);
  } catch {
    return [];
  }
};

export const getAssignmentByIdApi = async (id: string): Promise<AssignmentItem> => {
  const res = await api.get<any>(`/assignments/${id}`);
  return normalizeAssignmentItem(res);
};

export const createAssignmentApi = async (
  payload: {
    class_id: string;
    title: string;
    description: string;
    type: 'individual' | 'group';
    group_submission_mode?: 'representative' | 'individual';
    due_date: string;
    max_score: number;
    files?: File[];
  },
  onProgress?: (percent: number) => void
): Promise<AssignmentItem> => {
  if (payload.files && payload.files.length > 0) {
    const formData = new FormData();
    formData.append('classId', payload.class_id);
    formData.append('title', payload.title);
    formData.append('description', payload.description);
    formData.append('type', payload.type);
    if (payload.group_submission_mode) formData.append('groupSubmissionMode', payload.group_submission_mode);
    formData.append('deadline', payload.due_date);
    formData.append('maxScore', String(payload.max_score));
    payload.files.forEach((f) => formData.append('files', f));

    const res = await api.upload<any>('/assignments', formData, onProgress, 'POST');
    return normalizeAssignmentItem(res);
  }

  const res = await api.post<any>('/assignments', {
    classId: payload.class_id,
    title: payload.title,
    description: payload.description,
    type: payload.type,
    groupSubmissionMode: payload.group_submission_mode,
    deadline: payload.due_date,
    maxScore: payload.max_score,
  });
  return normalizeAssignmentItem(res);
};

export const updateAssignmentApi = async (
  id: string,
  payload: Partial<AssignmentItem> & { files?: File[]; existing_attachments?: AssignmentAttachment[] },
  onProgress?: (percent: number) => void
): Promise<AssignmentItem> => {
  if (payload.files && payload.files.length > 0) {
    const formData = new FormData();
    if (payload.title) formData.append('title', payload.title);
    if (payload.description) formData.append('description', payload.description);
    if (payload.type) formData.append('type', payload.type);
    if (payload.group_submission_mode) formData.append('groupSubmissionMode', payload.group_submission_mode);
    if (payload.due_date) formData.append('deadline', payload.due_date);
    if (payload.max_score !== undefined) formData.append('maxScore', String(payload.max_score));
    if (payload.existing_attachments) {
      formData.append('existing_attachments', JSON.stringify(payload.existing_attachments));
    }
    payload.files.forEach((f) => formData.append('files', f));

    const res = await api.upload<any>(`/assignments/${id}`, formData, onProgress, 'PUT');
    return normalizeAssignmentItem(res);
  }

  const res = await api.put<any>(`/assignments/${id}`, {
    ...payload,
    deadline: payload.due_date,
    maxScore: payload.max_score,
    existing_attachments: payload.existing_attachments ? JSON.stringify(payload.existing_attachments) : undefined,
  });
  return normalizeAssignmentItem(res);
};

export const deleteAssignmentApi = async (id: string, force = false): Promise<{ success: boolean }> => {
  return api.delete(`/assignments/${id}${force ? '?force=true' : ''}`);
};


