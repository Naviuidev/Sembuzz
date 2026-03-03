import { api } from '../config/api';

export interface BannerAdCreated {
  id: string;
  imageUrl: string;
  startAt: string;
  endAt: string;
  categoryId: string;
  schoolId: string;
  createdAt: string;
}

export const categoryAdminBannerAdsService = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/category-admin/banner-ads/upload-image', formData);
    return response.data;
  },

  create: async (payload: { imageUrl: string; externalLink?: string; startAt: string; endAt: string }): Promise<BannerAdCreated> => {
    const response = await api.post<BannerAdCreated>('/category-admin/banner-ads', payload);
    return response.data;
  },

  list: async (): Promise<BannerAdListItem[]> => {
    const response = await api.get<BannerAdListItem[]>('/category-admin/banner-ads');
    return Array.isArray(response.data) ? response.data : [];
  },

  getAnalytics: async (params: { dateFrom?: string; dateTo?: string; bannerAdId?: string }) => {
    const response = await api.get<BannerAdsAnalyticsResponse>('/category-admin/banner-ads/analytics', { params });
    return response.data;
  },

  updateBannerAd: async (
    id: string,
    payload: { startAt: string; endAt: string; externalLink?: string },
  ) => {
    const response = await api.patch<BannerAdListItem>(`/category-admin/banner-ads/${id}`, payload);
    return response.data;
  },

  endBannerAdNow: async (id: string) => {
    const response = await api.patch<BannerAdListItem>(`/category-admin/banner-ads/${id}/end-now`);
    return response.data;
  },

  deleteBannerAd: async (id: string) => {
    await api.delete(`/category-admin/banner-ads/${id}`);
  },
};

export interface BannerAdListItem {
  id: string;
  imageUrl: string;
  externalLink: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
}

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
