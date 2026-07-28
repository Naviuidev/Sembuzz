import { api } from '../config/api';

export interface AdsAdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdsAdminLoginResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    schoolId: string;
    schoolName: string;
    isFirstLogin: boolean;
  };
}

export interface AdsAdminUser {
  id: string;
  userId?: string;
  name: string;
  email: string;
  schoolId: string;
  schoolName: string;
  isFirstLogin: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const adsAdminAuthService = {
  login: async (credentials: AdsAdminLoginCredentials): Promise<AdsAdminLoginResponse> => {
    const response = await api.post<AdsAdminLoginResponse>('/ads-admin/auth/login', credentials);
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const response = await api.post('/ads-admin/auth/change-password', data);
    return response.data;
  },

  getMe: async (): Promise<AdsAdminUser> => {
    const response = await api.get<AdsAdminUser>('/ads-admin/auth/me');
    return response.data;
  },

  updateEmail: async (email: string): Promise<{ userId: string; email: string }> => {
    const response = await api.patch<{ userId: string; email: string }>('/ads-admin/auth/email', { email });
    return response.data;
  },
};
