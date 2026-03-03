import { api } from '../config/api';

export interface UpcomingPostItem {
  id: string;
  schoolId: string;
  categoryId: string;
  subCategoryId: string;
  title: string;
  description: string | null;
  imageUrls: string | null;
  scheduledTo: string;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string };
  subCategory?: { id: string; name: string };
  school?: { id: string; name: string; image: string | null };
}

export interface CreateUpcomingPostDto {
  title: string;
  description?: string;
  categoryId: string;
  subCategoryId: string;
  imageUrls?: string[];
  scheduledTo: string; // YYYY-MM-DD (mandatory)
}

export const schoolAdminUpcomingPostsService = {
  list: async (): Promise<UpcomingPostItem[]> => {
    const res = await api.get<UpcomingPostItem[]>('/school-admin/upcoming-posts');
    return res.data;
  },

  getOne: async (id: string): Promise<UpcomingPostItem> => {
    const res = await api.get<UpcomingPostItem>(`/school-admin/upcoming-posts/${id}`);
    return res.data;
  },

  create: async (dto: CreateUpcomingPostDto): Promise<UpcomingPostItem> => {
    const res = await api.post<UpcomingPostItem>('/school-admin/upcoming-posts', dto);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<CreateUpcomingPostDto>,
  ): Promise<UpcomingPostItem> => {
    const res = await api.patch<UpcomingPostItem>(`/school-admin/upcoming-posts/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<{ deleted: boolean }> => {
    const res = await api.delete<{ deleted: boolean }>(`/school-admin/upcoming-posts/${id}`);
    return res.data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ url: string }>('/school-admin/upcoming-posts/upload-image', formData);
    return res.data;
  },
};
