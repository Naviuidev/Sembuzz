import { CategoryAdminClubGroupMembershipsService } from './category-admin-club-group-memberships.service';
export declare class CategoryAdminClubGroupMembershipsController {
    private readonly service;
    constructor(service: CategoryAdminClubGroupMembershipsService);
    list(req: {
        user: {
            schoolId: string;
        };
    }, status?: string): Promise<{
        school: {
            id: string;
            name: string;
        };
        user: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            profilePicUrl: string | null;
            registrationMethod: string | null;
        };
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        reviewedAt: Date | null;
        groupChat: {
            id: string;
            icon: string;
            pageName: string;
            clubKey: string;
        };
        reviewedBy: {
            id: string;
            name: string;
            email: string;
        } | null;
    }[]>;
    approve(req: {
        user: {
            schoolId: string;
            sub: string;
        };
    }, id: string): Promise<{
        id: string;
        status: string;
    }>;
    ban(req: {
        user: {
            schoolId: string;
            sub: string;
        };
    }, id: string): Promise<{
        id: string;
        status: string;
    }>;
}
