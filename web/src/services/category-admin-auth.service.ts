import { api } from '../config/api';

export interface CategoryAdminLoginCredentials {
  email: string;
  password: string;
}

export interface CategoryAdminLoginResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    categoryId: string;
    categoryName: string;
    schoolId: string;
    schoolName: string;
    schoolDomain?: string | null;
    isFirstLogin: boolean;
  };
}

export interface CategoryAdminUser {
  id: string;
  name: string;
  email: string;
  categoryId: string;
  categoryName: string;
  schoolId: string;
  schoolName: string;
  schoolDomain?: string | null;
  isFirstLogin: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const categoryAdminAuthService = {
  login: async (credentials: CategoryAdminLoginCredentials): Promise<CategoryAdminLoginResponse> => {
    const response = await api.post<CategoryAdminLoginResponse>('/category-admin/auth/login', credentials);
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const response = await api.post('/category-admin/auth/change-password', data);
    return response.data;
  },

  getMe: async (): Promise<CategoryAdminUser> => {
    const response = await api.get<CategoryAdminUser>('/category-admin/auth/me');
    return response.data;
  },
};
