import { api } from '../config/api';

export interface ClubGroupChatItem {
  id: string;
  clubKey: string;
  pageName: string;
  icon: string;
  isEnabled?: boolean;
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
};
