import { api } from '../config/api';

export type ExternalCategory = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExternalCategoryPublic = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type ExternalAdminRow = {
  id: string;
  refNum: string;
  name: string;
  email: string;
  isActive: boolean;
  isFirstLogin: boolean;
  createdAt: string;
  categories: Array<{
    externalCategory: { id: string; name: string; isActive: boolean };
  }>;
};

export const externalAdminService = {
  listCategories: async (): Promise<ExternalCategory[]> => {
    const res = await api.get<ExternalCategory[]>('/super-admin/external/categories');
    return res.data;
  },

  createCategory: async (payload: {
    name: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<ExternalCategory> => {
    const res = await api.post<ExternalCategory>('/super-admin/external/categories', payload);
    return res.data;
  },

  updateCategory: async (
    id: string,
    payload: Partial<{ name: string; description: string; sortOrder: number; isActive: boolean }>,
  ): Promise<ExternalCategory> => {
    const res = await api.patch<ExternalCategory>(`/super-admin/external/categories/${id}`, payload);
    return res.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/super-admin/external/categories/${id}`);
  },

  listAdmins: async (): Promise<ExternalAdminRow[]> => {
    const res = await api.get<ExternalAdminRow[]>('/super-admin/external/admins');
    return res.data;
  },

  createAdmin: async (payload: {
    name: string;
    adminEmail: string;
    categoryIds: string[];
  }) => {
    const res = await api.post('/super-admin/external/admins', payload);
    return res.data;
  },

  updateAdmin: async (
    id: string,
    payload: { isActive?: boolean; categoryIds?: string[] },
  ): Promise<ExternalAdminRow> => {
    const res = await api.patch<ExternalAdminRow>(`/super-admin/external/admins/${id}`, payload);
    return res.data;
  },

  deleteAdmin: async (id: string): Promise<void> => {
    await api.delete(`/super-admin/external/admins/${id}`);
  },
};
