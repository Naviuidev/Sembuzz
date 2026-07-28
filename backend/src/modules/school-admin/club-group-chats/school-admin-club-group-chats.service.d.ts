import { PrismaService } from '../../../prisma/prisma.service';
import { UpsertClubGroupChatDto } from './dto/upsert-club-group-chat.dto';
export declare class SchoolAdminClubGroupChatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private assertGroupMessagingEnabled;
    listForSchool(schoolId: string): Promise<{
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
    upsert(schoolId: string, dto: UpsertClubGroupChatDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isEnabled: boolean;
        icon: string;
        pageName: string;
        clubKey: string;
    }>;
    findByClubKey(schoolId: string, clubKey: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isEnabled: boolean;
        icon: string;
        pageName: string;
        clubKey: string;
    }>;
}
