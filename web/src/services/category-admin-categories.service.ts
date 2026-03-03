import { api } from '../config/api';

export interface CategoryWithSubcategories {
  id: string;
  name: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  subcategories: SubCategory[];
  school?: {
    id: string;
    name: string;
    domain: string | null;
  };
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export const categoryAdminCategoriesService = {
  getMyCategory: async (): Promise<CategoryWithSubcategories> => {
    const response = await api.get<CategoryWithSubcategories>('/category-admin/categories/my-category');
    return response.data;
  },

  /** All categories this category admin has access to (primary + added via school admin). */
  getMyCategories: async (): Promise<CategoryWithSubcategories[]> => {
    const response = await api.get<CategoryWithSubcategories[]>('/category-admin/categories/my-categories');
    return response.data;
  },
};
