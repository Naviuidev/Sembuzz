import { api } from '../config/api';

export interface BlogForCategoryAdmin {
  id: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  imageUrls: string | null;
  status: string;
  published: boolean;
  revertNotes: string | null;
  rejectNotes: string | null;
  createdAt: string;
  updatedAt: string;
  subCategory: { id: string; name: string };
  subCategoryAdmin: { id: string; name: string; email: string };
}

export interface UpdateBlogDto {
  title?: string;
  content?: string;
  coverImageUrl?: string | null;
}

export const categoryAdminBlogsService = {
  getPending: async (): Promise<BlogForCategoryAdmin[]> => {
    const response = await api.get<BlogForCategoryAdmin[]>(
      '/category-admin/blogs/pending',
    );
    return response.data;
  },

  getApproved: async (): Promise<BlogForCategoryAdmin[]> => {
    const response = await api.get<BlogForCategoryAdmin[]>(
      '/category-admin/blogs/approved',
    );
    return response.data;
  },

  update: async (id: string, dto: UpdateBlogDto): Promise<BlogForCategoryAdmin> => {
    const response = await api.put<BlogForCategoryAdmin>(
      `/category-admin/blogs/${id}`,
      dto,
    );
    return response.data;
  },

  revert: async (id: string, revertNotes: string): Promise<unknown> => {
    const response = await api.post(`/category-admin/blogs/${id}/revert`, {
      revertNotes,
    });
    return response.data;
  },

  reject: async (id: string, rejectNotes: string): Promise<unknown> => {
    const response = await api.post(`/category-admin/blogs/${id}/reject`, {
      rejectNotes,
    });
    return response.data;
  },

  approve: async (id: string): Promise<BlogForCategoryAdmin> => {
    // Valid JSON body avoids express 400 on empty body; { publish: true } matches older APIs too
    const response = await api.post<BlogForCategoryAdmin>(
      `/category-admin/blogs/${id}/approve`,
      { publish: true },
    );
    return response.data;
  },

  publishDraft: async (id: string): Promise<BlogForCategoryAdmin> => {
    const response = await api.post<BlogForCategoryAdmin>(
      `/category-admin/blogs/${id}/publish`,
    );
    return response.data;
  },

  deleteApproved: async (id: string): Promise<{ ok: boolean }> => {
    // POST fallback: some setups return 404 on DELETE; backend supports both
    const response = await api.post<{ ok: boolean }>(
      `/category-admin/blogs/${id}/remove-approved`,
      {},
    );
    return response.data;
  },
};
