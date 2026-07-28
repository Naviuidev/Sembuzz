import { api } from '../config/api';
import { getApiBaseUrl } from '../config/env';

export type ChatAttachmentType = 'image' | 'pdf';

export interface ChatMessageReplyTo {
  id: string;
  body: string;
  attachmentType: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  senderUserId?: string;
  sender?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
  categoryAdmin?: { id: string; name: string } | null;
}

export interface PendingChatAttachment {
  url: string;
  attachmentType: ChatAttachmentType;
  attachmentName: string;
  localPreviewUri?: string;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function chatAttachmentFullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const base = getApiBaseUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function replySenderName(reply: ChatMessageReplyTo): string {
  return reply.sender?.name ?? reply.user?.name ?? reply.categoryAdmin?.name ?? 'Unknown';
}

export function replyPreviewText(reply: ChatMessageReplyTo): string {
  const text = reply.body?.trim();
  if (text) return text;
  if (reply.attachmentType === 'image') return 'Photo';
  if (reply.attachmentType === 'pdf') {
    return reply.attachmentName ? `PDF: ${reply.attachmentName}` : 'PDF document';
  }
  return 'Message';
}

export async function uploadChatAttachmentMobile(
  endpoint:
    | '/user/direct-chats/upload-attachment'
    | '/user/club-group-chats/upload-attachment'
    | '/user/student-chat-groups/upload-attachment',
  file: { uri: string; name: string; mimeType: string; size?: number },
): Promise<PendingChatAttachment> {
  if (file.size && file.size > MAX_FILE_BYTES) {
    throw new Error('File must be 5 MB or smaller.');
  }
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
  const response = await api.post<{
    url: string;
    attachmentType: ChatAttachmentType;
    attachmentName: string;
  }>(endpoint, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return {
    url: response.data.url,
    attachmentType: response.data.attachmentType,
    attachmentName: response.data.attachmentName,
    localPreviewUri: response.data.attachmentType === 'image' ? file.uri : undefined,
  };
}

export interface DirectChatBlockFields {
  blockedByUserId?: string | null;
  isBlockedByMe?: boolean;
  isBlockedByPeer?: boolean;
}

export function applyDirectChatBlockState(
  fields: DirectChatBlockFields,
  currentUserId?: string | null,
): { isBlockedByMe: boolean; isBlockedByPeer: boolean } | null {
  if (currentUserId && fields.blockedByUserId !== undefined) {
    if (!fields.blockedByUserId) {
      return { isBlockedByMe: false, isBlockedByPeer: false };
    }
    return {
      isBlockedByMe: fields.blockedByUserId === currentUserId,
      isBlockedByPeer: fields.blockedByUserId !== currentUserId,
    };
  }
  if (fields.isBlockedByMe !== undefined || fields.isBlockedByPeer !== undefined) {
    return {
      isBlockedByMe: fields.isBlockedByMe ?? false,
      isBlockedByPeer: fields.isBlockedByPeer ?? false,
    };
  }
  return null;
}

export function blockedConversationNotice(
  isBlockedByMe: boolean,
  isBlockedByPeer: boolean,
): string | null {
  if (isBlockedByMe) {
    return 'You blocked this student. Tap the header to unblock.';
  }
  if (isBlockedByPeer) {
    return 'This student blocked you. You cannot send new messages.';
  }
  return null;
}

export function blockedConversationSubtitle(
  isBlockedByMe: boolean,
  isBlockedByPeer: boolean,
): string | null {
  if (isBlockedByMe) return 'Blocked by you';
  if (isBlockedByPeer) return 'You were blocked';
  return null;
}
