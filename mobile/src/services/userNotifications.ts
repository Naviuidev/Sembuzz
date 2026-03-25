import { api } from '../config/api';

export type UserNotificationInboxItem = {
  id: string;
  eventId?: string | null;
  schoolId?: string | null;
  schoolName?: string | null;
  schoolLogoUrl?: string | null;
  title: string;
  body: string;
  deliveredAt: string;
  readAt?: string | null;
};

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

  async getInbox(): Promise<UserNotificationInboxItem[]> {
    const res = await api.get<unknown>('/user/notifications/inbox');
    const data = res.data;
    if (Array.isArray(data)) return data as UserNotificationInboxItem[];
    if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
      return (data as { items: UserNotificationInboxItem[] }).items;
    }
    return [];
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const res = await api.get<{ unreadCount: number }>('/user/notifications/unread-count');
    return res.data ?? { unreadCount: 0 };
  },

  async markAllRead(): Promise<{ ok: boolean }> {
    try {
      const res = await api.put<{ ok: boolean }>('/user/notifications/read-all');
      return res.data ?? { ok: false };
    } catch {
      return { ok: false };
    }
  },

  async markRead(id: string): Promise<{ ok: boolean }> {
    try {
      const res = await api.put<{ ok: boolean }>(`/user/notifications/${id}/read`);
      return res.data ?? { ok: false };
    } catch {
      return { ok: false };
    }
  },
};
