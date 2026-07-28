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
exports.UserNotificationsController = void 0;
const common_1 = require("@nestjs/common");
const user_guard_1 = require("../guards/user.guard");
let UserNotificationsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('user/notifications')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _registerPushToken_decorators;
    let _removePushToken_decorators;
    let _getSubcategories_decorators;
    let _setSubcategories_decorators;
    let _getInbox_decorators;
    let _getUnreadCount_decorators;
    let _markAllRead_decorators;
    let _markRead_decorators;
    var UserNotificationsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _registerPushToken_decorators = [(0, common_1.Post)('push-token'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            _removePushToken_decorators = [(0, common_1.Delete)('push-token'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            _getSubcategories_decorators = [(0, common_1.Get)('subcategories'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            _setSubcategories_decorators = [(0, common_1.Put)('subcategories'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            _getInbox_decorators = [(0, common_1.Get)('inbox'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            _getUnreadCount_decorators = [(0, common_1.Get)('unread-count'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            _markAllRead_decorators = [(0, common_1.Put)('read-all'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            _markRead_decorators = [(0, common_1.Put)(':id/read'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            __esDecorate(this, null, _registerPushToken_decorators, { kind: "method", name: "registerPushToken", static: false, private: false, access: { has: obj => "registerPushToken" in obj, get: obj => obj.registerPushToken }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _removePushToken_decorators, { kind: "method", name: "removePushToken", static: false, private: false, access: { has: obj => "removePushToken" in obj, get: obj => obj.removePushToken }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSubcategories_decorators, { kind: "method", name: "getSubcategories", static: false, private: false, access: { has: obj => "getSubcategories" in obj, get: obj => obj.getSubcategories }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setSubcategories_decorators, { kind: "method", name: "setSubcategories", static: false, private: false, access: { has: obj => "setSubcategories" in obj, get: obj => obj.setSubcategories }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getInbox_decorators, { kind: "method", name: "getInbox", static: false, private: false, access: { has: obj => "getInbox" in obj, get: obj => obj.getInbox }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getUnreadCount_decorators, { kind: "method", name: "getUnreadCount", static: false, private: false, access: { has: obj => "getUnreadCount" in obj, get: obj => obj.getUnreadCount }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markAllRead_decorators, { kind: "method", name: "markAllRead", static: false, private: false, access: { has: obj => "markAllRead" in obj, get: obj => obj.markAllRead }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _markRead_decorators, { kind: "method", name: "markRead", static: false, private: false, access: { has: obj => "markRead" in obj, get: obj => obj.markRead }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserNotificationsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        notifications = __runInitializers(this, _instanceExtraInitializers);
        constructor(notifications) {
            this.notifications = notifications;
        }
        async registerPushToken(req, dto) {
            return this.notifications.registerPushToken(req.user.sub, dto.token, dto.platform);
        }
        async removePushToken(req, token) {
            if (!token?.trim())
                return { ok: false };
            return this.notifications.removePushToken(req.user.sub, token.trim());
        }
        async getSubcategories(req) {
            return this.notifications.getNotificationSubcategories(req.user.sub);
        }
        async setSubcategories(req, dto) {
            return this.notifications.setNotificationSubcategories(req.user.sub, dto.subCategoryIds ?? []);
        }
        async getInbox(req) {
            return this.notifications.getInbox(req.user.sub);
        }
        async getUnreadCount(req) {
            return this.notifications.getUnreadCount(req.user.sub);
        }
        async markAllRead(req) {
            return this.notifications.markAllRead(req.user.sub);
        }
        async markRead(req, idFromParam) {
            const id = idFromParam?.trim();
            if (!id)
                return { ok: false };
            return this.notifications.markRead(req.user.sub, id);
        }
    };
    return UserNotificationsController = _classThis;
})();
exports.UserNotificationsController = UserNotificationsController;
//# sourceMappingURL=user-notifications.controller.js.map