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
exports.UserClubGroupChatsService = void 0;
const common_1 = require("@nestjs/common");
const club_group_message_util_1 = require("../../club-group-chats/club-group-message.util");
const chat_attachment_util_1 = require("../../chat-messages/chat-attachment.util");
const GROUP_MESSAGING_CODE = 'GROUP_MESSAGING';
let UserClubGroupChatsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserClubGroupChatsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserClubGroupChatsService = _classThis = _classDescriptor.value;
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
                    school: { select: { name: true } },
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
        async assertApprovedMember(userId, groupChatId) {
            const membership = await this.prisma.clubGroupMembership.findUnique({
                where: { groupChatId_userId: { groupChatId, userId } },
                select: { status: true },
            });
            if (!membership || membership.status !== 'approved') {
                throw new common_1.ForbiddenException('You must be approved to access this group chat. Request to join and wait for subcategory admin approval.');
            }
        }
        async getChatForUser(userId, groupChatId) {
            const user = await this.getActiveUser(userId);
            await this.assertGroupMessagingEnabled(user.schoolId);
            const chat = await this.prisma.clubGroupChat.findFirst({
                where: {
                    id: groupChatId,
                    schoolId: user.schoolId,
                    isEnabled: true,
                },
                select: {
                    id: true,
                    clubKey: true,
                    pageName: true,
                    icon: true,
                },
            });
            if (!chat)
                throw new common_1.NotFoundException('Group chat not found.');
            return { user, chat };
        }
        /** Chats the user may join (with membership status). */
        async listJoinable(userId) {
            const user = await this.getActiveUser(userId);
            await this.assertGroupMessagingEnabled(user.schoolId);
            const chats = await this.prisma.clubGroupChat.findMany({
                where: { schoolId: user.schoolId, isEnabled: true },
                orderBy: { pageName: 'asc' },
                select: {
                    id: true,
                    clubKey: true,
                    pageName: true,
                    icon: true,
                    messageMode: true,
                    memberships: {
                        where: { userId: user.id },
                        select: { id: true, status: true, createdAt: true },
                        take: 1,
                    },
                },
            });
            return chats.map((c) => ({
                id: c.id,
                clubKey: c.clubKey,
                pageName: c.pageName,
                icon: c.icon,
                messageMode: (0, club_group_message_util_1.isClubGroupMessageMode)(c.messageMode) ? c.messageMode : 'members',
                membershipStatus: c.memberships[0]?.status ?? null,
                membershipId: c.memberships[0]?.id ?? null,
                requestedAt: c.memberships[0]?.createdAt ?? null,
            }));
        }
        async requestJoin(userId, groupChatId) {
            const { user, chat } = await this.getChatForUser(userId, groupChatId);
            const existing = await this.prisma.clubGroupMembership.findUnique({
                where: { groupChatId_userId: { groupChatId, userId: user.id } },
            });
            if (existing) {
                if (existing.status === 'pending') {
                    throw new common_1.BadRequestException('Your join request is already pending approval.');
                }
                if (existing.status === 'approved') {
                    throw new common_1.BadRequestException('You are already a member of this group.');
                }
                if (existing.status === 'banned') {
                    throw new common_1.ForbiddenException('You are not allowed to join this group. Contact your subcategory admin.');
                }
            }
            const membership = await this.prisma.clubGroupMembership.create({
                data: {
                    groupChatId: chat.id,
                    userId: user.id,
                    schoolId: user.schoolId,
                    status: 'pending',
                },
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    groupChat: { select: { id: true, pageName: true, icon: true } },
                },
            });
            return membership;
        }
        /** Approved group chats only (for chat widget after approval). */
        async listForUser(userId) {
            const user = await this.getActiveUser(userId);
            await this.assertGroupMessagingEnabled(user.schoolId);
            const memberships = await this.prisma.clubGroupMembership.findMany({
                where: {
                    userId: user.id,
                    schoolId: user.schoolId,
                    status: 'approved',
                    groupChat: { isEnabled: true },
                },
                orderBy: { groupChat: { pageName: 'asc' } },
                select: {
                    groupChat: {
                        select: {
                            id: true,
                            clubKey: true,
                            pageName: true,
                            icon: true,
                            messageMode: true,
                        },
                    },
                },
            });
            return memberships.map((m) => ({
                ...m.groupChat,
                messageMode: (0, club_group_message_util_1.isClubGroupMessageMode)(m.groupChat.messageMode)
                    ? m.groupChat.messageMode
                    : 'members',
            }));
        }
        async listMessages(userId, groupChatId) {
            await this.getChatForUser(userId, groupChatId);
            await this.assertApprovedMember(userId, groupChatId);
            return this.prisma.clubGroupMessage.findMany({
                where: { groupChatId },
                orderBy: { createdAt: 'asc' },
                take: 200,
                select: club_group_message_util_1.CLUB_GROUP_MESSAGE_SELECT,
            });
        }
        async sendMessage(userId, groupChatId, dto) {
            const { user } = await this.getChatForUser(userId, groupChatId);
            await this.assertApprovedMember(userId, groupChatId);
            const chat = await this.prisma.clubGroupChat.findFirst({
                where: { id: groupChatId, schoolId: user.schoolId, isEnabled: true },
                select: { messageMode: true },
            });
            const messageMode = (0, club_group_message_util_1.isClubGroupMessageMode)(chat?.messageMode ?? '')
                ? chat.messageMode
                : 'members';
            if (messageMode === 'admin_only') {
                throw new common_1.ForbiddenException('Only subcategory admins can send messages in this group. You can read messages from your admin.');
            }
            const payload = (0, chat_attachment_util_1.parseChatMessagePayload)(dto);
            if (payload.replyToMessageId) {
                const reply = await this.prisma.clubGroupMessage.findFirst({
                    where: { id: payload.replyToMessageId, groupChatId },
                    select: { id: true },
                });
                if (!reply) {
                    throw new common_1.BadRequestException('The message you are replying to was not found.');
                }
            }
            return this.prisma.clubGroupMessage.create({
                data: {
                    groupChatId,
                    userId: user.id,
                    body: payload.body,
                    attachmentUrl: payload.attachmentUrl,
                    attachmentType: payload.attachmentType,
                    attachmentName: payload.attachmentName,
                    replyToMessageId: payload.replyToMessageId,
                },
                select: club_group_message_util_1.CLUB_GROUP_MESSAGE_SELECT,
            });
        }
    };
    return UserClubGroupChatsService = _classThis;
})();
exports.UserClubGroupChatsService = UserClubGroupChatsService;
//# sourceMappingURL=user-club-group-chats.service.js.map