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

export interface DirectConversationItem {
  id: string;
  status: string;
  peerStatus: DirectChatPeerStatus;
  lastMessageAt: string;
  otherUser: DirectChatUser;
  lastMessagePreview: string | null;
  lastMessageSenderUserId: string | null;
  unreadCount: number;
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

export const USER_DIRECT_CHATS_UNREAD_QUERY_KEY = ['user', 'direct-chats', 'unread-count'] as const;

export const userDirectChatsService = {
  getAvailability: async (): Promise<{ available: boolean }> => {
    const { data } = await api.get<{ available: boolean }>('/user/direct-chats/availability');
    return data;
  },

  getUnreadCount: async (): Promise<{ unreadCount: number; pendingIncomingCount: number }> => {
    const { data } = await api.get<{ unreadCount: number; pendingIncomingCount: number }>(
      '/user/direct-chats/unread-count',
    );
    return data ?? { unreadCount: 0, pendingIncomingCount: 0 };
  },

  listInbox: async (): Promise<DirectChatInboxItem[]> => {
    const { data } = await api.get<DirectChatInboxItem[]>('/user/direct-chats/inbox');
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      ...item,
      blockedByUserId: item.blockedByUserId ?? null,
      isBlockedByMe: item.isBlockedByMe ?? false,
      isBlockedByPeer: item.isBlockedByPeer ?? false,
    }));
  },

  listStudents: async (q?: string): Promise<DirectChatStudentRow[]> => {
    const { data } = await api.get<DirectChatStudentRow[]>('/user/direct-chats/students', {
      params: q ? { q } : undefined,
    });
    return Array.isArray(data) ? data : [];
  },

  list: async (): Promise<DirectConversationItem[]> => {
    const { data } = await api.get<DirectConversationItem[]>('/user/direct-chats');
    return Array.isArray(data) ? data : [];
  },

  sendRequest: async (otherUserId: string) => {
    const { data } = await api.post(`/user/direct-chats/request/${otherUserId}`);
    return data as { conversationId: string; peerStatus: DirectChatPeerStatus; message: string };
  },

  acceptRequest: async (conversationId: string) => {
    const { data } = await api.post(`/user/direct-chats/${conversationId}/accept`);
    return data as { conversationId: string; peerStatus: DirectChatPeerStatus; message?: string };
  },

  markRead: async (conversationId: string) => {
    const { data } = await api.post(`/user/direct-chats/${conversationId}/read`);
    return data as { ok: boolean };
  },

  listMessages: async (conversationId: string) => {
    const { data } = await api.get<
      | DirectMessageItem[]
      | {
          messages: DirectMessageItem[];
          blockedByUserId?: string | null;
          isBlockedByMe?: boolean;
          isBlockedByPeer?: boolean;
        }
    >(`/user/direct-chats/${conversationId}/messages`);
    if (Array.isArray(data)) {
      return { messages: data };
    }
    return {
      messages: Array.isArray(data?.messages) ? data.messages : [],
      blockedByUserId: data?.blockedByUserId ?? null,
      isBlockedByMe: data?.isBlockedByMe,
      isBlockedByPeer: data?.isBlockedByPeer,
    };
  },

  sendMessage: async (
    conversationId: string,
    payload: SendDirectMessagePayload,
  ): Promise<DirectMessageItem> => {
    const { data } = await api.post<DirectMessageItem>(
      `/user/direct-chats/${conversationId}/messages`,
      payload,
    );
    return data;
  },

  blockConversation: async (conversationId: string) => {
    const { data } = await api.post(`/user/direct-chats/${conversationId}/block`);
    return data as {
      conversationId: string;
      isBlockedByMe: boolean;
      isBlockedByPeer: boolean;
      message?: string;
    };
  },

  unblockConversation: async (conversationId: string) => {
    const { data } = await api.post(`/user/direct-chats/${conversationId}/unblock`);
    return data as {
      conversationId: string;
      isBlockedByMe: boolean;
      isBlockedByPeer: boolean;
      message?: string;
    };
  },
};
