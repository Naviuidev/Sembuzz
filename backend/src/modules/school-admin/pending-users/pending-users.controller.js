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
exports.PendingUsersController = void 0;
const common_1 = require("@nestjs/common");
const school_admin_guard_1 = require("../guards/school-admin.guard");
let PendingUsersController = (() => {
    let _classDecorators = [(0, common_1.Controller)('school-admin/pending-users'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _approve_decorators;
    let _reject_decorators;
    let _requestDocs_decorators;
    let _askReupload_decorators;
    var PendingUsersController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _list_decorators = [(0, common_1.Get)()];
            _approve_decorators = [(0, common_1.Post)(':id/approve')];
            _reject_decorators = [(0, common_1.Post)(':id/reject')];
            _requestDocs_decorators = [(0, common_1.Post)(':id/request-docs')];
            _askReupload_decorators = [(0, common_1.Post)(':id/ask-reupload')];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _approve_decorators, { kind: "method", name: "approve", static: false, private: false, access: { has: obj => "approve" in obj, get: obj => obj.approve }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reject_decorators, { kind: "method", name: "reject", static: false, private: false, access: { has: obj => "reject" in obj, get: obj => obj.reject }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _requestDocs_decorators, { kind: "method", name: "requestDocs", static: false, private: false, access: { has: obj => "requestDocs" in obj, get: obj => obj.requestDocs }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _askReupload_decorators, { kind: "method", name: "askReupload", static: false, private: false, access: { has: obj => "askReupload" in obj, get: obj => obj.askReupload }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PendingUsersController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        pendingUsersService = __runInitializers(this, _instanceExtraInitializers);
        constructor(pendingUsersService) {
            this.pendingUsersService = pendingUsersService;
        }
        async list(req) {
            return this.pendingUsersService.findPendingForSchool(req.user.schoolId);
        }
        async approve(id, req) {
            return this.pendingUsersService.approve(id, req.user.schoolId);
        }
        async reject(id, req) {
            return this.pendingUsersService.reject(id, req.user.schoolId);
        }
        async requestDocs(id, req) {
            return this.pendingUsersService.requestDocs(id, req.user.schoolId);
        }
        async askReupload(id, body, req) {
            const text = (body.message || '').trim();
            const type = body.type === 'additional' ? 'additional' : 'reupload';
            return this.pendingUsersService.askReupload(id, req.user.schoolId, text, type);
        }
    };
    return PendingUsersController = _classThis;
})();
exports.PendingUsersController = PendingUsersController;
//# sourceMappingURL=pending-users.controller.js.map