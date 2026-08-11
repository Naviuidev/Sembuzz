import { api } from '../config/api';

export interface SchoolAdminIdentityRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  isFirstLogin?: boolean;
  createdAt?: string;
}

export const schoolAdminAdsAdminsService = {
  getAll: async (): Promise<SchoolAdminIdentityRow[]> => {
    const { data } = await api.get<SchoolAdminIdentityRow[]>('/school-admin/ads-admins');
    return data;
  },

  updateEmail: async (id: string, email: string): Promise<SchoolAdminIdentityRow> => {
    const { data } = await api.patch<SchoolAdminIdentityRow>(`/school-admin/ads-admins/${id}/email`, {
      email,
    });
    return data;
  },
};
