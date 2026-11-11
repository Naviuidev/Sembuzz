import { api } from '../config/api';
import type { CreateBlogContentBlock, CreateBlogDto } from './subcategory-admin-blogs.service';

export type MasterAdminBlogDetail = {
  id: string;
  schoolId: string;
  categoryId: string;
  subCategoryId: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  heroTitle: string | null;
  heroParagraph: string | null;
  heroButtonText: string | null;
  heroButtonLink: string | null;
  contentBlocks: CreateBlogContentBlock[] | null;
  status: string;
  published: boolean;
  publishedAt: string | null;
  subCategory: {
    id: string;
    name: string;
    category: { id: string; name: string };
  };
  school: { id: string; name: string };
};

export type MasterAdminSaveBlogDto = CreateBlogDto & {
  publish?: boolean;
};

export const masterAdminBlogsService = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/master-admin/blogs/upload-image', formData);
    return response.data;
  },

  getBlog: async (schoolId: string, blogId: string): Promise<MasterAdminBlogDetail> => {
    const response = await api.get<MasterAdminBlogDetail>(`/master-admin/blogs/${blogId}`, {
      params: { schoolId },
    });
    return response.data;
  },

  create: async (schoolId: string, data: MasterAdminSaveBlogDto): Promise<MasterAdminBlogDetail> => {
    const response = await api.post<MasterAdminBlogDetail>('/master-admin/blogs', {
      schoolId,
      ...data,
    });
    return response.data;
  },

  update: async (
    schoolId: string,
    blogId: string,
    data: Partial<MasterAdminSaveBlogDto>,
  ): Promise<MasterAdminBlogDetail> => {
    const response = await api.patch<MasterAdminBlogDetail>(`/master-admin/blogs/${blogId}`, data, {
      params: { schoolId },
    });
    return response.data;
  },

  publish: async (schoolId: string, blogId: string): Promise<MasterAdminBlogDetail> => {
    const response = await api.post<MasterAdminBlogDetail>(
      `/master-admin/blogs/${blogId}/publish`,
      {},
      { params: { schoolId } },
    );
    return response.data;
  },
};
