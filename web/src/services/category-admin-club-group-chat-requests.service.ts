import { api } from '../config/api';
import type { ClubGroupChatRequestItem } from './subcategory-admin-club-group-chat-requests.service';

export const categoryAdminClubGroupChatRequestsService = {
  list: async (status?: 'pending' | 'approved' | 'declined'): Promise<ClubGroupChatRequestItem[]> => {
    const { data } = await api.get<ClubGroupChatRequestItem[]>(
      '/category-admin/club-group-chat-requests',
      { params: status ? { status } : undefined },
    );
    return Array.isArray(data) ? data : [];
  },

  approve: async (id: string): Promise<ClubGroupChatRequestItem> => {
    const { data } = await api.post<ClubGroupChatRequestItem>(
      `/category-admin/club-group-chat-requests/${id}/approve`,
    );
    return data;
  },

  decline: async (id: string, reason?: string): Promise<ClubGroupChatRequestItem> => {
    const { data } = await api.post<ClubGroupChatRequestItem>(
      `/category-admin/club-group-chat-requests/${id}/decline`,
      { reason },
    );
    return data;
  },
};
