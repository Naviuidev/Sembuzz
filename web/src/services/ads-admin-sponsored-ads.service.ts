import { api } from '../config/api';

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

export const adsAdminSponsoredAdsService = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/ads-admin/sponsored-ads/upload-image', formData);
    return response.data;
  },

  list: async () => {
    const response = await api.get('/ads-admin/sponsored-ads');
    return response.data;
  },

  getAnalytics: async (params: { dateFrom?: string; dateTo?: string; sponsoredAdId?: string }) => {
    const response = await api.get<SponsoredAdsAnalyticsResponse>('/ads-admin/sponsored-ads/analytics', { params });
    return response.data;
  },

  create: async (data: {
    title?: string;
    description?: string;
    imageUrls?: string;
    externalLink?: string;
    startAt: string;
    endAt: string;
  }) => {
    const response = await api.post('/ads-admin/sponsored-ads', data);
    return response.data;
  },

  update: async (
    id: string,
    data: { startAt: string; endAt: string; externalLink?: string; title?: string; description?: string; imageUrls?: string },
  ) => {
    const response = await api.patch(`/ads-admin/sponsored-ads/${id}`, data);
    return response.data;
  },

  endNow: async (id: string) => {
    const response = await api.patch(`/ads-admin/sponsored-ads/${id}/end-now`);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/ads-admin/sponsored-ads/${id}`);
  },
};
