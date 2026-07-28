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
exports.SubCategoryAdminDirectChatsService = void 0;
const common_1 = require("@nestjs/common");
const direct_chat_util_1 = require("../../direct-chats/direct-chat.util");
let SubCategoryAdminDirectChatsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SubCategoryAdminDirectChatsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubCategoryAdminDirectChatsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        async getSetting(schoolId) {
            const row = await this.prisma.schoolDirectMessagingSetting.findUnique({
                where: { schoolId },
                select: { isEnabled: true },
            });
            return { isEnabled: row?.isEnabled ?? true };
        }
        async updateSetting(schoolId, isEnabled) {
            const row = await this.prisma.schoolDirectMessagingSetting.upsert({
                where: { schoolId },
                create: { schoolId, isEnabled },
                update: { isEnabled },
                select: { isEnabled: true },
            });
            return row;
        }
        async listConversations(schoolId) {
            const rows = await this.prisma.directConversation.findMany({
                where: { schoolId },
                orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
                select: {
                    id: true,
                    status: true,
                    lastMessageAt: true,
                    updatedAt: true,
                    userOne: { select: direct_chat_util_1.DIRECT_CONVERSATION_USER_SELECT },
                    userTwo: { select: direct_chat_util_1.DIRECT_CONVERSATION_USER_SELECT },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { body: true, createdAt: true },
                    },
                    _count: { select: { messages: true } },
                },
            });
            return rows.map((row) => ({
                id: row.id,
                status: row.status,
                lastMessageAt: row.lastMessageAt ?? row.updatedAt,
                messageCount: row._count.messages,
                userOne: row.userOne,
                userTwo: row.userTwo,
                lastMessagePreview: row.messages[0]?.body ?? null,
            }));
        }
        async listMessages(schoolId, conversationId) {
            const conversation = await this.prisma.directConversation.findFirst({
                where: { id: conversationId, schoolId },
                select: {
                    id: true,
                    userOne: { select: direct_chat_util_1.DIRECT_CONVERSATION_USER_SELECT },
                    userTwo: { select: direct_chat_util_1.DIRECT_CONVERSATION_USER_SELECT },
                },
            });
            if (!conversation) {
                return null;
            }
            const messages = await this.prisma.directMessage.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' },
                take: 200,
                select: direct_chat_util_1.DIRECT_MESSAGE_SELECT,
            });
            return { conversation, messages };
        }
    };
    return SubCategoryAdminDirectChatsService = _classThis;
})();
exports.SubCategoryAdminDirectChatsService = SubCategoryAdminDirectChatsService;
//# sourceMappingURL=subcategory-admin-direct-chats.service.js.map