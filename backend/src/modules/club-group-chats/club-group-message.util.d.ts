export declare const CLUB_GROUP_MESSAGE_REPLY_SELECT: {
    readonly id: true;
    readonly body: true;
    readonly attachmentType: true;
    readonly attachmentUrl: true;
    readonly attachmentName: true;
    readonly user: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    readonly categoryAdmin: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
};
export declare const CLUB_GROUP_MESSAGE_SELECT: {
    readonly id: true;
    readonly body: true;
    readonly createdAt: true;
    readonly attachmentUrl: true;
    readonly attachmentType: true;
    readonly attachmentName: true;
    readonly replyToMessageId: true;
    readonly user: {
        readonly select: {
            readonly id: true;
            readonly name: true;
            readonly profilePicUrl: true;
        };
    };
    readonly categoryAdmin: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    readonly subCategoryAdmin: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    readonly replyTo: {
        readonly select: {
            readonly id: true;
            readonly body: true;
            readonly attachmentType: true;
            readonly attachmentUrl: true;
            readonly attachmentName: true;
            readonly user: {
                readonly select: {
                    readonly id: true;
                    readonly name: true;
                };
            };
            readonly categoryAdmin: {
                readonly select: {
                    readonly id: true;
                    readonly name: true;
                };
            };
        };
    };
};
export type ClubGroupMessageMode = 'admin_only' | 'members';
export declare function isClubGroupMessageMode(value: string): value is ClubGroupMessageMode;
export declare function clubGroupMessageSenderName(message: {
    user?: {
        name: string;
    } | null;
    categoryAdmin?: {
        name: string;
    } | null;
    subCategoryAdmin?: {
        name: string;
    } | null;
}): string;
