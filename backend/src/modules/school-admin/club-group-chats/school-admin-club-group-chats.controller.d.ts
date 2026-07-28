import { SchoolAdminClubGroupChatsService } from './school-admin-club-group-chats.service';
import { UpsertClubGroupChatDto } from './dto/upsert-club-group-chat.dto';
export declare class SchoolAdminClubGroupChatsController {
    private readonly service;
    constructor(service: SchoolAdminClubGroupChatsService);
    list(req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            messages: number;
        };
        isEnabled: boolean;
        icon: string;
        pageName: string;
        clubKey: string;
    }[]>;
    findByClubKey(req: {
        user: {
            schoolId: string;
        };
    }, clubKey: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isEnabled: boolean;
        icon: string;
        pageName: string;
        clubKey: string;
    }>;
    upsert(req: {
        user: {
            schoolId: string;
        };
    }, dto: UpsertClubGroupChatDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isEnabled: boolean;
        icon: string;
        pageName: string;
        clubKey: string;
    }>;
}
