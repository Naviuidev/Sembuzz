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
exports.UserStudentChatGroupsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const user_guard_1 = require("../guards/user.guard");
const chat_attachment_util_1 = require("../../chat-messages/chat-attachment.util");
let UserStudentChatGroupsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('user/student-chat-groups'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _unreadCount_decorators;
    let _inbox_decorators;
    let _discover_decorators;
    let _create_decorators;
    let _uploadAttachment_decorators;
    let _join_decorators;
    let _leave_decorators;
    let _markRead_decorators;
    let _members_decorators;
    let _addMember_decorators;
    let _listMessages_decorators;
    let _sendMessage_decorators;
    var UserStudentChatGroupsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _unreadCount_decorators = [(0, common_1.Get)('unread-count')];
            _inbox_decorators = [(0, common_1.Get)('inbox')];
            _discover_decorators = [(0, common_1.Get)('discover')];
            _create_decorators = [(0, common_1.Post)()];
            _uploadAttachment_decorators = [(0, common_1.Post)('upload-attachment'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', (0, chat_attachment_util_1.chatAttachmentMulterOptions)()))];
            _join_decorators = [(0, common_1.Post)(':id/join')];
            _leave_decorators = [(0, common_1.Post)(':id/leave')];
            _markRead_decorators = [(0, common_1.Post)(':id/read')];
            _members_decorators = [(0, common_1.Get)(':id/members')];
            _addMember_decorators = [(0, common_1.Post)(':id/members')];
            _listMessages_decorators = [(0, common_1.Get)(':id/messages')];
            _sendMessage_decorators = [(0, common_1.Post)(':id/messages')];
            __esDecorate(this, null, _unreadCount_decorators, { kind: "method", name: "unreadCount", static: false, private: false, access: { has: obj => "unreadCount" in obj, get: obj => obj.unreadCount }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _inbox_decorators, { kind: "method", name: "inbox", static: false, private: false, access: { has: obj => "inbox" in obj, get: obj => obj.inbox }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _discover_decorators, { kind: "method", name: "discover", static: false, private: false, access: { has: obj => "discover" in obj, get: obj => obj.discover }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadAttachment_decorators, { kind: "method", name: "uploadAttachment", static: false, private: false, access: { has: obj => "uploadAttachment" in obj, get: obj => obj.uploadAttachment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _join_decorators, { kind: "method", name: "join", static: false, private: false, access: { has: obj => "join" in obj, get: obj => obj.join }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _leave_decorators, { kind: "method", name: "leave", static: false, private: false, access: { has: obj => "leave" in obj, get: obj => obj.leave }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markRead_decorators, { kind: "method", name: "markRead", static: false, private: false, access: { has: obj => "markRead" in obj, get: obj => obj.markRead }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _members_decorators, { kind: "method", name: "members", static: false, private: false, access: { has: obj => "members" in obj, get: obj => obj.members }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addMember_decorators, { kind: "method", name: "addMember", static: false, private: false, access: { has: obj => "addMember" in obj, get: obj => obj.addMember }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listMessages_decorators, { kind: "method", name: "listMessages", static: false, private: false, access: { has: obj => "listMessages" in obj, get: obj => obj.listMessages }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendMessage_decorators, { kind: "method", name: "sendMessage", static: false, private: false, access: { has: obj => "sendMessage" in obj, get: obj => obj.sendMessage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserStudentChatGroupsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        constructor(service) {
            this.service = service;
        }
        async unreadCount(req) {
            return this.service.getUnreadCount(req.user.sub);
        }
        async inbox(req) {
            return this.service.listInbox(req.user.sub);
        }
        async discover(req) {
            return this.service.listDiscoverable(req.user.sub);
        }
        async create(req, dto) {
            return this.service.createGroup(req.user.sub, dto);
        }
        async uploadAttachment(file) {
            if (!file) {
                throw new common_1.BadRequestException('Please select a file to upload.');
            }
            return (0, chat_attachment_util_1.buildChatAttachmentResponse)(file);
        }
        async join(req, id) {
            return this.service.joinGroup(req.user.sub, id);
        }
        async leave(req, id) {
            return this.service.leaveGroup(req.user.sub, id);
        }
        async markRead(req, id) {
            return this.service.markRead(req.user.sub, id);
        }
        async members(req, id) {
            return this.service.listMembers(req.user.sub, id);
        }
        async addMember(req, id, dto) {
            return this.service.addMember(req.user.sub, id, dto.userId);
        }
        async listMessages(req, id) {
            return this.service.listMessages(req.user.sub, id);
        }
        async sendMessage(req, id, dto) {
            return this.service.sendMessage(req.user.sub, id, dto);
        }
    };
    return UserStudentChatGroupsController = _classThis;
})();
exports.UserStudentChatGroupsController = UserStudentChatGroupsController;
//# sourceMappingURL=user-student-chat-groups.controller.js.map