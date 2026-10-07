import { api } from '../config/api';
import type { ExternalCategoryPublic } from './public-events.service';
import type { ExternalPostRequestRow } from './external-admin-post-requests.service';

export type SavedExternalPostRow = ExternalPostRequestRow & { savedAt?: string };

export const userExternalFeedService = {
  getCategories: async (): Promise<ExternalCategoryPublic[]> => {
    const res = await api.get<ExternalCategoryPublic[]>('/user/external-feed/categories');
    return Array.isArray(res.data) ? res.data : [];
  },

  getPosts: async (categoryId?: string | null): Promise<ExternalPostRequestRow[]> => {
    const params: Record<string, string> = {};
    const cid = categoryId?.trim();
    if (cid) params.categoryId = cid;
    const res = await api.get<ExternalPostRequestRow[]>('/user/external-feed/posts', { params });
    return Array.isArray(res.data) ? res.data : [];
  },

  getSavedPosts: async (): Promise<SavedExternalPostRow[]> => {
    const res = await api.get<SavedExternalPostRow[]>('/user/external-feed/saved');
    return Array.isArray(res.data) ? res.data : [];
  },

  getEngagement: async (postIds: string[]): Promise<{ savedByMe: string[] }> => {
    const ids = postIds.filter(Boolean);
    if (ids.length === 0) return { savedByMe: [] };
    const res = await api.get<{ savedByMe: string[] }>('/user/external-feed/engagement', {
      params: { postIds: ids.join(',') },
    });
    return { savedByMe: res.data?.savedByMe ?? [] };
  },

  toggleSave: async (postId: string): Promise<{ saved: boolean }> => {
    const res = await api.post<{ saved: boolean }>(`/user/external-feed/posts/${postId}/save`);
    return res.data;
  },
};
