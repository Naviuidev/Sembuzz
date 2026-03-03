import { api } from '../config/api';

export interface SchoolAdminLoginCredentials {
  identifier: string; // email or refNum
  password: string;
}

export interface SchoolAdminLoginResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    schoolId: string;
    schoolName: string;
    refNum: string;
    isFirstLogin: boolean;
    schoolDomain?: string | null;
    features: Array<{ code: string; name: string }>;
  };
}

export interface SchoolAdminUser {
  id: string;
  name: string;
  email: string;
  schoolId: string;
  schoolName: string;
  refNum: string;
  isFirstLogin: boolean;
  features: Array<{ code: string; name: string }>;
  schoolDomain?: string; // School domain for email validation
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const schoolAdminAuthService = {
  login: async (credentials: SchoolAdminLoginCredentials): Promise<SchoolAdminLoginResponse> => {
    const response = await api.post<SchoolAdminLoginResponse>('/school-admin/auth/login', credentials);
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const response = await api.post('/school-admin/auth/change-password', data);
    return response.data;
  },

  getMe: async (): Promise<SchoolAdminUser> => {
    const response = await api.get<SchoolAdminUser>('/school-admin/auth/me');
    return response.data;
  },
};
