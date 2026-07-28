export declare const CLUB_GROUP_CHAT_REQUEST_SELECT: {
    readonly id: true;
    readonly schoolId: true;
    readonly clubKey: true;
    readonly pageName: true;
    readonly icon: true;
    readonly note: true;
    readonly status: true;
    readonly reviewedByRole: true;
    readonly reviewedByAdminId: true;
    readonly declineReason: true;
    readonly clubGroupChatId: true;
    readonly createdAt: true;
    readonly reviewedAt: true;
    readonly subCategoryAdmin: {
        readonly select: {
            readonly id: true;
            readonly name: true;
            readonly email: true;
        };
    };
};
export type ClubGroupChatRequestStatus = 'pending' | 'approved' | 'declined';
export declare function clubKeyFromParts(pageName: string, icon: string): string;
export declare function groupSchoolSocialAccountsIntoClubs(accounts: Array<{
    id: string;
    pageName: string;
    icon: string;
}>): {
    key: string;
    pageName: string;
    icon: string;
    accountIds: string[];
    socialLinkCount: number;
}[];
