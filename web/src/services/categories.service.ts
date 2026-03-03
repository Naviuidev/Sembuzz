import { api } from '../config/api';

export interface Category {
  id: string;
  name: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  subcategories?: string[]; // Array of subcategory names
}

export interface CreateSubCategoryDto {
  name: string;
  categoryId: string;
}

export interface UpdateCategoryDto {
  name?: string;
}

export interface UpdateSubCategoryDto {
  name?: string;
}

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/school-admin/categories');
    return response.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/school-admin/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await api.post<Category>('/school-admin/categories', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCategoryDto): Promise<Category> => {
    const response = await api.put<Category>(`/school-admin/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/school-admin/categories/${id}`);
    return response.data;
  },

  // SubCategory methods
  createSubCategory: async (data: CreateSubCategoryDto): Promise<SubCategory> => {
    const response = await api.post<SubCategory>('/school-admin/categories/subcategories', data);
    return response.data;
  },

  updateSubCategory: async (id: string, data: UpdateSubCategoryDto): Promise<SubCategory> => {
    const response = await api.put<SubCategory>(`/school-admin/categories/subcategories/${id}`, data);
    return response.data;
  },

  deleteSubCategory: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/school-admin/categories/subcategories/${id}`);
    return response.data;
  },
};
