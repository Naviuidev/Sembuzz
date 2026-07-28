export const STUDENT_CHAT_MESSAGE_REPLY_SELECT = {
  id: true,
  body: true,
  attachmentType: true,
  attachmentUrl: true,
  attachmentName: true,
  sender: { select: { id: true, name: true } },
} as const;

export const STUDENT_CHAT_MESSAGE_SELECT = {
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
    select: STUDENT_CHAT_MESSAGE_REPLY_SELECT,
  },
} as const;

export type StudentChatGroupVisibility = 'public' | 'private';

export function isStudentChatGroupVisibility(value: string): value is StudentChatGroupVisibility {
  return value === 'public' || value === 'private';
}
