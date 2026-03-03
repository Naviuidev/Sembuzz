import { api } from '../config/api';

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
