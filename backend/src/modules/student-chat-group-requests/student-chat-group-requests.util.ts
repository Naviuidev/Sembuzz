export const STUDENT_CHAT_GROUP_REQUEST_SELECT = {
  id: true,
  schoolId: true,
  name: true,
  description: true,
  visibility: true,
  status: true,
  reviewedByRole: true,
  reviewedByAdminId: true,
  declineReason: true,
  studentChatGroupId: true,
  createdAt: true,
  reviewedAt: true,
  subCategoryAdmin: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export type StudentChatGroupRequestStatus = 'pending' | 'approved' | 'declined';
