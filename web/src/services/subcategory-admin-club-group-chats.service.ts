import { api } from '../config/api';

export type ClubGroupMessageMode = 'admin_only' | 'members';

export interface SubCategoryAdminClubGroupChatRow {
  id: string;
  clubKey: string;
  pageName: string;
  icon: string;
  messageMode: ClubGroupMessageMode;
  approvedMemberCount: number;
}

export interface SubCategoryAdminClubGroupApprovedMember {
  id: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicUrl: string | null;
  };
}

export interface SubCategoryAdminClubGroupMessageItem {
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
  subCategoryAdmin: {
    id: string;
    name: string;
  } | null;
}

export const subCategoryAdminClubGroupChatsService = {
  list: async (): Promise<SubCategoryAdminClubGroupChatRow[]> => {
    const { data } = await api.get<SubCategoryAdminClubGroupChatRow[]>(
      '/subcategory-admin/club-group-chats',
    );
    return Array.isArray(data) ? data : [];
  },

  listApprovedMembers: async (id: string): Promise<SubCategoryAdminClubGroupApprovedMember[]> => {
    const { data } = await api.get<SubCategoryAdminClubGroupApprovedMember[]>(
      `/subcategory-admin/club-group-chats/${id}/approved-members`,
    );
    return Array.isArray(data) ? data : [];
  },

  listMessages: async (id: string): Promise<SubCategoryAdminClubGroupMessageItem[]> => {
    const { data } = await api.get<SubCategoryAdminClubGroupMessageItem[]>(
      `/subcategory-admin/club-group-chats/${id}/messages`,
    );
    return Array.isArray(data) ? data : [];
  },

  sendMessage: async (id: string, body: string): Promise<SubCategoryAdminClubGroupMessageItem> => {
    const { data } = await api.post<SubCategoryAdminClubGroupMessageItem>(
      `/subcategory-admin/club-group-chats/${id}/messages`,
      { body },
    );
    return data;
  },
};
