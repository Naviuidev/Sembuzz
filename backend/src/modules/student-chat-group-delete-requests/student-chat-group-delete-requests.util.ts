export const STUDENT_CHAT_GROUP_DELETE_REQUEST_SELECT = {
  id: true,
  schoolId: true,
  studentChatGroupId: true,
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
  studentChatGroup: {
    select: { id: true, name: true, visibility: true },
  },
} as const;

export type MessagingDeleteRequestStatus = 'pending' | 'approved' | 'declined';
