import { PrismaService } from '../../../prisma/prisma.service';
import { SendClubGroupMessageDto } from './dto/send-club-group-message.dto';
export declare class UserClubGroupChatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getActiveUser;
    private assertGroupMessagingEnabled;
    private assertApprovedMember;
    private getChatForUser;
    /** Chats the user may join (with membership status). */
    listJoinable(userId: string): Promise<{
        id: string;
        clubKey: string;
        pageName: string;
        icon: string;
        messageMode: import("../../club-group-chats/club-group-message.util").ClubGroupMessageMode;
        membershipStatus: string;
        membershipId: string;
        requestedAt: Date;
    }[]>;
    requestJoin(userId: string, groupChatId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        groupChat: {
            id: string;
            icon: string;
            pageName: string;
        };
    }>;
    /** Approved group chats only (for chat widget after approval). */
    listForUser(userId: string): Promise<{
        messageMode: import("../../club-group-chats/club-group-message.util").ClubGroupMessageMode;
        id: string;
        icon: string;
        pageName: string;
        clubKey: string;
    }[]>;
    listMessages(userId: string, groupChatId: string): Promise<{
        categoryAdmin: {
            id: string;
            name: string;
        } | null;
        subCategoryAdmin: {
            id: string;
            name: string;
        } | null;
        user: {
            id: string;
            name: string;
            profilePicUrl: string | null;
        } | null;
        id: string;
        createdAt: Date;
        body: string;
        replyTo: {
            categoryAdmin: {
                id: string;
                name: string;
            } | null;
            user: {
                id: string;
                name: string;
            } | null;
            id: string;
            body: string;
            attachmentUrl: string | null;
            attachmentType: string | null;
            attachmentName: string | null;
        } | null;
        attachmentUrl: string | null;
        attachmentType: string | null;
        attachmentName: string | null;
        replyToMessageId: string | null;
    }[]>;
    sendMessage(userId: string, groupChatId: string, dto: SendClubGroupMessageDto): Promise<{
        categoryAdmin: {
            id: string;
            name: string;
        } | null;
        subCategoryAdmin: {
            id: string;
            name: string;
        } | null;
        user: {
            id: string;
            name: string;
            profilePicUrl: string | null;
        } | null;
        id: string;
        createdAt: Date;
        body: string;
        replyTo: {
            categoryAdmin: {
                id: string;
                name: string;
            } | null;
            user: {
                id: string;
                name: string;
            } | null;
            id: string;
            body: string;
            attachmentUrl: string | null;
            attachmentType: string | null;
            attachmentName: string | null;
        } | null;
        attachmentUrl: string | null;
        attachmentType: string | null;
        attachmentName: string | null;
        replyToMessageId: string | null;
    }>;
}
