import { api } from '../config/api';
import type { CreateSchoolAdminPostDto, SchoolAdminPost } from './school-admin-posts.service';
import type { MasterAdminSchoolPostRow } from './master-admin-schools.service';

export type MasterAdminPostCategory = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

export type CreateMasterAdminPostDto = CreateSchoolAdminPostDto & {
  schoolId: string;
};

export type PublishMasterAdminPostDto = {
  schoolId: string;
  categoryId: string;
  subCategoryId: string;
};

export type MasterAdminPostDetail = {
  id: string;
  schoolId: string;
  categoryId: string;
  subCategoryId: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  eventDate: string | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  eventLocation: string | null;
  actionButtons: string | null;
  commentsEnabled: boolean;
  imageUrls: string | null;
  status: string;
  subCategory: {
    id: string;
    name: string;
    category: { id: string; name: string };
  };
  school: { id: string; name: string };
};

export type UpdateMasterAdminPostDto = {
  schoolId: string;
  title?: string;
  description?: string;
  externalLink?: string;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventLocation?: string;
  actionButtons?: { label: string; url: string }[];
  commentsEnabled?: boolean;
  imageUrls?: string[];
};

export const masterAdminPostsService = {
  list: async (schoolId?: string): Promise<MasterAdminSchoolPostRow[]> => {
    const response = await api.get<MasterAdminSchoolPostRow[]>('/master-admin/posts', {
      params: schoolId ? { schoolId } : undefined,
    });
    return response.data;
  },

  getCategoriesForSchool: async (schoolId: string): Promise<MasterAdminPostCategory[]> => {
    const response = await api.get<MasterAdminPostCategory[]>(
      `/master-admin/posts/schools/${schoolId}/categories`,
    );
    return response.data;
  },

  createPost: async (dto: CreateMasterAdminPostDto): Promise<MasterAdminSchoolPostRow> => {
    const response = await api.post<MasterAdminSchoolPostRow>('/master-admin/posts', dto);
    return response.data;
  },

  publishPost: async (postId: string, dto: PublishMasterAdminPostDto): Promise<MasterAdminSchoolPostRow> => {
    const response = await api.post<MasterAdminSchoolPostRow>(`/master-admin/posts/${postId}/publish`, dto);
    return response.data;
  },

  getPost: async (schoolId: string, postId: string): Promise<MasterAdminPostDetail> => {
    const response = await api.get<MasterAdminPostDetail>(`/master-admin/posts/${postId}`, {
      params: { schoolId },
    });
    return response.data;
  },

  updatePost: async (postId: string, dto: UpdateMasterAdminPostDto): Promise<SchoolAdminPost> => {
    const response = await api.patch<SchoolAdminPost>(`/master-admin/posts/${postId}`, dto);
    return response.data;
  },

  deletePost: async (schoolId: string, postId: string): Promise<{ deleted: boolean }> => {
    const response = await api.delete<{ deleted: boolean }>(`/master-admin/posts/${postId}`, {
      params: { schoolId },
    });
    return response.data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post<{ url: string }>('/master-admin/posts/upload-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
