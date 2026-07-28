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
exports.UserEventsController = void 0;
const common_1 = require("@nestjs/common");
const user_guard_1 = require("../guards/user.guard");
let UserEventsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('user/events'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getEngagement_decorators;
    let _getSavedEvents_decorators;
    let _getLikedEvents_decorators;
    let _toggleLike_decorators;
    let _getComments_decorators;
    let _addComment_decorators;
    let _toggleSave_decorators;
    var UserEventsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getEngagement_decorators = [(0, common_1.Get)('engagement')];
            _getSavedEvents_decorators = [(0, common_1.Get)('saved')];
            _getLikedEvents_decorators = [(0, common_1.Get)('list/liked')];
            _toggleLike_decorators = [(0, common_1.Post)(':eventId/like')];
            _getComments_decorators = [(0, common_1.Get)(':eventId/comments')];
            _addComment_decorators = [(0, common_1.Post)(':eventId/comments')];
            _toggleSave_decorators = [(0, common_1.Post)(':eventId/save')];
            __esDecorate(this, null, _getEngagement_decorators, { kind: "method", name: "getEngagement", static: false, private: false, access: { has: obj => "getEngagement" in obj, get: obj => obj.getEngagement }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSavedEvents_decorators, { kind: "method", name: "getSavedEvents", static: false, private: false, access: { has: obj => "getSavedEvents" in obj, get: obj => obj.getSavedEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getLikedEvents_decorators, { kind: "method", name: "getLikedEvents", static: false, private: false, access: { has: obj => "getLikedEvents" in obj, get: obj => obj.getLikedEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _toggleLike_decorators, { kind: "method", name: "toggleLike", static: false, private: false, access: { has: obj => "toggleLike" in obj, get: obj => obj.toggleLike }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getComments_decorators, { kind: "method", name: "getComments", static: false, private: false, access: { has: obj => "getComments" in obj, get: obj => obj.getComments }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addComment_decorators, { kind: "method", name: "addComment", static: false, private: false, access: { has: obj => "addComment" in obj, get: obj => obj.addComment }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _toggleSave_decorators, { kind: "method", name: "toggleSave", static: false, private: false, access: { has: obj => "toggleSave" in obj, get: obj => obj.toggleSave }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserEventsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        userEventsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(userEventsService) {
            this.userEventsService = userEventsService;
        }
        async getEngagement(req, eventIdsStr) {
            const eventIds = eventIdsStr && eventIdsStr.trim()
                ? eventIdsStr.split(',').map((id) => id.trim()).filter(Boolean)
                : [];
            return this.userEventsService.getEngagement(eventIds, req.user.sub);
        }
        async getSavedEvents(req) {
            return this.userEventsService.getSavedEvents(req.user.sub);
        }
        async getLikedEvents(req) {
            return this.userEventsService.getLikedEvents(req.user.sub);
        }
        async toggleLike(req, eventId) {
            return this.userEventsService.toggleLike(eventId, req.user.sub);
        }
        async getComments(req, eventId) {
            return this.userEventsService.getComments(eventId, req.user.sub);
        }
        async addComment(req, eventId, dto) {
            return this.userEventsService.addComment(eventId, req.user.sub, dto.text);
        }
        async toggleSave(req, eventId) {
            return this.userEventsService.toggleSave(eventId, req.user.sub);
        }
    };
    return UserEventsController = _classThis;
})();
exports.UserEventsController = UserEventsController;
//# sourceMappingURL=user-events.controller.js.map