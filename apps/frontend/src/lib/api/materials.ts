import { api } from './client';

export interface MaterialBlock {
  type: 'html' | 'video' | 'checkpoint' | 'fullhtml';
  content?: string;
  url?: string;
  caption?: string;
  question?: string;
  options?: string[];
  answer_index?: number;
}

export interface MaterialItem {
  id: string;
  class_id: string;
  class_name?: string;
  title: string;
  slug?: string;
  created_at: string;
  updated_at: string;
  block_count?: number;
}

export interface MaterialDetail {
  id: string;
  class_id: string;
  class_name?: string;
  title: string;
  slug?: string;
  created_at: string;
  blocks: MaterialBlock[];
}

const normalizeMaterialItem = (raw: any): MaterialItem => ({
  id: raw._id || raw.id,
  class_id: raw.classId || raw.class_id || '',
  class_name: raw.className || raw.class_name,
  title: raw.title || '',
  slug: raw.slug || undefined,
  created_at: raw.createdAt || raw.created_at || new Date().toISOString(),
  updated_at: raw.updatedAt || raw.updated_at || new Date().toISOString(),
  block_count: raw.block_count !== undefined ? raw.block_count : (Array.isArray(raw.blocks) ? raw.blocks.length : 0),
});

export const getTeacherMaterialsApi = async (classId?: string): Promise<MaterialItem[]> => {
  const res = await api.get<any[]>(classId ? `/materials/class/${classId}` : '/materials');
  return (res || []).map(normalizeMaterialItem);
};

export const getStudentMaterialsApi = async (classId?: string): Promise<MaterialItem[]> => {
  try {
    const res = await api.get<any[]>(classId ? `/materials/my?class_id=${classId}` : '/materials/my');
    if (!Array.isArray(res)) return [];
    return res.map(normalizeMaterialItem);
  } catch {
    return [];
  }
};

export const getMaterialByIdApi = async (idOrSlug: string): Promise<MaterialDetail> => {
  const raw = await api.get<any>(`/materials/${idOrSlug}`);
  return {
    id: raw._id || raw.id,
    class_id: raw.classId || raw.class_id || '',
    class_name: raw.className || raw.class_name,
    title: raw.title || '',
    slug: raw.slug || undefined,
    created_at: raw.createdAt || raw.created_at || new Date().toISOString(),
    blocks: raw.blocks || [],
  };
};

export const createMaterialApi = async (payload: {
  class_id: string;
  title: string;
  slug?: string;
  blocks: MaterialBlock[];
}): Promise<MaterialItem> => {
  const body = {
    classId: payload.class_id,
    class_id: payload.class_id,
    title: payload.title,
    slug: payload.slug,
    blocks: payload.blocks,
  };
  const res = await api.post<any>('/materials', body);
  return normalizeMaterialItem(res);
};

export const updateMaterialApi = async (
  id: string,
  payload: { title: string; slug?: string; blocks: MaterialBlock[] }
): Promise<MaterialItem> => {
  const res = await api.put<any>(`/materials/${id}`, payload);
  return normalizeMaterialItem(res);
};

export interface ActiveReaderItem {
  student_id: string;
  name: string;
  identifier: string;
  last_seen_at: string;
}

export interface ActiveReadersResponse {
  material_id: string;
  active_count: number;
  readers: ActiveReaderItem[];
}

export const recordMaterialPresenceApi = async (materialId: string): Promise<{ success: boolean }> => {
  try {
    return await api.post(`/materials/${materialId}/presence`, {});
  } catch {
    return { success: false };
  }
};

export const getActiveMaterialReadersApi = async (materialId: string): Promise<ActiveReadersResponse> => {
  try {
    return await api.get<ActiveReadersResponse>(`/materials/${materialId}/readers`);
  } catch {
    return { material_id: materialId, active_count: 0, readers: [] };
  }
};

export const deleteMaterialApi = async (id: string): Promise<void> => {
  return api.delete(`/materials/${id}`);
};
