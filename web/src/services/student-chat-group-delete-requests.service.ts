import { api } from '../config/api';

export interface StudentChatGroupDeleteRequestItem {
  id: string;
  schoolId: string;
  studentChatGroupId: string;
  note: string | null;
  status: 'pending' | 'approved' | 'declined';
  reviewedByRole: string | null;
  reviewedByAdminId: string | null;
  declineReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  subCategoryAdmin: { id: string; name: string; email: string };
  studentChatGroup: { id: string; name: string; visibility: string };
}

export const subCategoryAdminStudentChatGroupDeleteRequestsService = {
  listMine: async (): Promise<StudentChatGroupDeleteRequestItem[]> => {
    const { data } = await api.get<StudentChatGroupDeleteRequestItem[]>(
      '/subcategory-admin/student-chat-group-delete-requests',
    );
    return Array.isArray(data) ? data : [];
  },

  create: async (
    studentChatGroupId: string,
    note?: string,
  ): Promise<StudentChatGroupDeleteRequestItem> => {
    const { data } = await api.post<StudentChatGroupDeleteRequestItem>(
      '/subcategory-admin/student-chat-group-delete-requests',
      { studentChatGroupId, note },
    );
    return data;
  },
};

export const categoryAdminStudentChatGroupDeleteRequestsService = {
  list: async (status?: 'pending' | 'approved' | 'declined'): Promise<StudentChatGroupDeleteRequestItem[]> => {
    const { data } = await api.get<StudentChatGroupDeleteRequestItem[]>(
      '/category-admin/student-chat-group-delete-requests',
      { params: status ? { status } : undefined },
    );
    return Array.isArray(data) ? data : [];
  },
  approve: async (id: string) => {
    const { data } = await api.post(`/category-admin/student-chat-group-delete-requests/${id}/approve`);
    return data;
  },
  decline: async (id: string, reason?: string) => {
    const { data } = await api.post(`/category-admin/student-chat-group-delete-requests/${id}/decline`, {
      reason,
    });
    return data;
  },
};

export const schoolAdminStudentChatGroupDeleteRequestsService = {
  list: async (status?: 'pending' | 'approved' | 'declined'): Promise<StudentChatGroupDeleteRequestItem[]> => {
    const { data } = await api.get<StudentChatGroupDeleteRequestItem[]>(
      '/school-admin/student-chat-group-delete-requests',
      { params: status ? { status } : undefined },
    );
    return Array.isArray(data) ? data : [];
  },
  approve: async (id: string) => {
    const { data } = await api.post(`/school-admin/student-chat-group-delete-requests/${id}/approve`);
    return data;
  },
  decline: async (id: string, reason?: string) => {
    const { data } = await api.post(`/school-admin/student-chat-group-delete-requests/${id}/decline`, {
      reason,
    });
    return data;
  },
};
