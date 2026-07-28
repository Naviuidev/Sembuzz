export declare const INDIVIDUAL_MESSAGING_CODE = "INDIVIDUAL_MESSAGING";
export type DirectConversationStatus = 'pending' | 'accepted' | 'declined';
export type DirectChatPeerStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'accepted' | 'declined';
export declare function isDirectConversationStatus(value: string): value is DirectConversationStatus;
export declare function peerStatusForConversation(conversation: {
    status: string;
    requestedByUserId: string;
    userOneId: string;
    userTwoId: string;
}, currentUserId: string, otherUserId: string): DirectChatPeerStatus;
export declare function canonicalDirectChatUserPair(userIdA: string, userIdB: string): [string, string];
export declare function lastReadAtForUser(conversation: {
    userOneId: string;
    userTwoId: string;
    userOneLastReadAt: Date | null;
    userTwoLastReadAt: Date | null;
}, userId: string): Date | null;
export declare function lastReadAtFieldForUser(userId: string, conversation: {
    userOneId: string;
    userTwoId: string;
}): "userOneLastReadAt" | "userTwoLastReadAt";
export declare function conversationBlockState(blockedByUserId: string | null | undefined, currentUserId: string): {
    isBlockedByMe: boolean;
    isBlockedByPeer: boolean;
};
export declare const DIRECT_MESSAGE_REPLY_SELECT: {
    readonly id: true;
    readonly body: true;
    readonly attachmentType: true;
    readonly attachmentUrl: true;
    readonly attachmentName: true;
    readonly senderUserId: true;
    readonly sender: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
};
export declare const DIRECT_MESSAGE_SELECT: {
    readonly id: true;
    readonly body: true;
    readonly createdAt: true;
    readonly senderUserId: true;
    readonly attachmentUrl: true;
    readonly attachmentType: true;
    readonly attachmentName: true;
    readonly replyToMessageId: true;
    readonly sender: {
        readonly select: {
            readonly id: true;
            readonly name: true;
            readonly profilePicUrl: true;
        };
    };
    readonly replyTo: {
        readonly select: {
            readonly id: true;
            readonly body: true;
            readonly attachmentType: true;
            readonly attachmentUrl: true;
            readonly attachmentName: true;
            readonly senderUserId: true;
            readonly sender: {
                readonly select: {
                    readonly id: true;
                    readonly name: true;
                };
            };
        };
    };
};
export declare const DIRECT_CONVERSATION_USER_SELECT: {
    readonly id: true;
    readonly name: true;
    readonly email: true;
    readonly profilePicUrl: true;
};
