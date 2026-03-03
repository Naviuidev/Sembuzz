import { api } from '../config/api';

export interface SchoolSocialAccountItem {
  id: string;
  schoolId: string;
  platformId: string;
  platformName: string;
  pageName: string;
  icon: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialAccountDto {
  platformId: string;
  platformName: string;
  pageName: string;
  icon: string;
  link: string;
}

export const schoolAdminSocialAccountsService = {
  list: async (): Promise<SchoolSocialAccountItem[]> => {
    const response = await api.get<SchoolSocialAccountItem[]>('/school-admin/social-accounts');
    return response.data;
  },

  uploadIcon: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/school-admin/social-accounts/upload-icon', formData);
    return response.data;
  },

  createBulk: async (accounts: CreateSocialAccountDto[]): Promise<SchoolSocialAccountItem[]> => {
    const response = await api.post<SchoolSocialAccountItem[]>('/school-admin/social-accounts/bulk', {
      accounts,
    });
    return response.data;
  },

  update: async (
    id: string,
    data: { pageName?: string; icon?: string; link?: string },
  ): Promise<SchoolSocialAccountItem> => {
    const response = await api.patch<SchoolSocialAccountItem>(`/school-admin/social-accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/school-admin/social-accounts/${id}`);
    return response.data;
  },
};
