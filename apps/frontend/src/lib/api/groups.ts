import { api } from './client';

export interface GroupMember {
  student_id: string;
  name: string;
  identifier: string;
  joined_at: string;
}

export interface GroupItem {
  id: string;
  class_id: string;
  name: string;
  max_members: number;
  leader_id: string;
  created_at: string;
  members: GroupMember[];
  member_count: number;
}

export const getGroupsByClassApi = async (classId: string): Promise<GroupItem[]> => {
  return api.get<GroupItem[]>(`/groups/class/${classId}`);
};

export const getMyGroupsApi = async (): Promise<GroupItem[]> => {
  try {
    const res = await api.get<GroupItem[]>('/groups/my');
    if (!Array.isArray(res)) return [];
    return res;
  } catch {
    return [];
  }
};

export const createGroupApi = async (classId: string, name: string, maxMembers = 5): Promise<GroupItem> => {
  return api.post<GroupItem>('/groups', { class_id: classId, name, max_members: maxMembers });
};

export const joinGroupApi = async (groupId: string): Promise<{ success: boolean }> => {
  return api.post('/groups/join', { group_id: groupId });
};

export const leaveGroupApi = async (groupId: string): Promise<{ success: boolean }> => {
  return api.post('/groups/leave', { group_id: groupId });
};

export const inviteStudentApi = async (groupId: string, studentId: string): Promise<{ invited: boolean }> => {
  return api.post('/groups/invite', { group_id: groupId, student_id: studentId });
};

export const updateGroupNameApi = async (groupId: string, name: string): Promise<GroupItem> => {
  return api.patch<GroupItem>(`/groups/${groupId}`, { name });
};
