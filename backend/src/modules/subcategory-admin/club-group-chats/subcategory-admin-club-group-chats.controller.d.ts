import { SubCategoryAdminClubGroupChatsService } from './subcategory-admin-club-group-chats.service';
import { UpdateClubGroupMessageModeDto } from './dto/update-message-mode.dto';
import { SubCategoryAdminSendClubGroupMessageDto } from './dto/send-club-group-message.dto';
export declare class SubCategoryAdminClubGroupChatsController {
    private readonly service;
    constructor(service: SubCategoryAdminClubGroupChatsService);
    list(req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        id: string;
        clubKey: string;
        pageName: string;
        icon: string;
        messageMode: import("../../club-group-chats/club-group-message.util").ClubGroupMessageMode;
        approvedMemberCount: number;
    }[]>;
    updateMessageMode(req: {
        user: {
            schoolId: string;
        };
    }, id: string, dto: UpdateClubGroupMessageModeDto): Promise<{
        messageMode: import("../../club-group-chats/club-group-message.util").ClubGroupMessageMode;
        id: string;
        icon: string;
        pageName: string;
        clubKey: string;
    }>;
    listApprovedMembers(req: {
        user: {
            schoolId: string;
        };
    }, id: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
        id: string;
        reviewedAt: Date | null;
    }[]>;
    listMessages(req: {
        user: {
            schoolId: string;
        };
    }, id: string): Promise<{
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
    sendMessage(req: {
        user: {
            schoolId: string;
            sub: string;
        };
    }, id: string, dto: SubCategoryAdminSendClubGroupMessageDto): Promise<{
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
