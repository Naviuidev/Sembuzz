"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStudentChatGroupsService = void 0;
const common_1 = require("@nestjs/common");
const chat_attachment_util_1 = require("../../chat-messages/chat-attachment.util");
const student_chat_message_util_1 = require("../../student-chat-groups/student-chat-message.util");
const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';
let UserStudentChatGroupsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserStudentChatGroupsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserStudentChatGroupsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async getActiveUser(userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    schoolId: true,
                    status: true,
                    name: true,
                    email: true,
                    profilePicUrl: true,
                },
            });
            if (!user || user.status !== 'active') {
                throw new common_1.ForbiddenException('Account is not active.');
            }
            return user;
        }
        async assertGroupMessagingEnabled(schoolId) {
            const enabled = await this.prisma.schoolFeature.findFirst({
                where: {
                    schoolId,
                    isEnabled: true,
                    feature: { code: GROUP_MESSAGING_CODE },
                },
                select: { id: true },
            });
            if (!enabled) {
                throw new common_1.ForbiddenException('Group messaging is not available for your school.');
            }
        }
        async getActiveMembership(userId, groupId) {
            const membership = await this.prisma.studentChatGroupMember.findUnique({
                where: { groupId_userId: { groupId, userId } },
                select: { id: true, status: true, role: true, lastReadAt: true },
            });
            if (!membership || membership.status !== 'active') {
                throw new common_1.ForbiddenException('You are not a member of this group.');
            }
            return membership;
        }
        async getGroupForUser(userId, groupId) {
            const user = await this.getActiveUser(userId);
            await this.assertGroupMessagingEnabled(user.schoolId);
            const group = await this.prisma.studentChatGroup.findFirst({
                where: {
                    id: groupId,
                    schoolId: user.schoolId,
                    isActive: true,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    avatarUrl: true,
                    visibility: true,
                    createdByUserId: true,
                    lastMessageAt: true,
                    createdAt: true,
                    _count: { select: { members: { where: { status: 'active' } } } },
                },
            });
            if (!group)
                throw new common_1.NotFoundException('Group not found.');
            return { user, group };
        }
        formatGroupRow(group, extras = {}) {
            return {
                id: group.id,
                name: group.name,
                description: group.description,
                avatarUrl: group.avatarUrl,
                visibility: (0, student_chat_message_util_1.isStudentChatGroupVisibility)(group.visibility) ? group.visibility : 'public',
                createdByUserId: group.createdByUserId,
                lastMessageAt: group.lastMessageAt ?? group.createdAt,
                memberCount: group._count.members,
                memberRole: extras.memberRole ?? null,
                unreadCount: extras.unreadCount ?? 0,
                lastMessagePreview: extras.lastMessagePreview ?? null,
                lastMessageSenderName: extras.lastMessageSenderName ?? null,
            };
        }
        async getUnreadCount(userId) {
            const user = await this.getActiveUser(userId);
            await this.assertGroupMessagingEnabled(user.schoolId);
            const memberships = await this.prisma.studentChatGroupMember.findMany({
                where: {
                    userId: user.id,
                    schoolId: user.schoolId,
                    status: 'active',
                    group: { isActive: true },
                },
                select: {
                    lastReadAt: true,
                    groupId: true,
                },
            });
            if (memberships.length === 0) {
                return { unreadCount: 0 };
            }
            let total = 0;
            for (const m of memberships) {
                const count = await this.prisma.studentChatGroupMessage.count({
                    where: {
                        groupId: m.groupId,
                        createdAt: m.lastReadAt ? { gt: m.lastReadAt } : undefined,
                        NOT: { senderUserId: user.id },
                    },
                });
                total += count;
            }
            return { unreadCount: total };
        }
        /** Groups the student is an active member of (inbox). */
        async listInbox(userId) {
            const user = await this.getActiveUser(userId);
            await this.assertGroupMessagingEnabled(user.schoolId);
            const memberships = await this.prisma.studentChatGroupMember.findMany({
                where: {
                    userId: user.id,
                    schoolId: user.schoolId,
                    status: 'active',
                    group: { isActive: true },
                },
                orderBy: { group: { lastMessageAt: 'desc' } },
                select: {
                    role: true,
                    lastReadAt: true,
                    group: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            avatarUrl: true,
                            visibility: true,
                            createdByUserId: true,
                            lastMessageAt: true,
                            createdAt: true,
                            _count: { select: { members: { where: { status: 'active' } } } },
                            messages: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                                select: {
                                    body: true,
                                    attachmentType: true,
                                    attachmentName: true,
                                    createdAt: true,
                                    sender: { select: { name: true } },
                                },
                            },
                        },
                    },
                },
            });
            const rows = await Promise.all(memberships.map(async (m) => {
                const last = m.group.messages[0] ?? null;
                const unreadCount = await this.prisma.studentChatGroupMessage.count({
                    where: {
                        groupId: m.group.id,
                        createdAt: m.lastReadAt ? { gt: m.lastReadAt } : undefined,
                        NOT: { senderUserId: user.id },
                    },
                });
                return this.formatGroupRow(m.group, {
                    memberRole: m.role,
                    unreadCount,
                    lastMessagePreview: last
                        ? (0, chat_attachment_util_1.chatMessagePreviewText)(last.body, last.attachmentType, last.attachmentName)
                        : null,
                    lastMessageSenderName: last?.sender.name ?? null,
                });
            }));
            rows.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
            return rows;
        }
        /** Public groups at the school — students are added by subcategory admin only. */
        async listDiscoverable(userId) {
            await this.getActiveUser(userId);
            return [];
        }
        async createGroup(userId, dto) {
            await this.getActiveUser(userId);
            throw new common_1.ForbiddenException('Only your subcategory admin can create chat groups. Ask them to add you to a group.');
        }
        async joinGroup(userId, groupId) {
            await this.getActiveUser(userId);
            throw new common_1.ForbiddenException('Only your subcategory admin can add you to a group.');
        }
        async leaveGroup(userId, groupId) {
            await this.getGroupForUser(userId, groupId);
            const membership = await this.getActiveMembership(userId, groupId);
            if (membership.role === 'owner') {
                const ownerCount = await this.prisma.studentChatGroupMember.count({
                    where: { groupId, status: 'active', role: 'owner' },
                });
                const memberCount = await this.prisma.studentChatGroupMember.count({
                    where: { groupId, status: 'active' },
                });
                if (memberCount > 1 && ownerCount === 1) {
                    const next = await this.prisma.studentChatGroupMember.findFirst({
                        where: { groupId, status: 'active', userId: { not: userId } },
                        orderBy: { joinedAt: 'asc' },
                    });
                    if (next) {
                        await this.prisma.studentChatGroupMember.update({
                            where: { id: next.id },
                            data: { role: 'owner' },
                        });
                    }
                }
            }
            await this.prisma.studentChatGroupMember.update({
                where: { groupId_userId: { groupId, userId } },
                data: { status: 'left' },
            });
            return { ok: true };
        }
        async addMember(userId, groupId, targetUserId) {
            const { user, group } = await this.getGroupForUser(userId, groupId);
            const membership = await this.getActiveMembership(userId, groupId);
            if (membership.role !== 'owner' && membership.role !== 'admin') {
                throw new common_1.ForbiddenException('Only group owners and admins can add members.');
            }
            if (targetUserId === user.id) {
                throw new common_1.BadRequestException('You are already in this group.');
            }
            const target = await this.prisma.user.findFirst({
                where: { id: targetUserId, schoolId: user.schoolId, status: 'active' },
                select: { id: true },
            });
            if (!target) {
                throw new common_1.NotFoundException('Student not found at your school.');
            }
            const existing = await this.prisma.studentChatGroupMember.findUnique({
                where: { groupId_userId: { groupId, userId: targetUserId } },
            });
            if (existing?.status === 'active') {
                throw new common_1.BadRequestException('This student is already in the group.');
            }
            if (existing?.status === 'banned') {
                throw new common_1.ForbiddenException('This student cannot be added to the group.');
            }
            if (existing) {
                await this.prisma.studentChatGroupMember.update({
                    where: { id: existing.id },
                    data: { status: 'active', joinedAt: new Date(), lastReadAt: new Date() },
                });
            }
            else {
                await this.prisma.studentChatGroupMember.create({
                    data: {
                        groupId,
                        userId: targetUserId,
                        schoolId: user.schoolId,
                        role: 'member',
                        status: 'active',
                        lastReadAt: new Date(),
                    },
                });
            }
            return { ok: true };
        }
        async listMembers(userId, groupId) {
            await this.getGroupForUser(userId, groupId);
            await this.getActiveMembership(userId, groupId);
            const members = await this.prisma.studentChatGroupMember.findMany({
                where: { groupId, status: 'active' },
                orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
                select: {
                    role: true,
                    joinedAt: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePicUrl: true,
                        },
                    },
                },
            });
            return members.map((m) => ({
                role: m.role,
                joinedAt: m.joinedAt,
                user: m.user,
            }));
        }
        async markRead(userId, groupId) {
            await this.getGroupForUser(userId, groupId);
            await this.getActiveMembership(userId, groupId);
            await this.prisma.studentChatGroupMember.update({
                where: { groupId_userId: { groupId, userId } },
                data: { lastReadAt: new Date() },
            });
            return { ok: true };
        }
        async listMessages(userId, groupId) {
            await this.getGroupForUser(userId, groupId);
            await this.getActiveMembership(userId, groupId);
            const messages = await this.prisma.studentChatGroupMessage.findMany({
                where: { groupId },
                orderBy: { createdAt: 'asc' },
                take: 200,
                select: student_chat_message_util_1.STUDENT_CHAT_MESSAGE_SELECT,
            });
            await this.markRead(userId, groupId);
            return messages;
        }
        async sendMessage(userId, groupId, dto) {
            const { user } = await this.getGroupForUser(userId, groupId);
            await this.getActiveMembership(userId, groupId);
            const payload = (0, chat_attachment_util_1.parseChatMessagePayload)(dto);
            if (payload.replyToMessageId) {
                const reply = await this.prisma.studentChatGroupMessage.findFirst({
                    where: { id: payload.replyToMessageId, groupId },
                    select: { id: true },
                });
                if (!reply) {
                    throw new common_1.BadRequestException('The message you are replying to was not found.');
                }
            }
            const message = await this.prisma.$transaction(async (tx) => {
                const created = await tx.studentChatGroupMessage.create({
                    data: {
                        groupId,
                        senderUserId: user.id,
                        body: payload.body,
                        attachmentUrl: payload.attachmentUrl,
                        attachmentType: payload.attachmentType,
                        attachmentName: payload.attachmentName,
                        replyToMessageId: payload.replyToMessageId,
                    },
                    select: student_chat_message_util_1.STUDENT_CHAT_MESSAGE_SELECT,
                });
                await tx.studentChatGroup.update({
                    where: { id: groupId },
                    data: { lastMessageAt: new Date() },
                });
                await tx.studentChatGroupMember.update({
                    where: { groupId_userId: { groupId, userId: user.id } },
                    data: { lastReadAt: new Date() },
                });
                return created;
            });
            return message;
        }
    };
    return UserStudentChatGroupsService = _classThis;
})();
exports.UserStudentChatGroupsService = UserStudentChatGroupsService;
//# sourceMappingURL=user-student-chat-groups.service.js.map