import { api } from '../config/api';
import type { ExternalCategoryPublic } from './events';

export type ExternalPostRequestRow = {
  id: string;
  contentType?: string;
  title: string;
  description: string | null;
  externalLink: string | null;
  imageUrls: string | null;
  actionButtons?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  externalCategory: { id: string; name: string };
  companyName?: string | null;
  applyButtonUrl?: string | null;
  applyButtonEnabled?: boolean;
  saveJobButtonEnabled?: boolean;
  applicationMethod?: string | null;
  applicationTarget?: string | null;
  savedAt?: string;
};

export type SavedExternalPostRow = ExternalPostRequestRow & { savedAt?: string };

export async function getExternalFeedCategories(): Promise<ExternalCategoryPublic[]> {
  const response = await api.get<ExternalCategoryPublic[]>('/user/external-feed/categories');
  return Array.isArray(response.data) ? response.data : [];
}

export async function getExternalFeedPosts(categoryId?: string | null): Promise<ExternalPostRequestRow[]> {
  const params: Record<string, string> = {};
  const cid = categoryId?.trim();
  if (cid) params.categoryId = cid;
  const response = await api.get<ExternalPostRequestRow[]>('/user/external-feed/posts', { params });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getExternalFeedEngagement(postIds: string[]): Promise<{ savedByMe: string[] }> {
  const ids = postIds.filter(Boolean);
  if (ids.length === 0) return { savedByMe: [] };
  const response = await api.get<{ savedByMe: string[] }>('/user/external-feed/engagement', {
    params: { postIds: ids.join(',') },
  });
  return { savedByMe: response.data?.savedByMe ?? [] };
}

export async function toggleExternalFeedSave(postId: string): Promise<{ saved: boolean }> {
  const response = await api.post<{ saved: boolean }>(`/user/external-feed/posts/${postId}/save`);
  return response.data;
}

export async function getSavedExternalPosts(): Promise<SavedExternalPostRow[]> {
  const response = await api.get<SavedExternalPostRow[]>('/user/external-feed/saved');
  return Array.isArray(response.data) ? response.data : [];
}
