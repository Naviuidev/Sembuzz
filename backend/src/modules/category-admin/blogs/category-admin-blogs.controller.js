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
exports.CategoryAdminBlogsController = void 0;
const common_1 = require("@nestjs/common");
const category_admin_guard_1 = require("../guards/category-admin.guard");
let CategoryAdminBlogsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('category-admin/blogs'), (0, common_1.UseGuards)(category_admin_guard_1.CategoryAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _pending_decorators;
    let _approved_decorators;
    let _update_decorators;
    let _revert_decorators;
    let _reject_decorators;
    let _approve_decorators;
    let _publishDraft_decorators;
    let _removeViaPost_decorators;
    let _remove_decorators;
    var CategoryAdminBlogsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _pending_decorators = [(0, common_1.Get)('pending')];
            _approved_decorators = [(0, common_1.Get)('approved')];
            _update_decorators = [(0, common_1.Put)(':id')];
            _revert_decorators = [(0, common_1.Post)(':id/revert')];
            _reject_decorators = [(0, common_1.Post)(':id/reject')];
            _approve_decorators = [(0, common_1.Post)(':id/approve')];
            _publishDraft_decorators = [(0, common_1.Post)(':id/publish')];
            _removeViaPost_decorators = [(0, common_1.Post)(':id/remove-approved')];
            _remove_decorators = [(0, common_1.Delete)(':id')];
            __esDecorate(this, null, _pending_decorators, { kind: "method", name: "pending", static: false, private: false, access: { has: obj => "pending" in obj, get: obj => obj.pending }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _approved_decorators, { kind: "method", name: "approved", static: false, private: false, access: { has: obj => "approved" in obj, get: obj => obj.approved }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _revert_decorators, { kind: "method", name: "revert", static: false, private: false, access: { has: obj => "revert" in obj, get: obj => obj.revert }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reject_decorators, { kind: "method", name: "reject", static: false, private: false, access: { has: obj => "reject" in obj, get: obj => obj.reject }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _approve_decorators, { kind: "method", name: "approve", static: false, private: false, access: { has: obj => "approve" in obj, get: obj => obj.approve }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _publishDraft_decorators, { kind: "method", name: "publishDraft", static: false, private: false, access: { has: obj => "publishDraft" in obj, get: obj => obj.publishDraft }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _removeViaPost_decorators, { kind: "method", name: "removeViaPost", static: false, private: false, access: { has: obj => "removeViaPost" in obj, get: obj => obj.removeViaPost }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminBlogsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        blogsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(blogsService) {
            this.blogsService = blogsService;
        }
        async pending(req) {
            return this.blogsService.findPending(req.user.sub);
        }
        async approved(req) {
            return this.blogsService.findApprovedForCategoryAdmin(req.user.sub);
        }
        async update(id, req, dto) {
            return this.blogsService.update(id, req.user.sub, dto);
        }
        async revert(id, req, dto) {
            return this.blogsService.revert(id, req.user.sub, dto.revertNotes);
        }
        async reject(id, req, dto) {
            return this.blogsService.reject(id, req.user.sub, dto.rejectNotes);
        }
        async approve(id, req) {
            return this.blogsService.approve(id, req.user.sub);
        }
        async publishDraft(id, req) {
            return this.blogsService.publishDraft(id, req.user.sub);
        }
        /** POST + {} body avoids empty-body JSON parse issues; works if DELETE is blocked (404). */
        async removeViaPost(id, req) {
            return this.blogsService.removeApproved(id, req.user.sub);
        }
        async remove(id, req) {
            return this.blogsService.removeApproved(id, req.user.sub);
        }
    };
    return CategoryAdminBlogsController = _classThis;
})();
exports.CategoryAdminBlogsController = CategoryAdminBlogsController;
//# sourceMappingURL=category-admin-blogs.controller.js.map