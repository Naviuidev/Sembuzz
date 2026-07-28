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
exports.CategoryAdminEventsController = void 0;
const common_1 = require("@nestjs/common");
const category_admin_guard_1 = require("../guards/category-admin.guard");
let CategoryAdminEventsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('category-admin/events'), (0, common_1.UseGuards)(category_admin_guard_1.CategoryAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findPending_decorators;
    let _findApproved_decorators;
    let _delete_decorators;
    let _update_decorators;
    let _revert_decorators;
    let _approve_decorators;
    var CategoryAdminEventsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findPending_decorators = [(0, common_1.Get)('pending')];
            _findApproved_decorators = [(0, common_1.Get)('approved')];
            _delete_decorators = [(0, common_1.Delete)(':id')];
            _update_decorators = [(0, common_1.Put)(':id')];
            _revert_decorators = [(0, common_1.Post)(':id/revert')];
            _approve_decorators = [(0, common_1.Post)(':id/approve')];
            __esDecorate(this, null, _findPending_decorators, { kind: "method", name: "findPending", static: false, private: false, access: { has: obj => "findPending" in obj, get: obj => obj.findPending }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findApproved_decorators, { kind: "method", name: "findApproved", static: false, private: false, access: { has: obj => "findApproved" in obj, get: obj => obj.findApproved }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _delete_decorators, { kind: "method", name: "delete", static: false, private: false, access: { has: obj => "delete" in obj, get: obj => obj.delete }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _revert_decorators, { kind: "method", name: "revert", static: false, private: false, access: { has: obj => "revert" in obj, get: obj => obj.revert }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _approve_decorators, { kind: "method", name: "approve", static: false, private: false, access: { has: obj => "approve" in obj, get: obj => obj.approve }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminEventsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        eventsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(eventsService) {
            this.eventsService = eventsService;
        }
        async findPending(req) {
            return this.eventsService.findPendingForCategoryAdmin(req.user.sub);
        }
        async findApproved(req) {
            return this.eventsService.findApprovedForCategoryAdmin(req.user.sub);
        }
        async delete(id, req) {
            return this.eventsService.delete(id, req.user.sub);
        }
        async update(id, req, dto) {
            return this.eventsService.update(id, req.user.sub, dto);
        }
        async revert(id, req, dto) {
            return this.eventsService.revert(id, req.user.sub, dto.revertNotes);
        }
        async approve(id, req) {
            return this.eventsService.approve(id, req.user.sub);
        }
    };
    return CategoryAdminEventsController = _classThis;
})();
exports.CategoryAdminEventsController = CategoryAdminEventsController;
//# sourceMappingURL=events.controller.js.map