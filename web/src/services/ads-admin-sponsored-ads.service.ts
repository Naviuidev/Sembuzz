import { api } from '../config/api';

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
