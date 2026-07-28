import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStudentChatGroupDto } from './dto/create-student-chat-group.dto';
import { SendStudentChatGroupMessageDto } from './dto/send-student-chat-group-message.dto';
export declare class UserStudentChatGroupsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getActiveUser;
    private assertGroupMessagingEnabled;
    private getActiveMembership;
    private getGroupForUser;
    private formatGroupRow;
    getUnreadCount(userId: string): Promise<{
        unreadCount: number;
    }>;
    /** Groups the student is an active member of (inbox). */
    listInbox(userId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        avatarUrl: string | null;
        visibility: import("../../student-chat-groups/student-chat-message.util").StudentChatGroupVisibility;
        createdByUserId: string | null;
        lastMessageAt: Date;
        memberCount: number;
        memberRole: string | null;
        unreadCount: number;
        lastMessagePreview: string | null;
        lastMessageSenderName: string | null;
    }[]>;
    /** Public groups at the school — students are added by subcategory admin only. */
    listDiscoverable(userId: string): Promise<never[]>;
    createGroup(userId: string, dto: CreateStudentChatGroupDto): Promise<void>;
    joinGroup(userId: string, groupId: string): Promise<void>;
    leaveGroup(userId: string, groupId: string): Promise<{
        ok: boolean;
    }>;
    addMember(userId: string, groupId: string, targetUserId: string): Promise<{
        ok: boolean;
    }>;
    listMembers(userId: string, groupId: string): Promise<{
        role: string;
        joinedAt: Date;
        user: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
    }[]>;
    markRead(userId: string, groupId: string): Promise<{
        ok: boolean;
    }>;
    listMessages(userId: string, groupId: string): Promise<{
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
        } | null;
        attachmentUrl: string | null;
        attachmentType: string | null;
        attachmentName: string | null;
        replyToMessageId: string | null;
        senderUserId: string;
    }[]>;
    sendMessage(userId: string, groupId: string, dto: SendStudentChatGroupMessageDto): Promise<{
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
        } | null;
        attachmentUrl: string | null;
        attachmentType: string | null;
        attachmentName: string | null;
        replyToMessageId: string | null;
        senderUserId: string;
    }>;
}
