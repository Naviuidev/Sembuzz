import { api } from '../config/api';

export type MasterAdminRole = 'master_admin' | 'school_master_admin';

export interface MasterAdminLoginCredentials {
  identifier: string;
  password: string;
}

export interface MasterAdminUser {
  id: string;
  role: MasterAdminRole;
  loginId: string;
  name: string;
  email: string | null;
  schoolId: string | null;
  schoolName: string | null;
  allowedPortalSections: string[] | null;
  isFirstLogin: boolean;
}

export interface MasterAdminLoginResponse {
  access_token: string;
  user: MasterAdminUser;
}

export const masterAdminAuthService = {
  login: async (credentials: MasterAdminLoginCredentials): Promise<MasterAdminLoginResponse> => {
    const response = await api.post<MasterAdminLoginResponse>('/master-admin/auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<MasterAdminUser> => {
    const response = await api.get<MasterAdminUser>('/master-admin/auth/me');
    return response.data;
  },

  setPassword: async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<MasterAdminLoginResponse> => {
    const response = await api.post<MasterAdminLoginResponse>('/master-admin/auth/set-password', payload);
    return response.data;
  },
};
