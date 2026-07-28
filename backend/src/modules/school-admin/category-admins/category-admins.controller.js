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
exports.CategoryAdminsController = void 0;
const common_1 = require("@nestjs/common");
const school_admin_guard_1 = require("../guards/school-admin.guard");
let CategoryAdminsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('school-admin/category-admins'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _findOne_decorators;
    let _create_decorators;
    let _updateCategories_decorators;
    let _remove_decorators;
    let _ban_decorators;
    let _unban_decorators;
    var CategoryAdminsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findAll_decorators = [(0, common_1.Get)()];
            _findOne_decorators = [(0, common_1.Get)(':id')];
            _create_decorators = [(0, common_1.Post)()];
            _updateCategories_decorators = [(0, common_1.Put)(':id/categories')];
            _remove_decorators = [(0, common_1.Delete)(':id')];
            _ban_decorators = [(0, common_1.Post)(':id/ban')];
            _unban_decorators = [(0, common_1.Post)(':id/unban')];
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateCategories_decorators, { kind: "method", name: "updateCategories", static: false, private: false, access: { has: obj => "updateCategories" in obj, get: obj => obj.updateCategories }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _ban_decorators, { kind: "method", name: "ban", static: false, private: false, access: { has: obj => "ban" in obj, get: obj => obj.ban }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _unban_decorators, { kind: "method", name: "unban", static: false, private: false, access: { has: obj => "unban" in obj, get: obj => obj.unban }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        categoryAdminsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(categoryAdminsService) {
            this.categoryAdminsService = categoryAdminsService;
        }
        async findAll(req) {
            const schoolId = req.user.schoolId;
            return this.categoryAdminsService.findAll(schoolId);
        }
        async findOne(id, req) {
            const schoolId = req.user.schoolId;
            return this.categoryAdminsService.findOne(id, schoolId);
        }
        async create(createCategoryAdminDto, req) {
            const schoolId = req.user.schoolId;
            return this.categoryAdminsService.create(schoolId, createCategoryAdminDto);
        }
        async updateCategories(id, updateDto, req) {
            const schoolId = req.user.schoolId;
            return this.categoryAdminsService.updateCategories(id, schoolId, updateDto);
        }
        async remove(id, req) {
            const schoolId = req.user.schoolId;
            return this.categoryAdminsService.remove(id, schoolId);
        }
        async ban(id, req) {
            const schoolId = req.user.schoolId;
            return this.categoryAdminsService.ban(id, schoolId);
        }
        async unban(id, req) {
            const schoolId = req.user.schoolId;
            return this.categoryAdminsService.unban(id, schoolId);
        }
    };
    return CategoryAdminsController = _classThis;
})();
exports.CategoryAdminsController = CategoryAdminsController;
//# sourceMappingURL=category-admins.controller.js.map