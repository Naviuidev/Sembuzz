import { api } from '../config/api';

export interface DirectChatUser {
  id: string;
  name: string;
  email: string;
  profilePicUrl: string | null;
}

export type DirectChatPeerStatus =
  | 'none'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'accepted'
  | 'declined';

export interface DirectChatStudentRow {
  user: DirectChatUser;
  conversationId: string | null;
  peerStatus: DirectChatPeerStatus;
}

export interface DirectChatInboxItem {
  id: string;
  status: string;
  peerStatus: DirectChatPeerStatus;
  lastMessageAt: string;
  otherUser: DirectChatUser;
  lastMessagePreview: string | null;
  lastMessageSenderUserId: string | null;
  unreadCount: number;
  blockedByUserId?: string | null;
  isBlockedByMe: boolean;
  isBlockedByPeer: boolean;
}

export interface DirectMessageItem {
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
    senderUserId: string;
    sender: { id: string; name: string };
  } | null;
}

export interface SendDirectMessagePayload {
  body?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf';
  attachmentName?: string;
  replyToMessageId?: string;
}

export async function getDirectChatAvailability(): Promise<{ available: boolean }> {
  const response = await api.get('/user/direct-chats/availability');
  return response.data;
}

export async function getDirectChatUnreadCount(): Promise<{
  unreadCount: number;
  pendingIncomingCount: number;
}> {
  const response = await api.get('/user/direct-chats/unread-count');
  return response.data ?? { unreadCount: 0, pendingIncomingCount: 0 };
}

export async function listDirectChatInbox(): Promise<DirectChatInboxItem[]> {
  const response = await api.get<DirectChatInboxItem[]>('/user/direct-chats/inbox');
  if (!Array.isArray(response.data)) return [];
  return response.data.map((item) => ({
    ...item,
    blockedByUserId: item.blockedByUserId ?? null,
    isBlockedByMe: item.isBlockedByMe ?? false,
    isBlockedByPeer: item.isBlockedByPeer ?? false,
  }));
}

export async function listDirectChatStudents(q?: string): Promise<DirectChatStudentRow[]> {
  const response = await api.get<DirectChatStudentRow[]>('/user/direct-chats/students', {
    params: q ? { q } : undefined,
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function sendDirectChatRequest(otherUserId: string) {
  const response = await api.post(`/user/direct-chats/request/${otherUserId}`);
  return response.data as { conversationId: string; peerStatus: DirectChatPeerStatus; message: string };
}

export async function acceptDirectChatRequest(conversationId: string) {
  const response = await api.post(`/user/direct-chats/${conversationId}/accept`);
  return response.data as { conversationId: string; peerStatus: DirectChatPeerStatus; message?: string };
}

export async function markDirectChatRead(conversationId: string) {
  const response = await api.post(`/user/direct-chats/${conversationId}/read`);
  return response.data as { ok: boolean };
}

export async function listDirectMessages(conversationId: string) {
  const response = await api.get<
    | DirectMessageItem[]
    | {
        messages: DirectMessageItem[];
        blockedByUserId?: string | null;
        isBlockedByMe?: boolean;
        isBlockedByPeer?: boolean;
      }
  >(`/user/direct-chats/${conversationId}/messages`);
  const data = response.data;
  if (Array.isArray(data)) {
    return { messages: data };
  }
  return {
    messages: Array.isArray(data?.messages) ? data.messages : [],
    blockedByUserId: data?.blockedByUserId ?? null,
    isBlockedByMe: data?.isBlockedByMe,
    isBlockedByPeer: data?.isBlockedByPeer,
  };
}

export async function sendDirectMessage(
  conversationId: string,
  payload: SendDirectMessagePayload,
): Promise<DirectMessageItem> {
  const response = await api.post<DirectMessageItem>(`/user/direct-chats/${conversationId}/messages`, payload);
  return response.data;
}

export async function blockDirectConversation(conversationId: string) {
  const response = await api.post(`/user/direct-chats/${conversationId}/block`);
  return response.data as {
    conversationId: string;
    isBlockedByMe: boolean;
    isBlockedByPeer: boolean;
    message?: string;
  };
}

export async function unblockDirectConversation(conversationId: string) {
  const response = await api.post(`/user/direct-chats/${conversationId}/unblock`);
  return response.data as {
    conversationId: string;
    isBlockedByMe: boolean;
    isBlockedByPeer: boolean;
    message?: string;
  };
}
