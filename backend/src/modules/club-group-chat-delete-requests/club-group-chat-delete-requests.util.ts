export const CLUB_GROUP_CHAT_DELETE_REQUEST_SELECT = {
  id: true,
  schoolId: true,
  clubGroupChatId: true,
  note: true,
  status: true,
  reviewedByRole: true,
  reviewedByAdminId: true,
  declineReason: true,
  createdAt: true,
  reviewedAt: true,
  subCategoryAdmin: {
    select: { id: true, name: true, email: true },
  },
  clubGroupChat: {
    select: { id: true, pageName: true, icon: true },
  },
} as const;

export type MessagingDeleteRequestStatus = 'pending' | 'approved' | 'declined';
