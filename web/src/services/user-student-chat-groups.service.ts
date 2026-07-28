import { api } from '../config/api';

export type StudentChatGroupVisibility = 'public' | 'private';

export interface StudentChatGroupInboxItem {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  visibility: StudentChatGroupVisibility;
  createdByUserId: string;
  lastMessageAt: string;
  memberCount: number;
  memberRole: string | null;
  isMember?: boolean;
  isOwner?: boolean;
  unreadCount: number;
  lastMessagePreview: string | null;
  lastMessageSenderName: string | null;
}

export interface StudentChatGroupMemberRow {
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicUrl: string | null;
  };
}

export interface StudentChatGroupMessageItem {
  id: string;
  body: string;
  createdAt: string;
  senderUserId: string;
  attachmentUrl: string | null;
  attachmentType: 'image' | 'pdf' | null;
  attachmentName: string | null;
  replyToMessageId: string | null;
  sender: {
    id: string;
    name: string;
    profilePicUrl: string | null;
  };
  replyTo: {
    id: string;
    body: string;
    attachmentType: string | null;
    attachmentUrl: string | null;
    attachmentName: string | null;
    sender: { id: string; name: string };
  } | null;
}

export interface CreateStudentChatGroupPayload {
  name: string;
  description?: string;
  visibility?: StudentChatGroupVisibility;
}

export interface SendStudentChatGroupMessagePayload {
  body?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf';
  attachmentName?: string;
  replyToMessageId?: string;
}

export const USER_STUDENT_CHAT_GROUPS_UNREAD_QUERY_KEY = [
  'user',
  'student-chat-groups',
  'unread-count',
] as const;

export const userStudentChatGroupsService = {
  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const { data } = await api.get<{ unreadCount: number }>(
      '/user/student-chat-groups/unread-count',
    );
    return data ?? { unreadCount: 0 };
  },

  listInbox: async (): Promise<StudentChatGroupInboxItem[]> => {
    const { data } = await api.get<StudentChatGroupInboxItem[]>('/user/student-chat-groups/inbox');
    return Array.isArray(data) ? data : [];
  },

  listDiscoverable: async (): Promise<StudentChatGroupInboxItem[]> => {
    const { data } = await api.get<StudentChatGroupInboxItem[]>(
      '/user/student-chat-groups/discover',
    );
    return Array.isArray(data) ? data : [];
  },

  create: async (payload: CreateStudentChatGroupPayload): Promise<StudentChatGroupInboxItem> => {
    const { data } = await api.post<StudentChatGroupInboxItem>(
      '/user/student-chat-groups',
      payload,
    );
    return data;
  },

  join: async (groupId: string) => {
    const { data } = await api.post(`/user/student-chat-groups/${groupId}/join`);
    return data;
  },

  leave: async (groupId: string) => {
    const { data } = await api.post(`/user/student-chat-groups/${groupId}/leave`);
    return data;
  },

  markRead: async (groupId: string) => {
    const { data } = await api.post(`/user/student-chat-groups/${groupId}/read`);
    return data;
  },

  listMembers: async (groupId: string): Promise<StudentChatGroupMemberRow[]> => {
    const { data } = await api.get<StudentChatGroupMemberRow[]>(
      `/user/student-chat-groups/${groupId}/members`,
    );
    return Array.isArray(data) ? data : [];
  },

  addMember: async (groupId: string, userId: string) => {
    const { data } = await api.post(`/user/student-chat-groups/${groupId}/members`, { userId });
    return data;
  },

  listMessages: async (groupId: string): Promise<StudentChatGroupMessageItem[]> => {
    const { data } = await api.get<StudentChatGroupMessageItem[]>(
      `/user/student-chat-groups/${groupId}/messages`,
    );
    return Array.isArray(data) ? data : [];
  },

  sendMessage: async (
    groupId: string,
    payload: SendStudentChatGroupMessagePayload,
  ): Promise<StudentChatGroupMessageItem> => {
    const { data } = await api.post<StudentChatGroupMessageItem>(
      `/user/student-chat-groups/${groupId}/messages`,
      payload,
    );
    return data;
  },
};
