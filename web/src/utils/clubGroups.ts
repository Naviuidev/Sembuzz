import type { SchoolSocialAccountItem } from '../services/school-admin-social-accounts.service';

export interface ClubGroup {
  key: string;
  pageName: string;
  icon: string;
  accountIds: string[];
  socialLinkCount: number;
}

/** Clubs are grouped from school social accounts (same key as Social Share page). */
export function groupSocialAccountsIntoClubs(
  accounts: SchoolSocialAccountItem[],
): ClubGroup[] {
  const map = new Map<string, ClubGroup>();

  for (const account of accounts) {
    const key = `${account.pageName}|${account.icon}`;
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
