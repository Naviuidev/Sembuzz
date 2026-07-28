import { ClubGroupChatRequestsService } from '../../club-group-chat-requests/club-group-chat-requests.service';
import { DeclineClubGroupChatRequestDto } from '../../club-group-chat-requests/dto/decline-club-group-chat-request.dto';
import type { ClubGroupChatRequestStatus } from '../../club-group-chat-requests/club-group-chat-requests.util';
export declare class CategoryAdminClubGroupChatRequestsController {
    private readonly service;
    constructor(service: ClubGroupChatRequestsService);
    list(req: {
        user: {
            schoolId: string;
        };
    }, status?: ClubGroupChatRequestStatus): Promise<{
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
    approve(req: {
        user: {
            sub: string;
            schoolId: string;
        };
    }, id: string): Promise<{
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
    decline(req: {
        user: {
            sub: string;
            schoolId: string;
        };
    }, id: string, dto: DeclineClubGroupChatRequestDto): Promise<{
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
