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
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const super_admin_guard_1 = require("../guards/super-admin.guard");
let SupportController = (() => {
    let _classDecorators = [(0, common_1.Controller)('super-admin/support'), (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _sendSupportRequest_decorators;
    let _getQueries_decorators;
    let _getQueriesFromSchoolAdmins_decorators;
    let _getQueriesFromCategoryAdmins_decorators;
    let _getQueriesFromSubcategoryAdmins_decorators;
    let _updateStatus_decorators;
    let _sendReply_decorators;
    let _replyToSchoolAdmin_decorators;
    let _replyToCategoryAdmin_decorators;
    let _replyToSubcategoryAdmin_decorators;
    let _deleteFromSchoolAdmins_decorators;
    let _deleteFromCategoryAdmins_decorators;
    let _deleteFromSubcategoryAdmins_decorators;
    let _deleteSuperAdminQuery_decorators;
    var SupportController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _sendSupportRequest_decorators = [(0, common_1.Post)('request')];
            _getQueries_decorators = [(0, common_1.Get)('queries')];
            _getQueriesFromSchoolAdmins_decorators = [(0, common_1.Get)('queries/from-school-admins')];
            _getQueriesFromCategoryAdmins_decorators = [(0, common_1.Get)('queries/from-category-admins')];
            _getQueriesFromSubcategoryAdmins_decorators = [(0, common_1.Get)('queries/from-subcategory-admins')];
            _updateStatus_decorators = [(0, common_1.Put)('queries/:id/status')];
            _sendReply_decorators = [(0, common_1.Post)('queries/:id/reply')];
            _replyToSchoolAdmin_decorators = [(0, common_1.Post)('queries/from-school-admins/:id/reply')];
            _replyToCategoryAdmin_decorators = [(0, common_1.Post)('queries/from-category-admins/:id/reply')];
            _replyToSubcategoryAdmin_decorators = [(0, common_1.Post)('queries/from-subcategory-admins/:id/reply')];
            _deleteFromSchoolAdmins_decorators = [(0, common_1.Delete)('queries/from-school-admins/:id')];
            _deleteFromCategoryAdmins_decorators = [(0, common_1.Delete)('queries/from-category-admins/:id')];
            _deleteFromSubcategoryAdmins_decorators = [(0, common_1.Delete)('queries/from-subcategory-admins/:id')];
            _deleteSuperAdminQuery_decorators = [(0, common_1.Delete)('queries/super-admin/:id')];
            __esDecorate(this, null, _sendSupportRequest_decorators, { kind: "method", name: "sendSupportRequest", static: false, private: false, access: { has: obj => "sendSupportRequest" in obj, get: obj => obj.sendSupportRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getQueries_decorators, { kind: "method", name: "getQueries", static: false, private: false, access: { has: obj => "getQueries" in obj, get: obj => obj.getQueries }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getQueriesFromSchoolAdmins_decorators, { kind: "method", name: "getQueriesFromSchoolAdmins", static: false, private: false, access: { has: obj => "getQueriesFromSchoolAdmins" in obj, get: obj => obj.getQueriesFromSchoolAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getQueriesFromCategoryAdmins_decorators, { kind: "method", name: "getQueriesFromCategoryAdmins", static: false, private: false, access: { has: obj => "getQueriesFromCategoryAdmins" in obj, get: obj => obj.getQueriesFromCategoryAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getQueriesFromSubcategoryAdmins_decorators, { kind: "method", name: "getQueriesFromSubcategoryAdmins", static: false, private: false, access: { has: obj => "getQueriesFromSubcategoryAdmins" in obj, get: obj => obj.getQueriesFromSubcategoryAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateStatus_decorators, { kind: "method", name: "updateStatus", static: false, private: false, access: { has: obj => "updateStatus" in obj, get: obj => obj.updateStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendReply_decorators, { kind: "method", name: "sendReply", static: false, private: false, access: { has: obj => "sendReply" in obj, get: obj => obj.sendReply }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _replyToSchoolAdmin_decorators, { kind: "method", name: "replyToSchoolAdmin", static: false, private: false, access: { has: obj => "replyToSchoolAdmin" in obj, get: obj => obj.replyToSchoolAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _replyToCategoryAdmin_decorators, { kind: "method", name: "replyToCategoryAdmin", static: false, private: false, access: { has: obj => "replyToCategoryAdmin" in obj, get: obj => obj.replyToCategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _replyToSubcategoryAdmin_decorators, { kind: "method", name: "replyToSubcategoryAdmin", static: false, private: false, access: { has: obj => "replyToSubcategoryAdmin" in obj, get: obj => obj.replyToSubcategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteFromSchoolAdmins_decorators, { kind: "method", name: "deleteFromSchoolAdmins", static: false, private: false, access: { has: obj => "deleteFromSchoolAdmins" in obj, get: obj => obj.deleteFromSchoolAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteFromCategoryAdmins_decorators, { kind: "method", name: "deleteFromCategoryAdmins", static: false, private: false, access: { has: obj => "deleteFromCategoryAdmins" in obj, get: obj => obj.deleteFromCategoryAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteFromSubcategoryAdmins_decorators, { kind: "method", name: "deleteFromSubcategoryAdmins", static: false, private: false, access: { has: obj => "deleteFromSubcategoryAdmins" in obj, get: obj => obj.deleteFromSubcategoryAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteSuperAdminQuery_decorators, { kind: "method", name: "deleteSuperAdminQuery", static: false, private: false, access: { has: obj => "deleteSuperAdminQuery" in obj, get: obj => obj.deleteSuperAdminQuery }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SupportController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportService = __runInitializers(this, _instanceExtraInitializers);
        constructor(supportService) {
            this.supportService = supportService;
        }
        async sendSupportRequest(supportRequestDto, req) {
            const superAdminId = req.user?.sub;
            const superAdminEmail = req.user?.email;
            return this.supportService.sendSupportRequest(supportRequestDto, superAdminId, superAdminEmail);
        }
        async getQueries(req) {
            const superAdminId = req.user?.sub;
            return this.supportService.findAll(superAdminId);
        }
        async getQueriesFromSchoolAdmins() {
            return this.supportService.findFromSchoolAdmins();
        }
        async getQueriesFromCategoryAdmins() {
            return this.supportService.findFromCategoryAdmins();
        }
        async getQueriesFromSubcategoryAdmins() {
            return this.supportService.findFromSubcategoryAdmins();
        }
        async updateStatus(id, body) {
            return this.supportService.updateStatus(id, body.status);
        }
        async sendReply(id, body) {
            return this.supportService.sendReply(id, body.message);
        }
        async replyToSchoolAdmin(id, body) {
            return this.supportService.replyToSchoolAdminQuery(id, body.message);
        }
        async replyToCategoryAdmin(id, body) {
            return this.supportService.replyToCategoryAdminQuery(id, body.message);
        }
        async replyToSubcategoryAdmin(id, body) {
            return this.supportService.replyToSubcategoryAdminQuery(id, body.message);
        }
        async deleteFromSchoolAdmins(id) {
            return this.supportService.deleteFromSchoolAdmins(id);
        }
        async deleteFromCategoryAdmins(id) {
            return this.supportService.deleteFromCategoryAdmins(id);
        }
        async deleteFromSubcategoryAdmins(id) {
            return this.supportService.deleteFromSubcategoryAdmins(id);
        }
        async deleteSuperAdminQuery(id) {
            return this.supportService.deleteSuperAdminQuery(id);
        }
    };
    return SupportController = _classThis;
})();
exports.SupportController = SupportController;
//# sourceMappingURL=support.controller.js.map