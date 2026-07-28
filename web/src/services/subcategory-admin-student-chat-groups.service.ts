import { api } from '../config/api';

export type StudentChatGroupVisibility = 'public' | 'private';

export interface SubCategoryAdminStudentChatGroupRow {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  visibility: StudentChatGroupVisibility;
  memberCount: number;
  lastMessageAt: string;
  createdAt: string;
}

export interface SubCategoryAdminStudentRow {
  id: string;
  name: string;
  email: string;
  profilePicUrl: string | null;
}

export interface SubCategoryAdminStudentGroupMemberRow {
  role: string;
  joinedAt: string;
  user: SubCategoryAdminStudentRow;
}

export const subCategoryAdminStudentChatGroupsService = {
  list: async (): Promise<SubCategoryAdminStudentChatGroupRow[]> => {
    const { data } = await api.get<SubCategoryAdminStudentChatGroupRow[]>(
      '/subcategory-admin/student-chat-groups',
    );
    return Array.isArray(data) ? data : [];
  },

  searchStudents: async (q?: string): Promise<SubCategoryAdminStudentRow[]> => {
    const { data } = await api.get<SubCategoryAdminStudentRow[]>(
      '/subcategory-admin/student-chat-groups/students',
      { params: q?.trim() ? { q: q.trim() } : undefined },
    );
    return Array.isArray(data) ? data : [];
  },

  create: async (payload: {
    name: string;
    description?: string;
    visibility?: StudentChatGroupVisibility;
  }): Promise<SubCategoryAdminStudentChatGroupRow> => {
    const { data } = await api.post<SubCategoryAdminStudentChatGroupRow>(
      '/subcategory-admin/student-chat-groups',
      payload,
    );
    return data;
  },

  listMembers: async (groupId: string): Promise<SubCategoryAdminStudentGroupMemberRow[]> => {
    const { data } = await api.get<SubCategoryAdminStudentGroupMemberRow[]>(
      `/subcategory-admin/student-chat-groups/${groupId}/members`,
    );
    return Array.isArray(data) ? data : [];
  },

  addMember: async (groupId: string, userId: string) => {
    const { data } = await api.post(`/subcategory-admin/student-chat-groups/${groupId}/members`, {
      userId,
    });
    return data;
  },
};
