import { api } from '../config/api';
import type {
  Category,
  CreateCategoryDto,
  CreateSubCategoryDto,
  SubCategory,
  UpdateCategoryDto,
  UpdateSubCategoryDto,
} from './categories.service';

export const masterAdminCategoriesService = {
  list: async (schoolId: string): Promise<Category[]> => {
    const response = await api.get<Category[]>('/master-admin/categories', { params: { schoolId } });
    return response.data;
  },

  getById: async (schoolId: string, id: string): Promise<Category> => {
    const response = await api.get<Category>(`/master-admin/categories/${id}`, { params: { schoolId } });
    return response.data;
  },

  create: async (schoolId: string, data: CreateCategoryDto): Promise<Category> => {
    const response = await api.post<Category>('/master-admin/categories', { schoolId, ...data });
    return response.data;
  },

  update: async (schoolId: string, id: string, data: UpdateCategoryDto): Promise<Category> => {
    const response = await api.put<Category>(`/master-admin/categories/${id}`, data, { params: { schoolId } });
    return response.data;
  },

  delete: async (schoolId: string, id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/master-admin/categories/${id}`, {
      params: { schoolId },
    });
    return response.data;
  },

  createSubCategory: async (schoolId: string, data: CreateSubCategoryDto): Promise<SubCategory> => {
    const response = await api.post<SubCategory>('/master-admin/categories/subcategories', {
      schoolId,
      ...data,
    });
    return response.data;
  },

  updateSubCategory: async (schoolId: string, id: string, data: UpdateSubCategoryDto): Promise<SubCategory> => {
    const response = await api.put<SubCategory>(`/master-admin/categories/subcategories/${id}`, data, {
      params: { schoolId },
    });
    return response.data;
  },

  deleteSubCategory: async (schoolId: string, id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/master-admin/categories/subcategories/${id}`, {
      params: { schoolId },
    });
    return response.data;
  },
};
