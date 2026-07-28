import { UserStudentChatGroupsService } from './user-student-chat-groups.service';
import { CreateStudentChatGroupDto } from './dto/create-student-chat-group.dto';
import { SendStudentChatGroupMessageDto } from './dto/send-student-chat-group-message.dto';
import { AddStudentChatGroupMemberDto } from './dto/add-student-chat-group-member.dto';
export declare class UserStudentChatGroupsController {
    private readonly service;
    constructor(service: UserStudentChatGroupsService);
    unreadCount(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        unreadCount: number;
    }>;
    inbox(req: {
        user: {
            sub: string;
        };
    }): Promise<{
        id: string;
        name: string;
        description: string | null;
        avatarUrl: string | null;
        visibility: import("../../student-chat-groups/student-chat-message.util").StudentChatGroupVisibility;
        createdByUserId: string | null;
        lastMessageAt: Date;
        memberCount: number;
        memberRole: string | null;
        unreadCount: number;
        lastMessagePreview: string | null;
        lastMessageSenderName: string | null;
    }[]>;
    discover(req: {
        user: {
            sub: string;
        };
    }): Promise<never[]>;
    create(req: {
        user: {
            sub: string;
        };
    }, dto: CreateStudentChatGroupDto): Promise<void>;
    uploadAttachment(file: Express.Multer.File): Promise<{
        url: string;
        attachmentType: import("../../chat-messages/chat-attachment.util").ChatAttachmentType;
        attachmentName: string;
    }>;
    join(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<void>;
    leave(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        ok: boolean;
    }>;
    markRead(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        ok: boolean;
    }>;
    members(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
        role: string;
        joinedAt: Date;
        user: {
            id: string;
            name: string;
            email: string;
            profilePicUrl: string | null;
        };
    }[]>;
    addMember(req: {
        user: {
            sub: string;
        };
    }, id: string, dto: AddStudentChatGroupMemberDto): Promise<{
        ok: boolean;
    }>;
    listMessages(req: {
        user: {
            sub: string;
        };
    }, id: string): Promise<{
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
        } | null;
        attachmentUrl: string | null;
        attachmentType: string | null;
        attachmentName: string | null;
        replyToMessageId: string | null;
        senderUserId: string;
    }[]>;
    sendMessage(req: {
        user: {
            sub: string;
        };
    }, id: string, dto: SendStudentChatGroupMessageDto): Promise<{
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
        } | null;
        attachmentUrl: string | null;
        attachmentType: string | null;
        attachmentName: string | null;
        replyToMessageId: string | null;
        senderUserId: string;
    }>;
}
