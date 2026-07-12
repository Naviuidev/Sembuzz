import { api } from '../config/api';

export type ClubGroupMessageMode = 'admin_only' | 'members';

export interface CategoryAdminClubGroupChatRow {
  id: string;
  clubKey: string;
  pageName: string;
  icon: string;
  messageMode: ClubGroupMessageMode;
  approvedMemberCount: number;
}

export interface CategoryAdminClubGroupApprovedMember {
  id: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicUrl: string | null;
  };
}

export interface CategoryAdminClubGroupMessageItem {
  id: string;
  body: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profilePicUrl: string | null;
  } | null;
  categoryAdmin: {
    id: string;
    name: string;
  } | null;
}

export const categoryAdminClubGroupChatsService = {
  list: async (): Promise<CategoryAdminClubGroupChatRow[]> => {
    const { data } = await api.get<CategoryAdminClubGroupChatRow[]>('/category-admin/club-group-chats');
    return Array.isArray(data) ? data : [];
  },

  updateMessageMode: async (id: string, messageMode: ClubGroupMessageMode) => {
    const { data } = await api.patch(`/category-admin/club-group-chats/${id}/message-mode`, {
      messageMode,
    });
    return data;
  },

  listApprovedMembers: async (id: string): Promise<CategoryAdminClubGroupApprovedMember[]> => {
    const { data } = await api.get<CategoryAdminClubGroupApprovedMember[]>(
      `/category-admin/club-group-chats/${id}/approved-members`,
    );
    return Array.isArray(data) ? data : [];
  },

  listMessages: async (id: string): Promise<CategoryAdminClubGroupMessageItem[]> => {
    const { data } = await api.get<CategoryAdminClubGroupMessageItem[]>(
      `/category-admin/club-group-chats/${id}/messages`,
    );
    return Array.isArray(data) ? data : [];
  },

  sendMessage: async (id: string, body: string): Promise<CategoryAdminClubGroupMessageItem> => {
    const { data } = await api.post<CategoryAdminClubGroupMessageItem>(
      `/category-admin/club-group-chats/${id}/messages`,
      { body },
    );
    return data;
  },
};
