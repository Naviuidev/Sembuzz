import { api } from '../config/api';
import type { DirectChatUser, DirectMessageItem } from './user-direct-chats.service';

export interface SubCategoryAdminDirectConversationRow {
  id: string;
  status: string;
  lastMessageAt: string;
  messageCount: number;
  userOne: DirectChatUser;
  userTwo: DirectChatUser;
  lastMessagePreview: string | null;
}

export const subCategoryAdminDirectChatsService = {
  getSettings: async (): Promise<{ isEnabled: boolean }> => {
    const { data } = await api.get<{ isEnabled: boolean }>(
      '/subcategory-admin/direct-chats/settings',
    );
    return data;
  },

  updateSettings: async (isEnabled: boolean) => {
    const { data } = await api.patch('/subcategory-admin/direct-chats/settings', { isEnabled });
    return data;
  },

  list: async (): Promise<SubCategoryAdminDirectConversationRow[]> => {
    const { data } = await api.get<SubCategoryAdminDirectConversationRow[]>(
      '/subcategory-admin/direct-chats',
    );
    return Array.isArray(data) ? data : [];
  },

  listMessages: async (
    conversationId: string,
  ): Promise<{
    conversation: {
      id: string;
      userOne: DirectChatUser;
      userTwo: DirectChatUser;
    };
    messages: DirectMessageItem[];
  }> => {
    const { data } = await api.get(`/subcategory-admin/direct-chats/${conversationId}/messages`);
    return data;
  },
};
