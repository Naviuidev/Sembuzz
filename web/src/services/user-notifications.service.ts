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

/** React Query key for unread badge (navbar + settings). */
export const USER_NOTIFICATIONS_UNREAD_QUERY_KEY = ['user', 'notifications', 'unread-count'] as const;

export const userNotificationsService = {
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
    const res = await api.put<{ ok: boolean }>('/user/notifications/read-all');
    return res.data ?? { ok: false };
  },

  async markRead(id: string): Promise<{ ok: boolean }> {
    const res = await api.put<{ ok: boolean }>(`/user/notifications/${id}/read`);
    return res.data ?? { ok: false };
  },
};
