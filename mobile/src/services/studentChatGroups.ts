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
  unreadCount: number;
  lastMessagePreview: string | null;
  lastMessageSenderName: string | null;
  isMember?: boolean;
  isOwner?: boolean;
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

export interface SendStudentChatGroupMessagePayload {
  body?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf';
  attachmentName?: string;
  replyToMessageId?: string;
}

export async function getStudentChatGroupUnreadCount(): Promise<{ unreadCount: number }> {
  const response = await api.get<{ unreadCount: number }>('/user/student-chat-groups/unread-count');
  return response.data ?? { unreadCount: 0 };
}

export async function listStudentChatGroupInbox(): Promise<StudentChatGroupInboxItem[]> {
  const response = await api.get<StudentChatGroupInboxItem[]>('/user/student-chat-groups/inbox');
  return Array.isArray(response.data) ? response.data : [];
}

export async function listDiscoverableStudentChatGroups(): Promise<StudentChatGroupInboxItem[]> {
  const response = await api.get<StudentChatGroupInboxItem[]>('/user/student-chat-groups/discover');
  return Array.isArray(response.data) ? response.data : [];
}

export async function joinStudentChatGroup(groupId: string) {
  const response = await api.post(`/user/student-chat-groups/${groupId}/join`);
  return response.data;
}

export async function markStudentChatGroupRead(groupId: string) {
  const response = await api.post(`/user/student-chat-groups/${groupId}/read`);
  return response.data;
}

export async function listStudentChatGroupMessages(
  groupId: string,
): Promise<StudentChatGroupMessageItem[]> {
  const response = await api.get<StudentChatGroupMessageItem[]>(
    `/user/student-chat-groups/${groupId}/messages`,
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function sendStudentChatGroupMessage(
  groupId: string,
  payload: SendStudentChatGroupMessagePayload,
): Promise<StudentChatGroupMessageItem> {
  const response = await api.post<StudentChatGroupMessageItem>(
    `/user/student-chat-groups/${groupId}/messages`,
    payload,
  );
  return response.data;
}
