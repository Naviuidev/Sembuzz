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
exports.SubCategoryAdminsController = void 0;
const common_1 = require("@nestjs/common");
const category_admin_guard_1 = require("../guards/category-admin.guard");
let SubCategoryAdminsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('category-admin/subcategory-admins'), (0, common_1.UseGuards)(category_admin_guard_1.CategoryAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _findAll_decorators;
    let _findOne_decorators;
    let _create_decorators;
    let _updateSubCategories_decorators;
    let _remove_decorators;
    var SubCategoryAdminsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _findAll_decorators = [(0, common_1.Get)()];
            _findOne_decorators = [(0, common_1.Get)(':id')];
            _create_decorators = [(0, common_1.Post)()];
            _updateSubCategories_decorators = [(0, common_1.Put)(':id/subcategories')];
            _remove_decorators = [(0, common_1.Delete)(':id')];
            __esDecorate(this, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: obj => "findAll" in obj, get: obj => obj.findAll }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateSubCategories_decorators, { kind: "method", name: "updateSubCategories", static: false, private: false, access: { has: obj => "updateSubCategories" in obj, get: obj => obj.updateSubCategories }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubCategoryAdminsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        subCategoryAdminsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(subCategoryAdminsService) {
            this.subCategoryAdminsService = subCategoryAdminsService;
        }
        async findAll(req) {
            const categoryId = req.user.categoryId;
            const categoryAdminId = req.user.sub;
            return this.subCategoryAdminsService.findAll(categoryId, categoryAdminId);
        }
        async findOne(id, req) {
            const categoryId = req.user.categoryId;
            const categoryAdminId = req.user.sub;
            return this.subCategoryAdminsService.findOne(id, categoryId, categoryAdminId);
        }
        async create(createSubCategoryAdminDto, req) {
            const categoryId = req.user.categoryId;
            const categoryAdminId = req.user.sub;
            return this.subCategoryAdminsService.create(categoryId, categoryAdminId, createSubCategoryAdminDto);
        }
        async updateSubCategories(id, updateDto, req) {
            const categoryId = req.user.categoryId;
            const categoryAdminId = req.user.sub;
            return this.subCategoryAdminsService.updateSubCategories(id, categoryId, categoryAdminId, updateDto);
        }
        async remove(id, req) {
            const categoryId = req.user.categoryId;
            const categoryAdminId = req.user.sub;
            return this.subCategoryAdminsService.remove(id, categoryId, categoryAdminId);
        }
    };
    return SubCategoryAdminsController = _classThis;
})();
exports.SubCategoryAdminsController = SubCategoryAdminsController;
//# sourceMappingURL=subcategory-admins.controller.js.map