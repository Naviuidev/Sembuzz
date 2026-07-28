import { imageSrc } from './image';

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

export interface ChatMessageShape {
  id: string;
  body: string;
  createdAt: string;
  attachmentUrl: string | null;
  attachmentType: ChatAttachmentType | string | null;
  attachmentName: string | null;
  replyToMessageId?: string | null;
  replyTo?: ChatMessageReplyTo | null;
  senderUserId?: string;
  sender?: { id: string; name: string; profilePicUrl?: string | null } | null;
  user?: { id: string; name: string; profilePicUrl?: string | null } | null;
  categoryAdmin?: { id: string; name: string } | null;
}

export interface PendingChatAttachment {
  url: string;
  attachmentType: ChatAttachmentType;
  attachmentName: string;
  previewUrl?: string;
}

export function chatAttachmentFullUrl(path: string): string {
  return imageSrc(path) || path;
}

export function replySenderName(reply: ChatMessageReplyTo): string {
  return reply.sender?.name ?? reply.user?.name ?? reply.categoryAdmin?.name ?? 'Unknown';
}

export function messageSenderName(message: ChatMessageShape): string {
  return message.sender?.name ?? message.user?.name ?? message.categoryAdmin?.name ?? 'Unknown';
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

export async function uploadChatAttachment(
  endpoint:
    | '/user/direct-chats/upload-attachment'
    | '/user/club-group-chats/upload-attachment'
    | '/user/student-chat-groups/upload-attachment',
  file: File,
): Promise<PendingChatAttachment> {
  const form = new FormData();
  form.append('file', file);
  const { api } = await import('../config/api');
  const { data } = await api.post<{
    url: string;
    attachmentType: ChatAttachmentType;
    attachmentName: string;
  }>(endpoint, form);
  return {
    url: data.url,
    attachmentType: data.attachmentType,
    attachmentName: data.attachmentName,
    previewUrl: data.attachmentType === 'image' ? chatAttachmentFullUrl(data.url) : undefined,
  };
}

export function attachmentLabel(type: string | null, name: string | null): string {
  if (type === 'image') return 'Photo';
  if (type === 'pdf') return name || 'PDF document';
  return 'Attachment';
}

export interface DirectChatBlockFields {
  blockedByUserId?: string | null;
  isBlockedByMe?: boolean;
  isBlockedByPeer?: boolean;
}

/** Resolve block flags for the signed-in user (prefers blockedByUserId when present). */
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
    return 'You blocked this student. Unblock from the menu above to message again.';
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
