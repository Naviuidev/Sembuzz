import { api } from '../config/api';

export type ClubGroupMessageMode = 'admin_only' | 'members';

export interface ClubGroupChatPublic {
  id: string;
  clubKey: string;
  pageName: string;
  icon: string;
  messageMode?: ClubGroupMessageMode;
}

export interface JoinableClubGroupChat extends ClubGroupChatPublic {
  membershipStatus: 'pending' | 'approved' | 'banned' | null;
  membershipId: string | null;
  requestedAt: string | null;
}

export interface ClubGroupMessageItem {
  id: string;
  body: string;
  createdAt: string;
  attachmentUrl: string | null;
  attachmentType: 'image' | 'pdf' | null;
  attachmentName: string | null;
  replyToMessageId: string | null;
  user: {
    id: string;
    name: string;
    profilePicUrl: string | null;
  } | null;
  categoryAdmin: {
    id: string;
    name: string;
  } | null;
  replyTo: {
    id: string;
    body: string;
    attachmentType: string | null;
    attachmentUrl: string | null;
    attachmentName: string | null;
    user: { id: string; name: string } | null;
    categoryAdmin: { id: string; name: string } | null;
  } | null;
}

export interface SendClubGroupMessagePayload {
  body?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf';
  attachmentName?: string;
  replyToMessageId?: string;
}

export const userClubGroupChatsService = {
  listJoinable: async (): Promise<JoinableClubGroupChat[]> => {
    const { data } = await api.get<JoinableClubGroupChat[]>('/user/club-group-chats/joinable');
    return Array.isArray(data) ? data : [];
  },

  requestJoin: async (groupChatId: string) => {
    const { data } = await api.post(`/user/club-group-chats/${groupChatId}/join-request`);
    return data;
  },

  list: async (): Promise<ClubGroupChatPublic[]> => {
    const { data } = await api.get<ClubGroupChatPublic[]>('/user/club-group-chats');
    return Array.isArray(data) ? data : [];
  },

  listMessages: async (groupChatId: string): Promise<ClubGroupMessageItem[]> => {
    const { data } = await api.get<ClubGroupMessageItem[]>(
      `/user/club-group-chats/${groupChatId}/messages`,
    );
    return Array.isArray(data) ? data : [];
  },

  sendMessage: async (
    groupChatId: string,
    payload: SendClubGroupMessagePayload,
  ): Promise<ClubGroupMessageItem> => {
    const { data } = await api.post<ClubGroupMessageItem>(
      `/user/club-group-chats/${groupChatId}/messages`,
      payload,
    );
    return data;
  },
};
