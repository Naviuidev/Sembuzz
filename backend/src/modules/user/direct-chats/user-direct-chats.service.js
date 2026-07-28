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
exports.UserDirectChatsService = void 0;
const common_1 = require("@nestjs/common");
const direct_chat_util_1 = require("../../direct-chats/direct-chat.util");
const chat_attachment_util_1 = require("../../chat-messages/chat-attachment.util");
let UserDirectChatsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserDirectChatsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserDirectChatsService = _classThis = _classDescriptor.value;
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
                select: { id: true, schoolId: true, status: true, name: true },
            });
            if (!user || user.status !== 'active') {
                throw new common_1.ForbiddenException('Account is not active.');
            }
            return user;
        }
        async assertIndividualMessagingAvailable(schoolId) {
            const feature = await this.prisma.schoolFeature.findFirst({
                where: {
                    schoolId,
                    isEnabled: true,
                    feature: { code: direct_chat_util_1.INDIVIDUAL_MESSAGING_CODE },
                },
                select: { id: true },
            });
            if (!feature) {
                throw new common_1.ForbiddenException('Direct messaging is not available for your school.');
            }
            const setting = await this.prisma.schoolDirectMessagingSetting.findUnique({
                where: { schoolId },
                select: { isEnabled: true },
            });
            if (setting && !setting.isEnabled) {
                throw new common_1.ForbiddenException('Direct messaging has been turned off by your category admin.');
            }
        }
        formatConversation(row, currentUserId, unreadCount = 0) {
            const otherUser = row.userOne.id === currentUserId ? row.userTwo : row.userOne;
            const lastMessage = row.messages[0] ?? null;
            const peerStatus = (0, direct_chat_util_1.peerStatusForConversation)(row, currentUserId, otherUser.id);
            const blockState = (0, direct_chat_util_1.conversationBlockState)(row.blockedByUserId, currentUserId);
            return {
                id: row.id,
                status: row.status,
                peerStatus,
                lastMessageAt: row.lastMessageAt ?? row.updatedAt,
                otherUser,
                lastMessagePreview: lastMessage
                    ? (0, chat_attachment_util_1.chatMessagePreviewText)(lastMessage.body, lastMessage.attachmentType ?? null, lastMessage.attachmentName ?? null)
                    : null,
                lastMessageSenderUserId: lastMessage?.senderUserId ?? null,
                unreadCount,
                blockedByUserId: row.blockedByUserId ?? null,
                ...blockState,
            };
        }
        async countUnreadForConversation(conversationId, currentUserId, lastReadAt) {
            return this.prisma.directMessage.count({
                where: {
                    conversationId,
                    senderUserId: { not: currentUserId },
                    ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
                },
            });
        }
        async markConversationRead(conversation, userId, at = new Date()) {
            const field = (0, direct_chat_util_1.lastReadAtFieldForUser)(userId, conversation);
            await this.prisma.directConversation.update({
                where: { id: conversation.id },
                data: { [field]: at },
            });
        }
        async getConversationForUser(conversationId, userId, schoolId) {
            const conversation = await this.prisma.directConversation.findFirst({
                where: {
                    id: conversationId,
                    schoolId,
                    OR: [{ userOneId: userId }, { userTwoId: userId }],
                },
                select: {
                    id: true,
                    schoolId: true,
                    userOneId: true,
                    userTwoId: true,
                    status: true,
                    requestedByUserId: true,
                    userOneLastReadAt: true,
                    userTwoLastReadAt: true,
                    blockedByUserId: true,
                },
            });
            if (!conversation)
                throw new common_1.NotFoundException('Conversation not found.');
            return conversation;
        }
        assertAccepted(conversation) {
            if (conversation.status !== 'accepted') {
                throw new common_1.ForbiddenException('You can only message after the other student accepts your chat request.');
            }
        }
        assertNotBlocked(conversation, userId) {
            if (!conversation.blockedByUserId)
                return;
            if (conversation.blockedByUserId === userId) {
                throw new common_1.ForbiddenException('Unblock this conversation to send messages.');
            }
            throw new common_1.ForbiddenException('You cannot send messages in this conversation.');
        }
        async getAvailability(userId) {
            const user = await this.getActiveUser(userId);
            try {
                await this.assertIndividualMessagingAvailable(user.schoolId);
                return { available: true };
            }
            catch {
                return { available: false };
            }
        }
        async listStudents(userId, query) {
            const user = await this.getActiveUser(userId);
            await this.assertIndividualMessagingAvailable(user.schoolId);
            const q = query?.trim();
            const students = await this.prisma.user.findMany({
                where: {
                    schoolId: user.schoolId,
                    status: 'active',
                    id: { not: user.id },
                    ...(q
                        ? {
                            OR: [
                                { name: { contains: q } },
                                { email: { contains: q } },
                                { firstName: { contains: q } },
                                { lastName: { contains: q } },
                            ],
                        }
                        : {}),
                },
                orderBy: { name: 'asc' },
                take: 100,
                select: direct_chat_util_1.DIRECT_CONVERSATION_USER_SELECT,
            });
            const conversations = await this.prisma.directConversation.findMany({
                where: {
                    schoolId: user.schoolId,
                    OR: [{ userOneId: user.id }, { userTwoId: user.id }],
                },
                select: {
                    id: true,
                    status: true,
                    requestedByUserId: true,
                    userOneId: true,
                    userTwoId: true,
                },
            });
            const conversationByOtherId = new Map();
            for (const c of conversations) {
                const otherId = c.userOneId === user.id ? c.userTwoId : c.userOneId;
                conversationByOtherId.set(otherId, c);
            }
            return students.map((student) => {
                const conversation = conversationByOtherId.get(student.id);
                let peerStatus = 'none';
                let conversationId = null;
                if (conversation) {
                    conversationId = conversation.id;
                    peerStatus = (0, direct_chat_util_1.peerStatusForConversation)(conversation, user.id, student.id);
                }
                return {
                    user: student,
                    conversationId,
                    peerStatus,
                };
            });
        }
        async getUnreadCount(userId) {
            const user = await this.getActiveUser(userId);
            try {
                await this.assertIndividualMessagingAvailable(user.schoolId);
            }
            catch {
                return { unreadCount: 0, pendingIncomingCount: 0 };
            }
            const conversations = await this.prisma.directConversation.findMany({
                where: {
                    schoolId: user.schoolId,
                    OR: [{ userOneId: user.id }, { userTwoId: user.id }],
                    status: { in: ['accepted', 'pending'] },
                },
                select: {
                    id: true,
                    status: true,
                    userOneId: true,
                    userTwoId: true,
                    userOneLastReadAt: true,
                    userTwoLastReadAt: true,
                    requestedByUserId: true,
                    blockedByUserId: true,
                },
            });
            let unreadCount = 0;
            let pendingIncomingCount = 0;
            for (const row of conversations) {
                const otherUserId = row.userOneId === user.id ? row.userTwoId : row.userOneId;
                const peerStatus = (0, direct_chat_util_1.peerStatusForConversation)(row, user.id, otherUserId);
                if (peerStatus === 'pending_incoming') {
                    pendingIncomingCount += 1;
                    continue;
                }
                if (peerStatus !== 'accepted')
                    continue;
                if (row.blockedByUserId)
                    continue;
                const lastReadAt = (0, direct_chat_util_1.lastReadAtForUser)(row, user.id);
                unreadCount += await this.countUnreadForConversation(row.id, user.id, lastReadAt);
            }
            return { unreadCount, pendingIncomingCount };
        }
        async listInbox(userId) {
            const user = await this.getActiveUser(userId);
            await this.assertIndividualMessagingAvailable(user.schoolId);
            const rows = await this.prisma.directConversation.findMany({
                where: {
                    schoolId: user.schoolId,
                    OR: [{ userOneId: user.id }, { userTwoId: user.id }],
                    status: { in: ['accepted', 'pending'] },
                },
                orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
                select: {
                    id: true,
                    status: true,
                    lastMessageAt: true,
                    updatedAt: true,
                    userOneId: true,
                    userTwoId: true,
                    userOneLastReadAt: true,
                    userTwoLastReadAt: true,
                    requestedByUserId: true,
                    blockedByUserId: true,
                    userOne: { select: direct_chat_util_1.DIRECT_CONVERSATION_USER_SELECT },
                    userTwo: { select: direct_chat_util_1.DIRECT_CONVERSATION_USER_SELECT },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { body: true, createdAt: true, senderUserId: true, attachmentType: true, attachmentName: true },
                    },
                },
            });
            const items = await Promise.all(rows.map(async (row) => {
                const otherUser = row.userOne.id === user.id ? row.userTwo : row.userOne;
                const peerStatus = (0, direct_chat_util_1.peerStatusForConversation)(row, user.id, otherUser.id);
                if (peerStatus === 'pending_outgoing') {
                    return null;
                }
                const lastReadAt = (0, direct_chat_util_1.lastReadAtForUser)(row, user.id);
                const unreadCount = peerStatus === 'accepted'
                    ? await this.countUnreadForConversation(row.id, user.id, lastReadAt)
                    : 1;
                return this.formatConversation(row, user.id, unreadCount);
            }));
            return items
                .filter((item) => item !== null)
                .sort((a, b) => {
                const aIncoming = a.peerStatus === 'pending_incoming' ? 1 : 0;
                const bIncoming = b.peerStatus === 'pending_incoming' ? 1 : 0;
                if (aIncoming !== bIncoming)
                    return bIncoming - aIncoming;
                if (a.unreadCount !== b.unreadCount)
                    return b.unreadCount - a.unreadCount;
                return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
            });
        }
        async markRead(userId, conversationId) {
            const user = await this.getActiveUser(userId);
            await this.assertIndividualMessagingAvailable(user.schoolId);
            const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);
            await this.markConversationRead(conversation, user.id);
            return { ok: true };
        }
        async listConversations(userId) {
            const user = await this.getActiveUser(userId);
            await this.assertIndividualMessagingAvailable(user.schoolId);
            const rows = await this.prisma.directConversation.findMany({
                where: {
                    schoolId: user.schoolId,
                    status: 'accepted',
                    OR: [{ userOneId: user.id }, { userTwoId: user.id }],
                },
                orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
                select: {
                    id: true,
                    status: true,
                    lastMessageAt: true,
                    updatedAt: true,
                    userOneId: true,
                    userTwoId: true,
                    userOneLastReadAt: true,
                    userTwoLastReadAt: true,
                    requestedByUserId: true,
                    blockedByUserId: true,
                    userOne: { select: direct_chat_util_1.DIRECT_CONVERSATION_USER_SELECT },
                    userTwo: { select: direct_chat_util_1.DIRECT_CONVERSATION_USER_SELECT },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { body: true, createdAt: true, senderUserId: true, attachmentType: true, attachmentName: true },
                    },
                },
            });
            const items = await Promise.all(rows.map(async (row) => {
                const lastReadAt = (0, direct_chat_util_1.lastReadAtForUser)(row, user.id);
                const unreadCount = await this.countUnreadForConversation(row.id, user.id, lastReadAt);
                return this.formatConversation(row, user.id, unreadCount);
            }));
            return items;
        }
        async sendRequest(userId, otherUserId) {
            const user = await this.getActiveUser(userId);
            await this.assertIndividualMessagingAvailable(user.schoolId);
            if (otherUserId === user.id) {
                throw new common_1.BadRequestException('You cannot send a chat request to yourself.');
            }
            const other = await this.prisma.user.findFirst({
                where: { id: otherUserId, schoolId: user.schoolId, status: 'active' },
                select: direct_chat_util_1.DIRECT_CONVERSATION_USER_SELECT,
            });
            if (!other) {
                throw new common_1.NotFoundException('Student not found at your school.');
            }
            const [userOneId, userTwoId] = (0, direct_chat_util_1.canonicalDirectChatUserPair)(user.id, other.id);
            const existing = await this.prisma.directConversation.findUnique({
                where: {
                    schoolId_userOneId_userTwoId: { schoolId: user.schoolId, userOneId, userTwoId },
                },
                select: {
                    id: true,
                    status: true,
                    requestedByUserId: true,
                    userOneId: true,
                    userTwoId: true,
                },
            });
            if (existing) {
                const peerStatus = (0, direct_chat_util_1.peerStatusForConversation)(existing, user.id, other.id);
                if (peerStatus === 'accepted') {
                    return {
                        conversationId: existing.id,
                        peerStatus,
                        message: 'You are already connected. You can send messages.',
                    };
                }
                if (peerStatus === 'pending_outgoing') {
                    throw new common_1.BadRequestException('Your chat request is already pending.');
                }
                if (peerStatus === 'pending_incoming') {
                    throw new common_1.BadRequestException('This student has already sent you a request. Please accept it.');
                }
                if (peerStatus === 'declined') {
                    const updated = await this.prisma.directConversation.update({
                        where: { id: existing.id },
                        data: {
                            status: 'pending',
                            requestedByUserId: user.id,
                            respondedAt: null,
                        },
                        select: { id: true },
                    });
                    return {
                        conversationId: updated.id,
                        peerStatus: 'pending_outgoing',
                        message: 'Chat request sent.',
                    };
                }
            }
            const created = await this.prisma.directConversation.create({
                data: {
                    schoolId: user.schoolId,
                    userOneId,
                    userTwoId,
                    status: 'pending',
                    requestedByUserId: user.id,
                },
                select: { id: true },
            });
            return {
                conversationId: created.id,
                peerStatus: 'pending_outgoing',
                message: 'Chat request sent. You can message after they accept.',
            };
        }
        async acceptRequest(userId, conversationId) {
            const user = await this.getActiveUser(userId);
            await this.assertIndividualMessagingAvailable(user.schoolId);
            const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);
            if (conversation.status === 'accepted') {
                return { conversationId: conversation.id, peerStatus: 'accepted' };
            }
            if (conversation.status !== 'pending') {
                throw new common_1.BadRequestException('This chat request is no longer available.');
            }
            if (conversation.requestedByUserId === user.id) {
                throw new common_1.BadRequestException('You cannot accept your own chat request.');
            }
            await this.prisma.directConversation.update({
                where: { id: conversationId },
                data: {
                    status: 'accepted',
                    respondedAt: new Date(),
                    [(0, direct_chat_util_1.lastReadAtFieldForUser)(user.id, conversation)]: new Date(),
                },
            });
            return {
                conversationId,
                peerStatus: 'accepted',
                message: 'Chat request accepted. You can now send messages.',
            };
        }
        async listMessages(userId, conversationId) {
            const user = await this.getActiveUser(userId);
            await this.assertIndividualMessagingAvailable(user.schoolId);
            const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);
            this.assertAccepted(conversation);
            const messages = await this.prisma.directMessage.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' },
                take: 200,
                select: direct_chat_util_1.DIRECT_MESSAGE_SELECT,
            });
            await this.markConversationRead(conversation, user.id);
            return {
                messages,
                blockedByUserId: conversation.blockedByUserId,
                ...(0, direct_chat_util_1.conversationBlockState)(conversation.blockedByUserId, user.id),
            };
        }
        async sendMessage(userId, conversationId, dto) {
            const user = await this.getActiveUser(userId);
            await this.assertIndividualMessagingAvailable(user.schoolId);
            const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);
            this.assertAccepted(conversation);
            this.assertNotBlocked(conversation, user.id);
            const payload = (0, chat_attachment_util_1.parseChatMessagePayload)(dto);
            if (payload.replyToMessageId) {
                const reply = await this.prisma.directMessage.findFirst({
                    where: { id: payload.replyToMessageId, conversationId },
                    select: { id: true },
                });
                if (!reply) {
                    throw new common_1.BadRequestException('The message you are replying to was not found.');
                }
            }
            const now = new Date();
            const readField = (0, direct_chat_util_1.lastReadAtFieldForUser)(user.id, conversation);
            const [message] = await this.prisma.$transaction([
                this.prisma.directMessage.create({
                    data: {
                        conversationId,
                        senderUserId: user.id,
                        body: payload.body,
                        attachmentUrl: payload.attachmentUrl,
                        attachmentType: payload.attachmentType,
                        attachmentName: payload.attachmentName,
                        replyToMessageId: payload.replyToMessageId,
                    },
                    select: direct_chat_util_1.DIRECT_MESSAGE_SELECT,
                }),
                this.prisma.directConversation.update({
                    where: { id: conversationId },
                    data: { lastMessageAt: now, [readField]: now },
                }),
            ]);
            return message;
        }
        async blockConversation(userId, conversationId) {
            const user = await this.getActiveUser(userId);
            await this.assertIndividualMessagingAvailable(user.schoolId);
            const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);
            this.assertAccepted(conversation);
            if (conversation.blockedByUserId === user.id) {
                return {
                    conversationId,
                    isBlockedByMe: true,
                    isBlockedByPeer: false,
                    message: 'This conversation is already blocked.',
                };
            }
            if (conversation.blockedByUserId && conversation.blockedByUserId !== user.id) {
                throw new common_1.ForbiddenException('You cannot block this conversation.');
            }
            await this.prisma.directConversation.update({
                where: { id: conversationId },
                data: { blockedByUserId: user.id, blockedAt: new Date() },
            });
            return {
                conversationId,
                isBlockedByMe: true,
                isBlockedByPeer: false,
                message: 'Conversation blocked. You will not receive new messages from this student.',
            };
        }
        async unblockConversation(userId, conversationId) {
            const user = await this.getActiveUser(userId);
            await this.assertIndividualMessagingAvailable(user.schoolId);
            const conversation = await this.getConversationForUser(conversationId, user.id, user.schoolId);
            if (!conversation.blockedByUserId) {
                return {
                    conversationId,
                    isBlockedByMe: false,
                    isBlockedByPeer: false,
                    message: 'This conversation is not blocked.',
                };
            }
            if (conversation.blockedByUserId !== user.id) {
                throw new common_1.ForbiddenException('Only the person who blocked this conversation can unblock it.');
            }
            await this.prisma.directConversation.update({
                where: { id: conversationId },
                data: { blockedByUserId: null, blockedAt: null },
            });
            return {
                conversationId,
                isBlockedByMe: false,
                isBlockedByPeer: false,
                message: 'Conversation unblocked. You can send messages again.',
            };
        }
    };
    return UserDirectChatsService = _classThis;
})();
exports.UserDirectChatsService = UserDirectChatsService;
//# sourceMappingURL=user-direct-chats.service.js.map