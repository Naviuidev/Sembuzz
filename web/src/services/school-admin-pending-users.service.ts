import { api } from '../config/api';

export interface PendingUser {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  profilePicUrl: string | null;
  verificationDocUrl: string | null;
  additionalVerificationDocUrl: string | null;
  createdAt: string;
}

export const schoolAdminPendingUsersService = {
  getPendingUsers: async (): Promise<PendingUser[]> => {
    const response = await api.get<PendingUser[]>('/school-admin/pending-users');
    return response.data;
  },

  approve: async (userId: string): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(
      `/school-admin/pending-users/${userId}/approve`,
    );
    return response.data;
  },

  reject: async (userId: string): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(
      `/school-admin/pending-users/${userId}/reject`,
    );
    return response.data;
  },

  requestDocs: async (userId: string): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(
      `/school-admin/pending-users/${userId}/request-docs`,
    );
    return response.data;
  },

  askReupload: async (
    userId: string,
    message: string,
    type: 'reupload' | 'additional' = 'reupload',
  ): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(
      `/school-admin/pending-users/${userId}/ask-reupload`,
      { message, type },
    );
    return response.data;
  },
};
