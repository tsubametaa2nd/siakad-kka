import { api } from './client';

export interface UserProfile {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  identifier: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export const loginApi = async (identifier: string, password: string): Promise<LoginResponse> => {
  return api.post<LoginResponse>('/auth/login', { identifier, username: identifier, password });
};

export const meApi = async (): Promise<UserProfile> => {
  return api.get<UserProfile>('/auth/me');
};

export const updateProfileApi = async (fullName: string): Promise<UserProfile> => {
  return api.patch<UserProfile>('/auth/profile', { fullName });
};

export const changePasswordApi = async (
  oldPassword: string,
  newPassword: string
): Promise<{ updated: boolean; message: string }> => {
  return api.post<{ updated: boolean; message: string }>('/auth/change-password', {
    oldPassword,
    newPassword,
  });
};
