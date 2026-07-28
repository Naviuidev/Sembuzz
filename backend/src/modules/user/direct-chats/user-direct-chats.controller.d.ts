import { UserDirectChatsService } from './user-direct-chats.service';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
export declare class UserDirectChatsController {
    private readonly service;
    constructor(service: UserDirectChatsService);
    availability(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        available: true;
    } | {
        available: false;
    }>;
    unreadCount(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        unreadCount: number;
        pendingIncomingCount: number;
    }>;
    listInbox(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        isBlockedByMe: boolean;
        isBlockedByPeer: boolean;
        id: string;
        status: string;
        peerStatus: import("../../direct-chats/direct-chat.util").DirectChatPeerStatus;
        lastMessageAt: Date;
        otherUser: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
        lastMessagePreview: string | null;
        lastMessageSenderUserId: string;
        unreadCount: number;
        blockedByUserId: string | null;
    }[]>;
    uploadAttachment(file: Express.Multer.File): Promise<{
        url: string;
        attachmentType: import("../../chat-messages/chat-attachment.util").ChatAttachmentType;
        attachmentName: string;
    }>;
    listStudents(req: {
        user: {
            sub: string;
        };
    }, q?: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
        conversationId: string | null;
        peerStatus: import("../../direct-chats/direct-chat.util").DirectChatPeerStatus;
    }[]>;
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        isBlockedByMe: boolean;
        isBlockedByPeer: boolean;
        id: string;
        status: string;
        peerStatus: import("../../direct-chats/direct-chat.util").DirectChatPeerStatus;
        lastMessageAt: Date;
        otherUser: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
        lastMessagePreview: string | null;
        lastMessageSenderUserId: string;
        unreadCount: number;
        blockedByUserId: string | null;
    }[]>;
    sendRequest(req: {
        user: {
            sub: string;
        };
    }, otherUserId: string): Promise<{
        conversationId: string;
        peerStatus: "accepted";
        message: string;
    } | {
        conversationId: string;
        peerStatus: "pending_outgoing";
        message: string;
    }>;
    acceptRequest(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        conversationId: string;
        peerStatus: "accepted";
        message?: undefined;
    } | {
        conversationId: string;
        peerStatus: "accepted";
        message: string;
    }>;
    markRead(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        ok: true;
    }>;
    blockConversation(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        conversationId: string;
        isBlockedByMe: boolean;
        isBlockedByPeer: boolean;
        message: string;
    }>;
    unblockConversation(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        conversationId: string;
        isBlockedByMe: boolean;
        isBlockedByPeer: boolean;
        message: string;
    }>;
    listMessages(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        isBlockedByMe: boolean;
        isBlockedByPeer: boolean;
        messages: {
            id: string;
            createdAt: Date;
            body: string;
            sender: {
                id: string;
                name: string;
                profilePicUrl: string | null;
            };
            replyTo: {
                id: string;
                body: string;
                sender: {
                    id: string;
                    name: string;
                };
                attachmentUrl: string | null;
                attachmentType: string | null;
                attachmentName: string | null;
                senderUserId: string;
            } | null;
            attachmentUrl: string | null;
            attachmentType: string | null;
            attachmentName: string | null;
            replyToMessageId: string | null;
            senderUserId: string;
        }[];
        blockedByUserId: string | null;
    }>;
    sendMessage(req: {
        user: {
            sub: string;
        };
    }, id: string, dto: SendDirectMessageDto): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        sender: {
            id: string;
            name: string;
            profilePicUrl: string | null;
        };
        replyTo: {
            id: string;
            body: string;
            sender: {
                id: string;
                name: string;
            };
            attachmentUrl: string | null;
            attachmentType: string | null;
            attachmentName: string | null;
            senderUserId: string;
        } | null;
        attachmentUrl: string | null;
        attachmentType: string | null;
        attachmentName: string | null;
        replyToMessageId: string | null;
        senderUserId: string;
    }>;
}
