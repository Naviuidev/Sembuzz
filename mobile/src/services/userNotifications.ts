import { api } from '../config/api';

export const userNotificationsService = {
  async registerPushToken(token: string, platform: 'android' | 'ios' | 'web') {
    await api.post('/user/notifications/push-token', { token, platform });
  },

  async removePushToken(token: string) {
    await api.delete('/user/notifications/push-token', {
      params: { token },
    });
  },

  async getSubcategories(): Promise<{ subCategoryIds: string[] }> {
    const res = await api.get<{ subCategoryIds: string[] }>('/user/notifications/subcategories');
    return res.data ?? { subCategoryIds: [] };
  },

  async setSubcategories(subCategoryIds: string[]) {
    const res = await api.put<{ subCategoryIds: string[] }>('/user/notifications/subcategories', {
      subCategoryIds,
    });
    return res.data ?? { subCategoryIds: [] };
  },
};
