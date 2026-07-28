import { PrismaService } from '../../../prisma/prisma.service';
export declare class SubCategoryAdminDirectChatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSetting(schoolId: string): Promise<{
        isEnabled: boolean;
    }>;
    updateSetting(schoolId: string, isEnabled: boolean): Promise<{
        isEnabled: boolean;
    }>;
    listConversations(schoolId: string): Promise<{
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
    listMessages(schoolId: string, conversationId: string): Promise<{
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
    } | null>;
}
