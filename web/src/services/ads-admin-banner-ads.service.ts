import { api } from '../config/api';

export interface BannerAdWithMetrics {
  id: string;
  imageUrl: string;
  externalLink: string | null;
  startAt: string;
  endAt: string;
  views: number;
  clicks: number;
}

export interface BannerAdsAnalyticsResponse {
  ads: BannerAdWithMetrics[];
  totals: { views: number; clicks: number };
  byDay: Array<{ date: string; views: number; clicks: number }>;
}

export const adsAdminBannerAdsService = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/ads-admin/banner-ads/upload-image', formData);
    return response.data;
  },

  list: async () => {
    const response = await api.get('/ads-admin/banner-ads');
    return response.data;
  },

  getAnalytics: async (params: { dateFrom?: string; dateTo?: string; bannerAdId?: string }) => {
    const response = await api.get<BannerAdsAnalyticsResponse>('/ads-admin/banner-ads/analytics', { params });
    return response.data;
  },

  create: async (data: { imageUrl: string; externalLink?: string; startAt: string; endAt: string }) => {
    const response = await api.post('/ads-admin/banner-ads', data);
    return response.data;
  },

  update: async (id: string, data: { startAt: string; endAt: string; externalLink?: string }) => {
    const response = await api.patch(`/ads-admin/banner-ads/${id}`, data);
    return response.data;
  },

  endNow: async (id: string) => {
    const response = await api.patch(`/ads-admin/banner-ads/${id}/end-now`);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/ads-admin/banner-ads/${id}`);
  },
};
