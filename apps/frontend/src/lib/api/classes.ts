import { api } from './client';

export interface ClassItem {
  id: string;
  name: string;
  level: string;
  academicYear: string;
  spreadsheetId?: string;
  scheduleDay?: string;
  scheduleTime?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  studentCount?: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  identifier: string;
  role?: string;
  enrolledAt?: string;
}

const normalizeClass = (raw: any): ClassItem => ({
  id: raw.id,
  name: raw.name,
  level: raw.grade_level || raw.gradeLevel || raw.level || '',
  academicYear: raw.academic_year || raw.academicYear || '',
  spreadsheetId: raw.spreadsheet_id || raw.spreadsheetId || '',
  scheduleDay: raw.schedule_day || raw.scheduleDay || '',
  scheduleTime: raw.schedule_time || raw.scheduleTime || '',
  startTime: raw.start_time || raw.startTime || '',
  endTime: raw.end_time || raw.endTime || '',
  room: raw.room || '',
  studentCount: raw.student_count || raw.studentCount,
});

export const getTeacherClassesApi = async (): Promise<ClassItem[]> => {
  const res = await api.get<any[]>('/classes');
  return (res || []).map(normalizeClass);
};

export const createClassApi = async (payload: { name: string; level: string; academicYear: string; spreadsheetId?: string; scheduleDay?: string; scheduleTime?: string; startTime?: string; endTime?: string; room?: string }): Promise<ClassItem> => {
  const body = {
    name: payload.name,
    gradeLevel: payload.level,
    academicYear: payload.academicYear,
    spreadsheetId: payload.spreadsheetId || undefined,
    scheduleDay: payload.scheduleDay || undefined,
    scheduleTime: payload.scheduleTime || undefined,
    startTime: payload.startTime || undefined,
    endTime: payload.endTime || undefined,
    room: payload.room || undefined,
  };
  const res = await api.post<any>('/classes', body);
  return normalizeClass(res);
};

export const getClassByIdApi = async (id: string): Promise<ClassItem> => {
  const res = await api.get<any>(`/classes/${id}`);
  return normalizeClass(res);
};

export const updateClassApi = async (id: string, payload: Partial<ClassItem>): Promise<ClassItem> => {
  const body = {
    name: payload.name,
    gradeLevel: payload.level,
    academicYear: payload.academicYear,
    spreadsheetId: payload.spreadsheetId,
    scheduleDay: payload.scheduleDay,
    scheduleTime: payload.scheduleTime,
    startTime: payload.startTime,
    endTime: payload.endTime,
    room: payload.room,
  };
  const res = await api.put<any>(`/classes/${id}`, body);
  return normalizeClass(res);
};

export const getClassStudentsApi = async (classId: string): Promise<StudentProfile[]> => {
  const res = await api.get<any[]>(`/classes/${classId}/students`);
  return (res || []).map((s: any) => ({
    id: s.id,
    name: s.name || s.full_name || s.fullName || '',
    identifier: s.identifier || '',
    role: s.role,
    enrolledAt: s.enrolledAt || s.enrolled_at,
  }));
};

export const enrollStudentsApi = async (classId: string, studentIds: string[]): Promise<{ enrolled: number }> => {
  return api.post(`/classes/${classId}/enroll`, { studentIds });
};

export const getStudentClassesApi = async (): Promise<ClassItem[]> => {
  try {
    const res = await api.get<any[]>('/classes/my');
    if (!Array.isArray(res)) return [];
    return res.map(normalizeClass);
  } catch {
    return [];
  }
};

export const createStudentAccountApi = async (payload: { name: string; identifier: string; password: string }): Promise<StudentProfile> => {
  return api.post<StudentProfile>('/auth/accounts', { ...payload, role: 'student' });
};

export const getExistingStudentsApi = async (): Promise<StudentProfile[]> => {
  const res = await api.get<any[]>('/auth/students');
  return (res || []).map((s: any) => ({
    id: s.id,
    name: s.name || s.full_name || s.fullName || '',
    identifier: s.identifier || '',
    role: s.role,
  }));
};

export interface SpreadsheetImportResult {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  enrolled: number;
  details: {
    created: string[];
    skipped: string[];
    failed: { nis: string; reason: string }[];
  };
}

export const importFromSpreadsheetApi = async (classId: string, spreadsheetUrl: string): Promise<SpreadsheetImportResult> => {
  return api.post<SpreadsheetImportResult>(`/classes/${classId}/import-spreadsheet`, { spreadsheetUrl });
};
