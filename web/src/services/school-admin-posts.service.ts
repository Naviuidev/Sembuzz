import { api } from '../config/api';

export interface SchoolAdminPostSubCategory {
  id: string;
  name: string;
  category: { id: string; name: string };
}

export interface SchoolAdminPostAuthor {
  id: string;
  name: string;
  email: string;
}

export interface SchoolAdminPost {
  id: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  commentsEnabled: boolean;
  imageUrls: string | null;
  status: string;
  revertNotes: string | null;
  createdAt: string;
  updatedAt: string;
  subCategory: SchoolAdminPostSubCategory;
  subCategoryAdmin: SchoolAdminPostAuthor;
}

export const schoolAdminPostsService = {
  getPosts: async (): Promise<SchoolAdminPost[]> => {
    const response = await api.get<SchoolAdminPost[]>('/school-admin/posts');
    return response.data;
  },

  getPost: async (id: string): Promise<SchoolAdminPost> => {
    const response = await api.get<SchoolAdminPost>(`/school-admin/posts/${id}`);
    return response.data;
  },

  deletePost: async (id: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/school-admin/posts/${id}`);
    return response.data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/school-admin/posts/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updatePost: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      externalLink?: string;
      commentsEnabled?: boolean;
      imageUrls?: string[];
    },
  ): Promise<SchoolAdminPost> => {
    const response = await api.patch<SchoolAdminPost>(`/school-admin/posts/${id}`, data);
    return response.data;
  },
};
