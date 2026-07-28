export declare const STUDENT_CHAT_MESSAGE_REPLY_SELECT: {
    readonly id: true;
    readonly body: true;
    readonly attachmentType: true;
    readonly attachmentUrl: true;
    readonly attachmentName: true;
    readonly sender: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
};
export declare const STUDENT_CHAT_MESSAGE_SELECT: {
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
            readonly sender: {
                readonly select: {
                    readonly id: true;
                    readonly name: true;
                };
            };
        };
    };
};
export type StudentChatGroupVisibility = 'public' | 'private';
export declare function isStudentChatGroupVisibility(value: string): value is StudentChatGroupVisibility;
