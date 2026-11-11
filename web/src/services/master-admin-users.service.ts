import { api } from '../config/api';
import type { PendingUser } from './school-admin-pending-users.service';
import type { SchoolStudent } from './school-admin-students.service';
import type { UserHelpQueryForAdmin } from './school-admin-user-help.service';

export const masterAdminUsersService = {
  listPending: async (schoolId: string): Promise<PendingUser[]> => {
    const response = await api.get<PendingUser[]>('/master-admin/users/pending', {
      params: { schoolId },
    });
    return response.data;
  },

  listApproved: async (schoolId: string): Promise<SchoolStudent[]> => {
    const response = await api.get<SchoolStudent[]>('/master-admin/users/approved', {
      params: { schoolId },
    });
    return response.data;
  },

  listAutomated: async (schoolId: string): Promise<SchoolStudent[]> => {
    const response = await api.get<SchoolStudent[]>('/master-admin/users/automated', {
      params: { schoolId },
    });
    return response.data;
  },

  listHelp: async (schoolId: string): Promise<UserHelpQueryForAdmin[]> => {
    const response = await api.get<UserHelpQueryForAdmin[]>('/master-admin/users/help', {
      params: { schoolId },
    });
    return response.data;
  },

  ban: async (schoolId: string, userId: string): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(`/master-admin/users/${userId}/ban`, {
      schoolId,
    });
    return response.data;
  },

  unban: async (schoolId: string, userId: string): Promise<{ success: boolean }> => {
    const response = await api.post<{ success: boolean }>(`/master-admin/users/${userId}/unban`, {
      schoolId,
    });
    return response.data;
  },
};
