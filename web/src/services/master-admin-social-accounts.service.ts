import { api } from '../config/api';
import type {
  CreateSocialAccountDto,
} from './school-admin-social-accounts.service';

export type { CreateSocialAccountDto };

export type MasterAdminSocialAccount = {
  id: string;
  schoolId: string;
  platformId: string;
  platformName: string;
  pageName: string;
  icon: string;
  link: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMasterAdminSocialAccountDto = CreateSocialAccountDto & {
  schoolId: string;
};

export type UpdateMasterAdminSocialAccountDto = {
  schoolId: string;
  pageName?: string;
  icon?: string;
  link?: string;
};

export const masterAdminSocialAccountsService = {
  list: async (schoolId: string): Promise<MasterAdminSocialAccount[]> => {
    const response = await api.get<MasterAdminSocialAccount[]>('/master-admin/social-accounts', {
      params: { schoolId },
    });
    return response.data;
  },

  getOne: async (schoolId: string, id: string): Promise<MasterAdminSocialAccount> => {
    const response = await api.get<MasterAdminSocialAccount>(`/master-admin/social-accounts/${id}`, {
      params: { schoolId },
    });
    return response.data;
  },

  create: async (dto: CreateMasterAdminSocialAccountDto): Promise<MasterAdminSocialAccount> => {
    const response = await api.post<MasterAdminSocialAccount>('/master-admin/social-accounts', dto);
    return response.data;
  },

  createBulk: async (
    schoolId: string,
    accounts: CreateSocialAccountDto[],
  ): Promise<MasterAdminSocialAccount[]> => {
    const response = await api.post<MasterAdminSocialAccount[]>('/master-admin/social-accounts/bulk', {
      schoolId,
      accounts,
    });
    return response.data;
  },

  update: async (id: string, dto: UpdateMasterAdminSocialAccountDto): Promise<MasterAdminSocialAccount> => {
    const response = await api.patch<MasterAdminSocialAccount>(`/master-admin/social-accounts/${id}`, dto);
    return response.data;
  },

  delete: async (schoolId: string, id: string): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/master-admin/social-accounts/${id}`, {
      params: { schoolId },
    });
    return response.data;
  },

  uploadIcon: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post<{ url: string }>('/master-admin/social-accounts/upload-icon', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
