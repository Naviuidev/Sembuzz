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
exports.JsonEventUploadAdminController = void 0;
const common_1 = require("@nestjs/common");
const super_admin_guard_1 = require("../../super-admin/guards/super-admin.guard");
let JsonEventUploadAdminController = (() => {
    let _classDecorators = [(0, common_1.Controller)('super-admin/json-upload'), (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _listGroups_decorators;
    let _getGroup_decorators;
    let _deleteGroup_decorators;
    let _publishGroup_decorators;
    var JsonEventUploadAdminController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [(0, common_1.Post)()];
            _listGroups_decorators = [(0, common_1.Get)('groups')];
            _getGroup_decorators = [(0, common_1.Get)('groups/:id')];
            _deleteGroup_decorators = [(0, common_1.Delete)('groups/:id')];
            _publishGroup_decorators = [(0, common_1.Post)('groups/:id/publish')];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listGroups_decorators, { kind: "method", name: "listGroups", static: false, private: false, access: { has: obj => "listGroups" in obj, get: obj => obj.listGroups }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getGroup_decorators, { kind: "method", name: "getGroup", static: false, private: false, access: { has: obj => "getGroup" in obj, get: obj => obj.getGroup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteGroup_decorators, { kind: "method", name: "deleteGroup", static: false, private: false, access: { has: obj => "deleteGroup" in obj, get: obj => obj.deleteGroup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _publishGroup_decorators, { kind: "method", name: "publishGroup", static: false, private: false, access: { has: obj => "publishGroup" in obj, get: obj => obj.publishGroup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            JsonEventUploadAdminController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        constructor(service) {
            this.service = service;
        }
        create(dto) {
            return this.service.createFromRawEvents(dto.fileName, dto.events);
        }
        listGroups() {
            return this.service.listGroups();
        }
        getGroup(id) {
            return this.service.getGroup(id);
        }
        deleteGroup(id) {
            return this.service.deleteGroup(id);
        }
        publishGroup(id) {
            return this.service.publishGroup(id);
        }
    };
    return JsonEventUploadAdminController = _classThis;
})();
exports.JsonEventUploadAdminController = JsonEventUploadAdminController;
//# sourceMappingURL=json-event-upload-admin.controller.js.map