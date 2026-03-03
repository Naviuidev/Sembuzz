import { api } from '../config/api';

export interface SchoolAdminSubCategoryAdmin {
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
    category?: { id: string; name: string };
  };
  subCategories?: Array<{
    id: string;
    subCategory: { id: string; name: string };
  }>;
  category: { id: string; name: string };
  school: { id: string; name: string; domain: string | null };
}

export const schoolAdminSubcategoryAdminsService = {
  getAll: async (): Promise<SchoolAdminSubCategoryAdmin[]> => {
    const response = await api.get<SchoolAdminSubCategoryAdmin[]>('/school-admin/subcategory-admins');
    return response.data;
  },

  ban: async (id: string): Promise<SchoolAdminSubCategoryAdmin> => {
    const response = await api.post<SchoolAdminSubCategoryAdmin>(`/school-admin/subcategory-admins/${id}/ban`);
    return response.data;
  },

  unban: async (id: string): Promise<SchoolAdminSubCategoryAdmin> => {
    const response = await api.post<SchoolAdminSubCategoryAdmin>(`/school-admin/subcategory-admins/${id}/unban`);
    return response.data;
  },
};
