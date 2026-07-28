import { ClubGroupChatRequestsService } from '../../club-group-chat-requests/club-group-chat-requests.service';
import { CreateClubGroupChatRequestDto } from '../../club-group-chat-requests/dto/create-club-group-chat-request.dto';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class SubCategoryAdminClubGroupChatRequestsController {
    private readonly service;
    private readonly prisma;
    constructor(service: ClubGroupChatRequestsService, prisma: PrismaService);
    private schoolIdForAdmin;
    listClubs(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        hasGroupChat: boolean;
        hasPendingRequest: boolean;
        key: string;
        pageName: string;
        icon: string;
        accountIds: string[];
        socialLinkCount: number;
    }[]>;
    listMine(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        subCategoryAdmin: {
            id: string;
            name: string;
            email: string;
        };
        schoolId: string;
        id: string;
        status: string;
        createdAt: Date;
        icon: string;
        note: string | null;
        pageName: string;
        clubKey: string;
        reviewedByRole: string | null;
        reviewedByAdminId: string | null;
        declineReason: string | null;
        clubGroupChatId: string | null;
        reviewedAt: Date | null;
    }[]>;
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateClubGroupChatRequestDto): Promise<{
        subCategoryAdmin: {
            id: string;
            name: string;
            email: string;
        };
        schoolId: string;
        id: string;
        status: string;
        createdAt: Date;
        icon: string;
        note: string | null;
        pageName: string;
        clubKey: string;
        reviewedByRole: string | null;
        reviewedByAdminId: string | null;
        declineReason: string | null;
        clubGroupChatId: string | null;
        reviewedAt: Date | null;
    }>;
}
