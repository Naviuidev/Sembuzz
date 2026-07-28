import { CategoryAdminDirectChatsService } from './category-admin-direct-chats.service';
import { UpdateDirectMessagingSettingDto } from './dto/update-direct-messaging-setting.dto';
export declare class CategoryAdminDirectChatsController {
    private readonly service;
    constructor(service: CategoryAdminDirectChatsService);
    getSettings(req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        isEnabled: boolean;
    }>;
    updateSettings(req: {
        user: {
            schoolId: string;
        };
    }, dto: UpdateDirectMessagingSettingDto): Promise<{
        isEnabled: boolean;
    }>;
    list(req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        id: string;
        status: string;
        lastMessageAt: Date;
        messageCount: number;
        userOne: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
        userTwo: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
        lastMessagePreview: string;
    }[]>;
    listMessages(req: {
        user: {
            schoolId: string;
        };
    }, id: string): Promise<{
        conversation: {
            id: string;
            userOne: {
                id: string;
                name: string;
                email: string;
                profilePicUrl: string | null;
            };
            userTwo: {
                id: string;
                name: string;
                email: string;
                profilePicUrl: string | null;
            };
        };
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
    }>;
}
