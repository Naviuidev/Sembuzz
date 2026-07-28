import { PrismaService } from '../../../prisma/prisma.service';
import { type ClubGroupMessageMode } from '../../club-group-chats/club-group-message.util';
import { SubCategoryAdminSendClubGroupMessageDto } from './dto/send-club-group-message.dto';
export declare class SubCategoryAdminClubGroupChatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getChatForSchool;
    listForSchool(schoolId: string): Promise<{
        id: string;
        clubKey: string;
        pageName: string;
        icon: string;
        messageMode: ClubGroupMessageMode;
        approvedMemberCount: number;
    }[]>;
    updateMessageMode(groupChatId: string, schoolId: string, messageMode: ClubGroupMessageMode): Promise<{
        messageMode: ClubGroupMessageMode;
        id: string;
        icon: string;
        pageName: string;
        clubKey: string;
    }>;
    listApprovedMembers(groupChatId: string, schoolId: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
        id: string;
        reviewedAt: Date | null;
    }[]>;
    listMessages(groupChatId: string, schoolId: string): Promise<{
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
    sendMessage(groupChatId: string, schoolId: string, subCategoryAdminId: string, dto: SubCategoryAdminSendClubGroupMessageDto): Promise<{
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
