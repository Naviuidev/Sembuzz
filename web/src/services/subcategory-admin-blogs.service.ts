import { api } from '../config/api';

export interface BlogRow {
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
}

export type CreateBlogContentBlock =
  | { type: 'heading'; value: string; cols?: number }
  | { type: 'paragraph'; value: string; cols?: number }
  | { type: 'image'; imageUrl: string; cols?: number; alt?: string }
  | {
      type: 'heading_para';
      heading: string;
      paragraph: string;
      cols?: number;
    };

export interface CreateBlogDto {
  subCategoryId: string;
  title: string;
  content?: string;
  coverImageUrl?: string;
  imageUrls?: string[];
  heroTitle?: string;
  heroParagraph?: string;
  heroButtonText?: string;
  heroButtonLink?: string;
  contentBlocks?: CreateBlogContentBlock[];
}

export const subcategoryAdminBlogsService = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    // Same path as event image upload (?for=blog → blog folder). Ensures same API host as rest of app.
    const response = await api.post<{ url: string }>(
      '/subcategory-admin/events/upload-image?for=blog',
      formData,
    );
    return response.data;
  },

  create: async (dto: CreateBlogDto): Promise<BlogRow> => {
    const response = await api.post<BlogRow>('/subcategory-admin/events/blog', dto);
    return response.data;
  },

  getPending: async (): Promise<BlogRow[]> => {
    const response = await api.get<BlogRow[]>('/subcategory-admin/blogs/pending');
    return response.data;
  },

  getReverted: async (): Promise<BlogRow[]> => {
    const response = await api.get<BlogRow[]>('/subcategory-admin/blogs/reverted');
    return response.data;
  },

  getRejected: async (): Promise<BlogRow[]> => {
    const response = await api.get<BlogRow[]>('/subcategory-admin/blogs/rejected');
    return response.data;
  },

  getApproved: async (): Promise<BlogRow[]> => {
    const response = await api.get<BlogRow[]>('/subcategory-admin/blogs/approved');
    return response.data;
  },
};
