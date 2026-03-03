import { api } from '../config/api';

export interface SubCategoryAdmin {
  id: string;
  name: string;
  email: string;
  subCategoryId: string;
  categoryId: string;
  schoolId: string;
  isActive: boolean;
  isFirstLogin: boolean;
  createdAt: string;
  updatedAt: string;
  subCategory: {
    id: string;
    name: string;
  };
  subCategories?: Array<{
    id: string;
    subCategory: {
      id: string;
      name: string;
    };
  }>;
  category: {
    id: string;
    name: string;
  };
  school: {
    id: string;
    name: string;
    domain: string | null;
  };
}

export interface CreateSubCategoryAdminDto {
  name: string;
  email: string;
  subCategoryId: string;
}

export interface UpdateSubCategoryAdminSubCategoriesDto {
  subCategoryIds: string[];
}

export interface CreateSubCategoryAdminResponse extends SubCategoryAdmin {
  tempPassword: string;
  emailSent: boolean;
  emailError?: string | null;
}

// All requests go to /category-admin/* so the api interceptor attaches category-admin-token.
// Do not pass custom Authorization headers so the interceptor is the single source of truth (avoids race after login).
export const subCategoryAdminsService = {
  getAll: async (): Promise<SubCategoryAdmin[]> => {
    const response = await api.get<SubCategoryAdmin[]>('/category-admin/subcategory-admins');
    return response.data;
  },

  getById: async (id: string): Promise<SubCategoryAdmin> => {
    const response = await api.get<SubCategoryAdmin>(`/category-admin/subcategory-admins/${id}`);
    return response.data;
  },

  create: async (data: CreateSubCategoryAdminDto): Promise<CreateSubCategoryAdminResponse> => {
    const response = await api.post<CreateSubCategoryAdminResponse>('/category-admin/subcategory-admins', data);
    return response.data;
  },

  updateSubCategories: async (id: string, data: UpdateSubCategoryAdminSubCategoriesDto): Promise<SubCategoryAdmin> => {
    const response = await api.put<SubCategoryAdmin>(`/category-admin/subcategory-admins/${id}/subcategories`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/category-admin/subcategory-admins/${id}`);
    return response.data;
  },
};
