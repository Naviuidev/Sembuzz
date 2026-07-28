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
exports.SubCategoryAdminClubGroupChatsService = void 0;
const common_1 = require("@nestjs/common");
const club_group_message_util_1 = require("../../club-group-chats/club-group-message.util");
const chat_attachment_util_1 = require("../../chat-messages/chat-attachment.util");
let SubCategoryAdminClubGroupChatsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SubCategoryAdminClubGroupChatsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubCategoryAdminClubGroupChatsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async getChatForSchool(groupChatId, schoolId) {
            const chat = await this.prisma.clubGroupChat.findFirst({
                where: { id: groupChatId, schoolId, isEnabled: true },
                select: {
                    id: true,
                    clubKey: true,
                    pageName: true,
                    icon: true,
                    messageMode: true,
                },
            });
            if (!chat)
                throw new common_1.NotFoundException('Group chat not found.');
            return chat;
        }
        async listForSchool(schoolId) {
            const chats = await this.prisma.clubGroupChat.findMany({
                where: { schoolId, isEnabled: true },
                orderBy: { pageName: 'asc' },
                select: {
                    id: true,
                    clubKey: true,
                    pageName: true,
                    icon: true,
                    messageMode: true,
                    _count: {
                        select: {
                            memberships: { where: { status: 'approved' } },
                        },
                    },
                },
            });
            return chats.map((chat) => ({
                id: chat.id,
                clubKey: chat.clubKey,
                pageName: chat.pageName,
                icon: chat.icon,
                messageMode: (0, club_group_message_util_1.isClubGroupMessageMode)(chat.messageMode) ? chat.messageMode : 'members',
                approvedMemberCount: chat._count.memberships,
            }));
        }
        async updateMessageMode(groupChatId, schoolId, messageMode) {
            await this.getChatForSchool(groupChatId, schoolId);
            const updated = await this.prisma.clubGroupChat.update({
                where: { id: groupChatId },
                data: { messageMode },
                select: {
                    id: true,
                    clubKey: true,
                    pageName: true,
                    icon: true,
                    messageMode: true,
                },
            });
            return {
                ...updated,
                messageMode: (0, club_group_message_util_1.isClubGroupMessageMode)(updated.messageMode)
                    ? updated.messageMode
                    : 'members',
            };
        }
        async listApprovedMembers(groupChatId, schoolId) {
            await this.getChatForSchool(groupChatId, schoolId);
            return this.prisma.clubGroupMembership.findMany({
                where: { groupChatId, schoolId, status: 'approved' },
                orderBy: { user: { name: 'asc' } },
                select: {
                    id: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profilePicUrl: true,
                        },
                    },
                    reviewedAt: true,
                },
            });
        }
        async listMessages(groupChatId, schoolId) {
            await this.getChatForSchool(groupChatId, schoolId);
            return this.prisma.clubGroupMessage.findMany({
                where: { groupChatId },
                orderBy: { createdAt: 'asc' },
                take: 200,
                select: club_group_message_util_1.CLUB_GROUP_MESSAGE_SELECT,
            });
        }
        async sendMessage(groupChatId, schoolId, subCategoryAdminId, dto) {
            await this.getChatForSchool(groupChatId, schoolId);
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
                    subCategoryAdminId,
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
    return SubCategoryAdminClubGroupChatsService = _classThis;
})();
exports.SubCategoryAdminClubGroupChatsService = SubCategoryAdminClubGroupChatsService;
//# sourceMappingURL=subcategory-admin-club-group-chats.service.js.map