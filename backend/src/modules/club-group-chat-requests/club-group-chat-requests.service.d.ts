import { PrismaService } from '../../prisma/prisma.service';
import { type ClubGroupChatRequestStatus } from './club-group-chat-requests.util';
import { CreateClubGroupChatRequestDto } from './dto/create-club-group-chat-request.dto';
import { DeclineClubGroupChatRequestDto } from './dto/decline-club-group-chat-request.dto';
export declare class ClubGroupChatRequestsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private assertGroupMessagingEnabled;
    listClubsForSchool(schoolId: string): Promise<{
        hasGroupChat: boolean;
        hasPendingRequest: boolean;
        key: string;
        pageName: string;
        icon: string;
        accountIds: string[];
        socialLinkCount: number;
    }[]>;
    listForSubCategoryAdmin(subCategoryAdminId: string): Promise<{
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
    createForSubCategoryAdmin(subCategoryAdminId: string, dto: CreateClubGroupChatRequestDto): Promise<{
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
    listForSchoolReview(schoolId: string, status?: ClubGroupChatRequestStatus): Promise<{
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
    private getPendingRequestForSchool;
    private provisionClubGroupChat;
    approve(requestId: string, schoolId: string, reviewerRole: 'category_admin' | 'school_admin', reviewerAdminId: string): Promise<{
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
    decline(requestId: string, schoolId: string, reviewerRole: 'category_admin' | 'school_admin', reviewerAdminId: string, dto: DeclineClubGroupChatRequestDto): Promise<{
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
