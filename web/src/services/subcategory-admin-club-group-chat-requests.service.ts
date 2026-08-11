import { api } from '../config/api';

export interface SubCategoryAdminClubOption {
  key: string;
  pageName: string;
  icon: string;
  accountIds: string[];
  socialLinkCount: number;
  hasGroupChat: boolean;
  hasPendingRequest: boolean;
}

export interface ClubGroupChatRequestItem {
  id: string;
  schoolId: string;
  clubKey: string;
  pageName: string;
  icon: string;
  note: string | null;
  status: 'pending' | 'approved' | 'declined';
  reviewedByRole: string | null;
  reviewedByAdminId: string | null;
  declineReason: string | null;
  clubGroupChatId: string | null;
  createdAt: string;
  reviewedAt: string | null;
  subCategoryAdmin: {
    id: string;
    name: string;
    email: string;
  };
}

export const subCategoryAdminClubGroupChatRequestsService = {
  listClubs: async (): Promise<SubCategoryAdminClubOption[]> => {
    const { data } = await api.get<SubCategoryAdminClubOption[]>(
      '/subcategory-admin/club-group-chat-requests/clubs',
    );
    return Array.isArray(data) ? data : [];
  },

  listMine: async (): Promise<ClubGroupChatRequestItem[]> => {
    const { data } = await api.get<ClubGroupChatRequestItem[]>(
      '/subcategory-admin/club-group-chat-requests',
    );
    return Array.isArray(data) ? data : [];
  },

  create: async (payload: {
    clubKey: string;
    pageName: string;
    clubIcon: string;
    groupChatIcon: string;
    note?: string;
  }): Promise<ClubGroupChatRequestItem> => {
    const { data } = await api.post<ClubGroupChatRequestItem>(
      '/subcategory-admin/club-group-chat-requests',
      payload,
    );
    return data;
  },

  uploadGroupChatIcon: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string }>(
      '/subcategory-admin/club-group-chat-requests/upload-icon',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },
};
