import { api } from '../config/api';

export type StudentChatGroupVisibility = 'public' | 'private';

export interface StudentChatGroupRequestItem {
  id: string;
  schoolId: string;
  name: string;
  description: string | null;
  visibility: StudentChatGroupVisibility;
  status: 'pending' | 'approved' | 'declined';
  reviewedByRole: string | null;
  reviewedByAdminId: string | null;
  declineReason: string | null;
  studentChatGroupId: string | null;
  createdAt: string;
  reviewedAt: string | null;
  subCategoryAdmin: {
    id: string;
    name: string;
    email: string;
  };
}

export const subCategoryAdminStudentChatGroupRequestsService = {
  listMine: async (): Promise<StudentChatGroupRequestItem[]> => {
    const { data } = await api.get<StudentChatGroupRequestItem[]>(
      '/subcategory-admin/student-chat-group-requests',
    );
    return Array.isArray(data) ? data : [];
  },

  create: async (payload: {
    name: string;
    description?: string;
    visibility?: StudentChatGroupVisibility;
  }): Promise<StudentChatGroupRequestItem> => {
    const { data } = await api.post<StudentChatGroupRequestItem>(
      '/subcategory-admin/student-chat-group-requests',
      payload,
    );
    return data;
  },
};
