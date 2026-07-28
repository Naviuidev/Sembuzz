import { PrismaService } from '../../../prisma/prisma.service';
import { type DirectChatPeerStatus } from '../../direct-chats/direct-chat.util';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
export declare class UserDirectChatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getActiveUser;
    private assertIndividualMessagingAvailable;
    private formatConversation;
    private countUnreadForConversation;
    private markConversationRead;
    private getConversationForUser;
    private assertAccepted;
    private assertNotBlocked;
    getAvailability(userId: string): Promise<{
        available: true;
    } | {
        available: false;
    }>;
    listStudents(userId: string, query?: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
        conversationId: string | null;
        peerStatus: DirectChatPeerStatus;
    }[]>;
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
        pendingIncomingCount: number;
    }>;
    listInbox(userId: string): Promise<{
        isBlockedByMe: boolean;
        isBlockedByPeer: boolean;
        id: string;
        status: string;
        peerStatus: DirectChatPeerStatus;
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
    markRead(userId: string, conversationId: string): Promise<{
        ok: true;
    }>;
    listConversations(userId: string): Promise<{
        isBlockedByMe: boolean;
        isBlockedByPeer: boolean;
        id: string;
        status: string;
        peerStatus: DirectChatPeerStatus;
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
    sendRequest(userId: string, otherUserId: string): Promise<{
        conversationId: string;
        peerStatus: "accepted";
        message: string;
    } | {
        conversationId: string;
        peerStatus: "pending_outgoing";
        message: string;
    }>;
    acceptRequest(userId: string, conversationId: string): Promise<{
        conversationId: string;
        peerStatus: "accepted";
        message?: undefined;
    } | {
        conversationId: string;
        peerStatus: "accepted";
        message: string;
    }>;
    listMessages(userId: string, conversationId: string): Promise<{
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
    sendMessage(userId: string, conversationId: string, dto: SendDirectMessageDto): Promise<{
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
    blockConversation(userId: string, conversationId: string): Promise<{
        conversationId: string;
        isBlockedByMe: boolean;
        isBlockedByPeer: boolean;
        message: string;
    }>;
    unblockConversation(userId: string, conversationId: string): Promise<{
        conversationId: string;
        isBlockedByMe: boolean;
        isBlockedByPeer: boolean;
        message: string;
    }>;
}
