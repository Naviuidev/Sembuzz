"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLUB_GROUP_CHAT_REQUEST_SELECT = void 0;
exports.clubKeyFromParts = clubKeyFromParts;
exports.groupSchoolSocialAccountsIntoClubs = groupSchoolSocialAccountsIntoClubs;
exports.CLUB_GROUP_CHAT_REQUEST_SELECT = {
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
};
function clubKeyFromParts(pageName, icon) {
    return `${pageName}|${icon}`;
}
function groupSchoolSocialAccountsIntoClubs(accounts) {
    const map = new Map();
    for (const account of accounts) {
        const key = clubKeyFromParts(account.pageName, account.icon);
        const existing = map.get(key);
        if (existing) {
            existing.accountIds.push(account.id);
            existing.socialLinkCount += 1;
        }
        else {
            map.set(key, {
                key,
                pageName: account.pageName,
                icon: account.icon,
                accountIds: [account.id],
                socialLinkCount: 1,
            });
        }
    }
    return Array.from(map.values()).sort((a, b) => a.pageName.localeCompare(b.pageName, undefined, { sensitivity: 'base' }));
}
//# sourceMappingURL=club-group-chat-requests.util.js.map