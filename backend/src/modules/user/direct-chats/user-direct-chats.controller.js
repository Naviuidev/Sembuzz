"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDirectChatsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const user_guard_1 = require("../guards/user.guard");
const chat_attachment_util_1 = require("../../chat-messages/chat-attachment.util");
let UserDirectChatsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('user/direct-chats'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _availability_decorators;
    let _unreadCount_decorators;
    let _listInbox_decorators;
    let _uploadAttachment_decorators;
    let _listStudents_decorators;
    let _list_decorators;
    let _sendRequest_decorators;
    let _acceptRequest_decorators;
    let _markRead_decorators;
    let _blockConversation_decorators;
    let _unblockConversation_decorators;
    let _listMessages_decorators;
    let _sendMessage_decorators;
    var UserDirectChatsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _availability_decorators = [(0, common_1.Get)('availability')];
            _unreadCount_decorators = [(0, common_1.Get)('unread-count')];
            _listInbox_decorators = [(0, common_1.Get)('inbox')];
            _uploadAttachment_decorators = [(0, common_1.Post)('upload-attachment'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', (0, chat_attachment_util_1.chatAttachmentMulterOptions)()))];
            _listStudents_decorators = [(0, common_1.Get)('students')];
            _list_decorators = [(0, common_1.Get)()];
            _sendRequest_decorators = [(0, common_1.Post)('request/:otherUserId')];
            _acceptRequest_decorators = [(0, common_1.Post)(':id/accept')];
            _markRead_decorators = [(0, common_1.Post)(':id/read')];
            _blockConversation_decorators = [(0, common_1.Post)(':id/block')];
            _unblockConversation_decorators = [(0, common_1.Post)(':id/unblock')];
            _listMessages_decorators = [(0, common_1.Get)(':id/messages')];
            _sendMessage_decorators = [(0, common_1.Post)(':id/messages')];
            __esDecorate(this, null, _availability_decorators, { kind: "method", name: "availability", static: false, private: false, access: { has: obj => "availability" in obj, get: obj => obj.availability }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _unreadCount_decorators, { kind: "method", name: "unreadCount", static: false, private: false, access: { has: obj => "unreadCount" in obj, get: obj => obj.unreadCount }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listInbox_decorators, { kind: "method", name: "listInbox", static: false, private: false, access: { has: obj => "listInbox" in obj, get: obj => obj.listInbox }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadAttachment_decorators, { kind: "method", name: "uploadAttachment", static: false, private: false, access: { has: obj => "uploadAttachment" in obj, get: obj => obj.uploadAttachment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listStudents_decorators, { kind: "method", name: "listStudents", static: false, private: false, access: { has: obj => "listStudents" in obj, get: obj => obj.listStudents }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendRequest_decorators, { kind: "method", name: "sendRequest", static: false, private: false, access: { has: obj => "sendRequest" in obj, get: obj => obj.sendRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _acceptRequest_decorators, { kind: "method", name: "acceptRequest", static: false, private: false, access: { has: obj => "acceptRequest" in obj, get: obj => obj.acceptRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markRead_decorators, { kind: "method", name: "markRead", static: false, private: false, access: { has: obj => "markRead" in obj, get: obj => obj.markRead }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _blockConversation_decorators, { kind: "method", name: "blockConversation", static: false, private: false, access: { has: obj => "blockConversation" in obj, get: obj => obj.blockConversation }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _unblockConversation_decorators, { kind: "method", name: "unblockConversation", static: false, private: false, access: { has: obj => "unblockConversation" in obj, get: obj => obj.unblockConversation }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listMessages_decorators, { kind: "method", name: "listMessages", static: false, private: false, access: { has: obj => "listMessages" in obj, get: obj => obj.listMessages }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendMessage_decorators, { kind: "method", name: "sendMessage", static: false, private: false, access: { has: obj => "sendMessage" in obj, get: obj => obj.sendMessage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserDirectChatsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        constructor(service) {
            this.service = service;
        }
        async availability(req) {
            return this.service.getAvailability(req.user.sub);
        }
        async unreadCount(req) {
            return this.service.getUnreadCount(req.user.sub);
        }
        async listInbox(req) {
            return this.service.listInbox(req.user.sub);
        }
        async uploadAttachment(file) {
            if (!file) {
                throw new common_1.BadRequestException('Please select a file to upload.');
            }
            return (0, chat_attachment_util_1.buildChatAttachmentResponse)(file);
        }
        async listStudents(req, q) {
            return this.service.listStudents(req.user.sub, q);
        }
        async list(req) {
            return this.service.listConversations(req.user.sub);
        }
        async sendRequest(req, otherUserId) {
            return this.service.sendRequest(req.user.sub, otherUserId);
        }
        async acceptRequest(req, id) {
            return this.service.acceptRequest(req.user.sub, id);
        }
        async markRead(req, id) {
            return this.service.markRead(req.user.sub, id);
        }
        async blockConversation(req, id) {
            return this.service.blockConversation(req.user.sub, id);
        }
        async unblockConversation(req, id) {
            return this.service.unblockConversation(req.user.sub, id);
        }
        async listMessages(req, id) {
            return this.service.listMessages(req.user.sub, id);
        }
        async sendMessage(req, id, dto) {
            return this.service.sendMessage(req.user.sub, id, dto);
        }
    };
    return UserDirectChatsController = _classThis;
})();
exports.UserDirectChatsController = UserDirectChatsController;
//# sourceMappingURL=user-direct-chats.controller.js.map