import { SubCategoryAdminStudentChatGroupsService } from './subcategory-admin-student-chat-groups.service';
import { CreateStudentChatGroupDto } from '../../user/student-chat-groups/dto/create-student-chat-group.dto';
import { AddStudentChatGroupMemberDto } from '../../user/student-chat-groups/dto/add-student-chat-group-member.dto';
export declare class SubCategoryAdminStudentChatGroupsController {
    private readonly service;
    constructor(service: SubCategoryAdminStudentChatGroupsService);
    list(req: {
        user: {
            schoolId: string;
        };
    }): Promise<{
        id: string;
        name: string;
        description: string | null;
        avatarUrl: string | null;
        visibility: import("../../student-chat-groups/student-chat-message.util").StudentChatGroupVisibility;
        memberCount: number;
        lastMessageAt: Date;
        createdAt: Date;
    }[]>;
    searchStudents(req: {
        user: {
            schoolId: string;
        };
    }, q?: string): Promise<{
        id: string;
        name: string;
        email: string;
        profilePicUrl: string | null;
    }[]>;
    create(req: {
        user: {
            schoolId: string;
            sub: string;
        };
    }, dto: CreateStudentChatGroupDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        avatarUrl: string | null;
        visibility: import("../../student-chat-groups/student-chat-message.util").StudentChatGroupVisibility;
        memberCount: number;
        lastMessageAt: Date;
        createdAt: Date;
    }>;
    members(req: {
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
        role: string;
        joinedAt: Date;
    }[]>;
    addMember(req: {
        user: {
            schoolId: string;
        };
    }, id: string, dto: AddStudentChatGroupMemberDto): Promise<{
        ok: boolean;
    }>;
}
