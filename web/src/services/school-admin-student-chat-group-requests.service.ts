import { api } from '../config/api';
import type { StudentChatGroupRequestItem } from './subcategory-admin-student-chat-group-requests.service';

export const schoolAdminStudentChatGroupRequestsService = {
  list: async (status?: 'pending' | 'approved' | 'declined'): Promise<StudentChatGroupRequestItem[]> => {
    const { data } = await api.get<StudentChatGroupRequestItem[]>(
      '/school-admin/student-chat-group-requests',
      { params: status ? { status } : undefined },
    );
    return Array.isArray(data) ? data : [];
  },

  approve: async (id: string): Promise<StudentChatGroupRequestItem> => {
    const { data } = await api.post<StudentChatGroupRequestItem>(
      `/school-admin/student-chat-group-requests/${id}/approve`,
    );
    return data;
  },

  decline: async (id: string, reason?: string): Promise<StudentChatGroupRequestItem> => {
    const { data } = await api.post<StudentChatGroupRequestItem>(
      `/school-admin/student-chat-group-requests/${id}/decline`,
      { reason },
    );
    return data;
  },
};
