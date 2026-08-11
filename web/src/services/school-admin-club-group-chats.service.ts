import { api } from '../config/api';

export type ClubGroupMessageMode = 'admin_only' | 'members';

export interface ClubGroupChatItem {
  id: string;
  clubKey: string;
  pageName: string;
  icon: string;
  isEnabled?: boolean;
  messageMode?: ClubGroupMessageMode;
  approvedMemberCount?: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: { messages: number };
}

export interface UpsertClubGroupChatDto {
  clubKey: string;
  pageName: string;
  icon: string;
}

export const schoolAdminClubGroupChatsService = {
  list: async (): Promise<ClubGroupChatItem[]> => {
    const { data } = await api.get<ClubGroupChatItem[]>('/school-admin/club-group-chats');
    return data;
  },

  findByClubKey: async (clubKey: string): Promise<ClubGroupChatItem | null> => {
    try {
      const { data } = await api.get<ClubGroupChatItem>(
        `/school-admin/club-group-chats/by-club/${encodeURIComponent(clubKey)}`,
      );
      return data;
    } catch {
      return null;
    }
  },

  upsert: async (dto: UpsertClubGroupChatDto): Promise<ClubGroupChatItem> => {
    const { data } = await api.post<ClubGroupChatItem>('/school-admin/club-group-chats', dto);
    return data;
  },

  updateMessageMode: async (id: string, messageMode: ClubGroupMessageMode) => {
    const { data } = await api.patch(`/school-admin/club-group-chats/${id}/message-mode`, {
      messageMode,
    });
    return data;
  },
};
