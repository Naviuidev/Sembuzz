import { api } from '../config/api';

export interface CategoryAdmin {
  id: string;
  name: string;
  email: string;
  categoryId: string;
  schoolId: string;
  isActive: boolean;
  isFirstLogin: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
  categories?: Array<{
    id: string;
    category: {
      id: string;
      name: string;
    };
  }>;
  school: {
    id: string;
    name: string;
    domain: string | null;
  };
}

export interface CreateCategoryAdminDto {
  name: string;
  email: string;
  categoryId: string;
}

export interface UpdateCategoryAdminCategoriesDto {
  categoryIds: string[];
}

export interface CreateCategoryAdminResponse extends CategoryAdmin {
  tempPassword: string;
  emailSent: boolean;
  emailError?: string | null;
}

export const categoryAdminsService = {
  getAll: async (): Promise<CategoryAdmin[]> => {
    const response = await api.get<CategoryAdmin[]>('/school-admin/category-admins');
    return response.data;
  },

  getById: async (id: string): Promise<CategoryAdmin> => {
    const response = await api.get<CategoryAdmin>(`/school-admin/category-admins/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryAdminDto): Promise<CreateCategoryAdminResponse> => {
    const response = await api.post<CreateCategoryAdminResponse>('/school-admin/category-admins', data);
    return response.data;
  },

  updateCategories: async (id: string, data: UpdateCategoryAdminCategoriesDto): Promise<CategoryAdmin> => {
    const response = await api.put<CategoryAdmin>(`/school-admin/category-admins/${id}/categories`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/school-admin/category-admins/${id}`);
    return response.data;
  },

  ban: async (id: string): Promise<CategoryAdmin> => {
    const response = await api.post<CategoryAdmin>(`/school-admin/category-admins/${id}/ban`);
    return response.data;
  },

  unban: async (id: string): Promise<CategoryAdmin> => {
    const response = await api.post<CategoryAdmin>(`/school-admin/category-admins/${id}/unban`);
    return response.data;
  },
};
