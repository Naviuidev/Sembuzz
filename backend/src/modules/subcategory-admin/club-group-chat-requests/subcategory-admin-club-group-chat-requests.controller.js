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
exports.SubCategoryAdminClubGroupChatRequestsController = void 0;
const common_1 = require("@nestjs/common");
const subcategory_admin_guard_1 = require("../guards/subcategory-admin.guard");
let SubCategoryAdminClubGroupChatRequestsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('subcategory-admin/club-group-chat-requests'), (0, common_1.UseGuards)(subcategory_admin_guard_1.SubCategoryAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _listClubs_decorators;
    let _listMine_decorators;
    let _create_decorators;
    var SubCategoryAdminClubGroupChatRequestsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _listClubs_decorators = [(0, common_1.Get)('clubs')];
            _listMine_decorators = [(0, common_1.Get)()];
            _create_decorators = [(0, common_1.Post)()];
            __esDecorate(this, null, _listClubs_decorators, { kind: "method", name: "listClubs", static: false, private: false, access: { has: obj => "listClubs" in obj, get: obj => obj.listClubs }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listMine_decorators, { kind: "method", name: "listMine", static: false, private: false, access: { has: obj => "listMine" in obj, get: obj => obj.listMine }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubCategoryAdminClubGroupChatRequestsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        prisma;
        constructor(service, prisma) {
            this.service = service;
            this.prisma = prisma;
        }
        async schoolIdForAdmin(adminId) {
            const admin = await this.prisma.subCategoryAdmin.findUnique({
                where: { id: adminId },
                select: { schoolId: true, isActive: true },
            });
            if (!admin?.isActive) {
                throw new common_1.ForbiddenException('Account is not active.');
            }
            return admin.schoolId;
        }
        async listClubs(req) {
            const schoolId = await this.schoolIdForAdmin(req.user.sub);
            return this.service.listClubsForSchool(schoolId);
        }
        async listMine(req) {
            return this.service.listForSubCategoryAdmin(req.user.sub);
        }
        async create(req, dto) {
            return this.service.createForSubCategoryAdmin(req.user.sub, dto);
        }
    };
    return SubCategoryAdminClubGroupChatRequestsController = _classThis;
})();
exports.SubCategoryAdminClubGroupChatRequestsController = SubCategoryAdminClubGroupChatRequestsController;
//# sourceMappingURL=subcategory-admin-club-group-chat-requests.controller.js.map