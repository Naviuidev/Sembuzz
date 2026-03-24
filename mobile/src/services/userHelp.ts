import { api } from '../config/api';

export interface UserHelpQueryItem {
  id: string;
  userId: string;
  schoolId: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
}

export const userHelpService = {
  create: async (message: string): Promise<UserHelpQueryItem> => {
    const response = await api.post<UserHelpQueryItem>('/user/help', { message });
    return response.data;
  },

  getMyQueries: async (): Promise<UserHelpQueryItem[]> => {
    const response = await api.get<UserHelpQueryItem[]>('/user/help');
    return response.data;
  },
};
