import { api } from '../config/api';

export interface UserHelpQueryForAdmin {
  id: string;
  userId: string;
  schoolId: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
}

export const schoolAdminUserHelpService = {
  getAll: async (): Promise<UserHelpQueryForAdmin[]> => {
    const response = await api.get<UserHelpQueryForAdmin[]>('/school-admin/user-help');
    return response.data;
  },
};
