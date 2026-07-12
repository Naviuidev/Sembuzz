import { api } from '../config/api';
import type { ClubGroupChatRequestItem } from './subcategory-admin-club-group-chat-requests.service';

export const schoolAdminClubGroupChatRequestsService = {
  list: async (status?: 'pending' | 'approved' | 'declined'): Promise<ClubGroupChatRequestItem[]> => {
    const { data } = await api.get<ClubGroupChatRequestItem[]>(
      '/school-admin/club-group-chat-requests',
      { params: status ? { status } : undefined },
    );
    return Array.isArray(data) ? data : [];
  },

  approve: async (id: string): Promise<ClubGroupChatRequestItem> => {
    const { data } = await api.post<ClubGroupChatRequestItem>(
      `/school-admin/club-group-chat-requests/${id}/approve`,
    );
    return data;
  },

  decline: async (id: string, reason?: string): Promise<ClubGroupChatRequestItem> => {
    const { data } = await api.post<ClubGroupChatRequestItem>(
      `/school-admin/club-group-chat-requests/${id}/decline`,
      { reason },
    );
    return data;
  },
};
