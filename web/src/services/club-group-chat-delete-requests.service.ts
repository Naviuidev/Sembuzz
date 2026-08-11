import { api } from '../config/api';

export interface ClubGroupChatDeleteRequestItem {
  id: string;
  schoolId: string;
  clubGroupChatId: string;
  note: string | null;
  status: 'pending' | 'approved' | 'declined';
  reviewedByRole: string | null;
  reviewedByAdminId: string | null;
  declineReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  subCategoryAdmin: { id: string; name: string; email: string };
  clubGroupChat: { id: string; pageName: string; icon: string };
}

export const subCategoryAdminClubGroupChatDeleteRequestsService = {
  listMine: async (): Promise<ClubGroupChatDeleteRequestItem[]> => {
    const { data } = await api.get<ClubGroupChatDeleteRequestItem[]>(
      '/subcategory-admin/club-group-chat-delete-requests',
    );
    return Array.isArray(data) ? data : [];
  },

  create: async (clubGroupChatId: string, note?: string): Promise<ClubGroupChatDeleteRequestItem> => {
    const { data } = await api.post<ClubGroupChatDeleteRequestItem>(
      '/subcategory-admin/club-group-chat-delete-requests',
      { clubGroupChatId, note },
    );
    return data;
  },
};

export const categoryAdminClubGroupChatDeleteRequestsService = {
  list: async (status?: 'pending' | 'approved' | 'declined'): Promise<ClubGroupChatDeleteRequestItem[]> => {
    const { data } = await api.get<ClubGroupChatDeleteRequestItem[]>(
      '/category-admin/club-group-chat-delete-requests',
      { params: status ? { status } : undefined },
    );
    return Array.isArray(data) ? data : [];
  },
  approve: async (id: string) => {
    const { data } = await api.post(`/category-admin/club-group-chat-delete-requests/${id}/approve`);
    return data;
  },
  decline: async (id: string, reason?: string) => {
    const { data } = await api.post(`/category-admin/club-group-chat-delete-requests/${id}/decline`, {
      reason,
    });
    return data;
  },
};

export const schoolAdminClubGroupChatDeleteRequestsService = {
  list: async (status?: 'pending' | 'approved' | 'declined'): Promise<ClubGroupChatDeleteRequestItem[]> => {
    const { data } = await api.get<ClubGroupChatDeleteRequestItem[]>(
      '/school-admin/club-group-chat-delete-requests',
      { params: status ? { status } : undefined },
    );
    return Array.isArray(data) ? data : [];
  },
  approve: async (id: string) => {
    const { data } = await api.post(`/school-admin/club-group-chat-delete-requests/${id}/approve`);
    return data;
  },
  decline: async (id: string, reason?: string) => {
    const { data } = await api.post(`/school-admin/club-group-chat-delete-requests/${id}/decline`, {
      reason,
    });
    return data;
  },
};
