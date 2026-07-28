import { UserClubGroupChatsService } from './user-club-group-chats.service';
import { SendClubGroupMessageDto } from './dto/send-club-group-message.dto';
export declare class UserClubGroupChatsController {
    private readonly service;
    constructor(service: UserClubGroupChatsService);
    listJoinable(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        id: string;
        clubKey: string;
        pageName: string;
        icon: string;
        messageMode: import("../../club-group-chats/club-group-message.util").ClubGroupMessageMode;
        membershipStatus: string;
        membershipId: string;
        requestedAt: Date;
    }[]>;
    list(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        messageMode: import("../../club-group-chats/club-group-message.util").ClubGroupMessageMode;
        id: string;
        icon: string;
        pageName: string;
        clubKey: string;
    }[]>;
    uploadAttachment(file: Express.Multer.File): Promise<{
        url: string;
        attachmentType: import("../../chat-messages/chat-attachment.util").ChatAttachmentType;
        attachmentName: string;
    }>;
    requestJoin(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        groupChat: {
            id: string;
            icon: string;
            pageName: string;
        };
    }>;
    listMessages(req: {
        user: {
            sub: string;
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
            sub: string;
        };
    }, id: string, dto: SendClubGroupMessageDto): Promise<{
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
