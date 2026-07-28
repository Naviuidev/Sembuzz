import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStudentChatGroupDto } from '../../user/student-chat-groups/dto/create-student-chat-group.dto';
export declare class SubCategoryAdminStudentChatGroupsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private assertGroupMessagingEnabled;
    private formatGroupRow;
    listForSchool(schoolId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        avatarUrl: string | null;
        visibility: import("../../student-chat-groups/student-chat-message.util").StudentChatGroupVisibility;
        memberCount: number;
        lastMessageAt: Date;
        createdAt: Date;
    }[]>;
    searchStudents(schoolId: string, q?: string): Promise<{
        id: string;
        name: string;
        email: string;
        profilePicUrl: string | null;
    }[]>;
    createGroup(subCategoryAdminId: string, schoolId: string, dto: CreateStudentChatGroupDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        avatarUrl: string | null;
        visibility: import("../../student-chat-groups/student-chat-message.util").StudentChatGroupVisibility;
        memberCount: number;
        lastMessageAt: Date;
        createdAt: Date;
    }>;
    private getGroupForSchool;
    listMembers(groupId: string, schoolId: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
        role: string;
        joinedAt: Date;
    }[]>;
    addMember(groupId: string, schoolId: string, userId: string): Promise<{
        ok: boolean;
    }>;
}
