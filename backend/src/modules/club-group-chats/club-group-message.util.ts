export const CLUB_GROUP_MESSAGE_REPLY_SELECT = {
  id: true,
  body: true,
  attachmentType: true,
  attachmentUrl: true,
  attachmentName: true,
  user: { select: { id: true, name: true } },
  categoryAdmin: { select: { id: true, name: true } },
} as const;

export const CLUB_GROUP_MESSAGE_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  attachmentUrl: true,
  attachmentType: true,
  attachmentName: true,
  replyToMessageId: true,
  user: {
    select: {
      id: true,
      name: true,
      profilePicUrl: true,
    },
  },
  categoryAdmin: {
    select: {
      id: true,
      name: true,
    },
  },
  replyTo: {
    select: CLUB_GROUP_MESSAGE_REPLY_SELECT,
  },
} as const;

export type ClubGroupMessageMode = 'admin_only' | 'members';

export function isClubGroupMessageMode(value: string): value is ClubGroupMessageMode {
  return value === 'admin_only' || value === 'members';
}

export function clubGroupMessageSenderName(message: {
  user?: { name: string } | null;
  categoryAdmin?: { name: string } | null;
}): string {
  return message.user?.name ?? message.categoryAdmin?.name ?? 'Unknown';
}
