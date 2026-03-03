import { api } from '../config/api';

export interface SponsoredAdCreated {
  id: string;
  title: string | null;
  description: string | null;
  imageUrls: string | null;
  externalLink: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface SponsoredAdListItem {
  id: string;
  title: string | null;
  description: string | null;
  imageUrls: string | null;
  externalLink: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface SponsoredAdWithMetrics {
  id: string;
  title: string | null;
  imageUrls: string | null;
  externalLink: string | null;
  startAt: string;
  endAt: string;
  views: number;
  clicks: number;
}

export interface SponsoredAdsAnalyticsResponse {
  ads: SponsoredAdWithMetrics[];
  totals: { views: number; clicks: number };
  byDay: Array<{ date: string; views: number; clicks: number }>;
}

export const categoryAdminSponsoredAdsService = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/category-admin/sponsored-ads/upload-image', formData);
    return response.data;
  },

  create: async (payload: {
    title?: string;
    description?: string;
    imageUrls?: string;
    externalLink?: string;
    startAt: string;
    endAt: string;
  }): Promise<SponsoredAdCreated> => {
    const response = await api.post<SponsoredAdCreated>('/category-admin/sponsored-ads', payload);
    return response.data;
  },

  list: async (): Promise<SponsoredAdListItem[]> => {
    const response = await api.get<SponsoredAdListItem[]>('/category-admin/sponsored-ads');
    return Array.isArray(response.data) ? response.data : [];
  },

  getAnalytics: async (params: { dateFrom?: string; dateTo?: string; sponsoredAdId?: string }) => {
    const response = await api.get<SponsoredAdsAnalyticsResponse>('/category-admin/sponsored-ads/analytics', { params });
    return response.data;
  },

  updateSponsoredAd: async (
    id: string,
    payload: { startAt: string; endAt: string; externalLink?: string; title?: string; description?: string; imageUrls?: string },
  ) => {
    const response = await api.patch<SponsoredAdListItem>(`/category-admin/sponsored-ads/${id}`, payload);
    return response.data;
  },

  endSponsoredAdNow: async (id: string) => {
    const response = await api.patch<SponsoredAdListItem>(`/category-admin/sponsored-ads/${id}/end-now`);
    return response.data;
  },

  deleteSponsoredAd: async (id: string) => {
    await api.delete(`/category-admin/sponsored-ads/${id}`);
  },
};
