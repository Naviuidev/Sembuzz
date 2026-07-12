export const CLUB_GROUP_CHAT_REQUEST_SELECT = {
  id: true,
  schoolId: true,
  clubKey: true,
  pageName: true,
  icon: true,
  note: true,
  status: true,
  reviewedByRole: true,
  reviewedByAdminId: true,
  declineReason: true,
  clubGroupChatId: true,
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

export type ClubGroupChatRequestStatus = 'pending' | 'approved' | 'declined';

export function clubKeyFromParts(pageName: string, icon: string): string {
  return `${pageName}|${icon}`;
}

export function groupSchoolSocialAccountsIntoClubs(
  accounts: Array<{ id: string; pageName: string; icon: string }>,
) {
  const map = new Map<
    string,
    { key: string; pageName: string; icon: string; accountIds: string[]; socialLinkCount: number }
  >();

  for (const account of accounts) {
    const key = clubKeyFromParts(account.pageName, account.icon);
    const existing = map.get(key);
    if (existing) {
      existing.accountIds.push(account.id);
      existing.socialLinkCount += 1;
    } else {
      map.set(key, {
        key,
        pageName: account.pageName,
        icon: account.icon,
        accountIds: [account.id],
        socialLinkCount: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.pageName.localeCompare(b.pageName, undefined, { sensitivity: 'base' }),
  );
}
