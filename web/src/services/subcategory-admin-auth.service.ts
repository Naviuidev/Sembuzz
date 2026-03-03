import { api } from '../config/api';

export interface SubCategoryAdminLoginCredentials {
  email: string;
  password: string;
}

export interface SubCategoryAdminLoginResponse {
  access_token: string;
  user: SubCategoryAdminUser;
}

export interface SubCategoryAdminUser {
  id: string;
  name: string;
  email: string;
  subCategoryId: string;
  subCategoryName: string;
  subCategoryNames?: string[]; // Array of all assigned subcategory names
  subCategories?: Array<{
    id: string;
    name: string;
    categoryId?: string;
    categoryName?: string;
  }>; // Array of all assigned subcategories
  categoriesWithSubcategories?: Array<{
    id: string;
    name: string;
    subcategories: Array<{
      id: string;
      name: string;
    }>;
  }>; // Categories grouped with their subcategories
  categoryId: string;
  categoryName: string;
  categoryAdmin?: {
    id: string;
    name: string;
    email: string;
  } | null; // Category admin who manages the category
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

export const subCategoryAdminAuthService = {
  login: async (credentials: SubCategoryAdminLoginCredentials): Promise<SubCategoryAdminLoginResponse> => {
    const response = await api.post<SubCategoryAdminLoginResponse>('/subcategory-admin/auth/login', credentials);
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ message: string }> => {
    const response = await api.post('/subcategory-admin/auth/change-password', data);
    return response.data;
  },

  getMe: async (): Promise<SubCategoryAdminUser> => {
    const response = await api.get<SubCategoryAdminUser>('/subcategory-admin/auth/me');
    return response.data;
  },
};
