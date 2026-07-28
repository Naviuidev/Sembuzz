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
exports.UserClubGroupChatsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const user_guard_1 = require("../guards/user.guard");
const chat_attachment_util_1 = require("../../chat-messages/chat-attachment.util");
let UserClubGroupChatsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('user/club-group-chats'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _listJoinable_decorators;
    let _list_decorators;
    let _uploadAttachment_decorators;
    let _requestJoin_decorators;
    let _listMessages_decorators;
    let _sendMessage_decorators;
    var UserClubGroupChatsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _listJoinable_decorators = [(0, common_1.Get)('joinable')];
            _list_decorators = [(0, common_1.Get)()];
            _uploadAttachment_decorators = [(0, common_1.Post)('upload-attachment'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', (0, chat_attachment_util_1.chatAttachmentMulterOptions)()))];
            _requestJoin_decorators = [(0, common_1.Post)(':id/join-request')];
            _listMessages_decorators = [(0, common_1.Get)(':id/messages')];
            _sendMessage_decorators = [(0, common_1.Post)(':id/messages')];
            __esDecorate(this, null, _listJoinable_decorators, { kind: "method", name: "listJoinable", static: false, private: false, access: { has: obj => "listJoinable" in obj, get: obj => obj.listJoinable }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadAttachment_decorators, { kind: "method", name: "uploadAttachment", static: false, private: false, access: { has: obj => "uploadAttachment" in obj, get: obj => obj.uploadAttachment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _requestJoin_decorators, { kind: "method", name: "requestJoin", static: false, private: false, access: { has: obj => "requestJoin" in obj, get: obj => obj.requestJoin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listMessages_decorators, { kind: "method", name: "listMessages", static: false, private: false, access: { has: obj => "listMessages" in obj, get: obj => obj.listMessages }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendMessage_decorators, { kind: "method", name: "sendMessage", static: false, private: false, access: { has: obj => "sendMessage" in obj, get: obj => obj.sendMessage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserClubGroupChatsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        constructor(service) {
            this.service = service;
        }
        async listJoinable(req) {
            return this.service.listJoinable(req.user.sub);
        }
        async list(req) {
            return this.service.listForUser(req.user.sub);
        }
        async uploadAttachment(file) {
            if (!file) {
                throw new common_1.BadRequestException('Please select a file to upload.');
            }
            return (0, chat_attachment_util_1.buildChatAttachmentResponse)(file);
        }
        async requestJoin(req, id) {
            return this.service.requestJoin(req.user.sub, id);
        }
        async listMessages(req, id) {
            return this.service.listMessages(req.user.sub, id);
        }
        async sendMessage(req, id, dto) {
            return this.service.sendMessage(req.user.sub, id, dto);
        }
    };
    return UserClubGroupChatsController = _classThis;
})();
exports.UserClubGroupChatsController = UserClubGroupChatsController;
//# sourceMappingURL=user-club-group-chats.controller.js.map