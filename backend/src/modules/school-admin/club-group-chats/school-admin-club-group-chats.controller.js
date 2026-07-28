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
exports.SchoolAdminClubGroupChatsController = void 0;
const common_1 = require("@nestjs/common");
const school_admin_guard_1 = require("../guards/school-admin.guard");
let SchoolAdminClubGroupChatsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('school-admin/club-group-chats'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _findByClubKey_decorators;
    let _upsert_decorators;
    var SchoolAdminClubGroupChatsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _list_decorators = [(0, common_1.Get)()];
            _findByClubKey_decorators = [(0, common_1.Get)('by-club/:clubKey')];
            _upsert_decorators = [(0, common_1.Post)()];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findByClubKey_decorators, { kind: "method", name: "findByClubKey", static: false, private: false, access: { has: obj => "findByClubKey" in obj, get: obj => obj.findByClubKey }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _upsert_decorators, { kind: "method", name: "upsert", static: false, private: false, access: { has: obj => "upsert" in obj, get: obj => obj.upsert }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SchoolAdminClubGroupChatsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        constructor(service) {
            this.service = service;
        }
        async list(req) {
            return this.service.listForSchool(req.user.schoolId);
        }
        async findByClubKey(req, clubKey) {
            return this.service.findByClubKey(req.user.schoolId, decodeURIComponent(clubKey));
        }
        async upsert(req, dto) {
            return this.service.upsert(req.user.schoolId, dto);
        }
    };
    return SchoolAdminClubGroupChatsController = _classThis;
})();
exports.SchoolAdminClubGroupChatsController = SchoolAdminClubGroupChatsController;
//# sourceMappingURL=school-admin-club-group-chats.controller.js.map