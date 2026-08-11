import { api } from '../config/api';

export const schoolAdminDirectChatsService = {
  getSettings: async (): Promise<{ isEnabled: boolean }> => {
    const { data } = await api.get<{ isEnabled: boolean }>('/school-admin/direct-chats/settings');
    return data;
  },

  updateSettings: async (isEnabled: boolean) => {
    const { data } = await api.patch('/school-admin/direct-chats/settings', { isEnabled });
    return data;
  },
};
