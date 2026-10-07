import { api } from '../config/api';

export interface ExternalAdminLoginCredentials {
  identifier: string;
  password: string;
}

export interface ExternalCategoryAssignment {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ExternalAdminUser {
  id: string;
  userId?: string;
  name: string;
  email: string;
  refNum: string;
  isFirstLogin: boolean;
  categories: ExternalCategoryAssignment[];
}

export interface ExternalAdminLoginResponse {
  access_token: string;
  user: ExternalAdminUser;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const externalAdminAuthService = {
  login: async (credentials: ExternalAdminLoginCredentials): Promise<ExternalAdminLoginResponse> => {
    const response = await api.post<ExternalAdminLoginResponse>('/external-admin/auth/login', credentials);
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const response = await api.post('/external-admin/auth/change-password', data);
    return response.data;
  },

  getMe: async (): Promise<ExternalAdminUser> => {
    const response = await api.get<ExternalAdminUser>('/external-admin/auth/me');
    return response.data;
  },
};
