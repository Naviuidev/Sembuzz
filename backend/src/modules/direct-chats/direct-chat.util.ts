export const INDIVIDUAL_MESSAGING_CODE = 'INDIVIDUAL_MESSAGING';

export type DirectConversationStatus = 'pending' | 'accepted' | 'declined';

export type DirectChatPeerStatus =
  | 'none'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'accepted'
  | 'declined';

export function isDirectConversationStatus(value: string): value is DirectConversationStatus {
  return value === 'pending' || value === 'accepted' || value === 'declined';
}

export function peerStatusForConversation(
  conversation: {
    status: string;
    requestedByUserId: string;
    userOneId: string;
    userTwoId: string;
  },
  currentUserId: string,
  otherUserId: string,
): DirectChatPeerStatus {
  if (conversation.userOneId !== currentUserId && conversation.userTwoId !== currentUserId) {
    return 'none';
  }
  if (conversation.userOneId !== otherUserId && conversation.userTwoId !== otherUserId) {
    return 'none';
  }
  const status = isDirectConversationStatus(conversation.status) ? conversation.status : 'pending';
  if (status === 'accepted') return 'accepted';
  if (status === 'declined') return 'declined';
  if (conversation.requestedByUserId === currentUserId) return 'pending_outgoing';
  return 'pending_incoming';
}

export function canonicalDirectChatUserPair(
  userIdA: string,
  userIdB: string,
): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

export function lastReadAtForUser(
  conversation: { userOneId: string; userTwoId: string; userOneLastReadAt: Date | null; userTwoLastReadAt: Date | null },
  userId: string,
): Date | null {
  if (conversation.userOneId === userId) return conversation.userOneLastReadAt;
  if (conversation.userTwoId === userId) return conversation.userTwoLastReadAt;
  return null;
}

export function lastReadAtFieldForUser(userId: string, conversation: { userOneId: string; userTwoId: string }) {
  return conversation.userOneId === userId ? 'userOneLastReadAt' as const : 'userTwoLastReadAt' as const;
}

export function conversationBlockState(
  blockedByUserId: string | null | undefined,
  currentUserId: string,
): { isBlockedByMe: boolean; isBlockedByPeer: boolean } {
  if (!blockedByUserId) {
    return { isBlockedByMe: false, isBlockedByPeer: false };
  }
  return {
    isBlockedByMe: blockedByUserId === currentUserId,
    isBlockedByPeer: blockedByUserId !== currentUserId,
  };
}

export const DIRECT_MESSAGE_REPLY_SELECT = {
  id: true,
  body: true,
  attachmentType: true,
  attachmentUrl: true,
  attachmentName: true,
  senderUserId: true,
  sender: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

export const DIRECT_MESSAGE_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  senderUserId: true,
  attachmentUrl: true,
  attachmentType: true,
  attachmentName: true,
  replyToMessageId: true,
  sender: {
    select: {
      id: true,
      name: true,
      profilePicUrl: true,
    },
  },
  replyTo: {
    select: DIRECT_MESSAGE_REPLY_SELECT,
  },
} as const;

export const DIRECT_CONVERSATION_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  profilePicUrl: true,
} as const;
