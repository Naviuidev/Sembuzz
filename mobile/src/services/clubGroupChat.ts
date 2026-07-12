import { api } from '../config/api';

export interface ClubGroupChatPublic {
  id: string;
  clubKey: string;
  pageName: string;
  icon: string;
  messageMode?: 'admin_only' | 'members';
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

export async function listJoinableClubGroupChats(): Promise<
  Array<
    ClubGroupChatPublic & {
      membershipStatus: 'pending' | 'approved' | 'banned' | null;
      membershipId: string | null;
      requestedAt: string | null;
    }
  >
> {
  const response = await api.get('/user/club-group-chats/joinable');
  return Array.isArray(response.data) ? response.data : [];
}

export async function requestJoinClubGroup(groupChatId: string) {
  const response = await api.post(`/user/club-group-chats/${groupChatId}/join-request`);
  return response.data;
}

export async function listClubGroupChats(): Promise<ClubGroupChatPublic[]> {
  const response = await api.get<ClubGroupChatPublic[]>('/user/club-group-chats');
  return Array.isArray(response.data) ? response.data : [];
}

export async function listClubGroupMessages(groupChatId: string): Promise<ClubGroupMessageItem[]> {
  const response = await api.get<ClubGroupMessageItem[]>(
    `/user/club-group-chats/${groupChatId}/messages`,
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function sendClubGroupMessage(
  groupChatId: string,
  payload: SendClubGroupMessagePayload,
): Promise<ClubGroupMessageItem> {
  const response = await api.post<ClubGroupMessageItem>(
    `/user/club-group-chats/${groupChatId}/messages`,
    payload,
  );
  return response.data;
}
