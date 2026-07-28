"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryAdminQueriesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer = __importStar(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const category_admin_guard_1 = require("../guards/category-admin.guard");
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'category-admin-query-attachments');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
let CategoryAdminQueriesController = (() => {
    let _classDecorators = [(0, common_1.Controller)('category-admin/queries'), (0, common_1.UseGuards)(category_admin_guard_1.CategoryAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _uploadFile_decorators;
    let _list_decorators;
    let _listFromSchoolAdmins_decorators;
    let _createToSubCategoryAdmin_decorators;
    let _createToSuperAdmin_decorators;
    let _listFromSubcategoryAdmins_decorators;
    let _listRaisedToSuperAdmin_decorators;
    let _sendFollowUpToSuperAdmin_decorators;
    let _replyToSubcategoryAdmin_decorators;
    let _replyToSchoolAdmin_decorators;
    let _deleteFromSchoolAdmin_decorators;
    let _deleteFromSubcategoryAdmin_decorators;
    let _deleteRaisedToSuperAdmin_decorators;
    var CategoryAdminQueriesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [(0, common_1.Post)()];
            _uploadFile_decorators = [(0, common_1.Post)('upload'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                    storage: multer.diskStorage({
                        destination: (_req, _file, cb) => {
                            if (!fs.existsSync(UPLOAD_DIR))
                                fs.mkdirSync(UPLOAD_DIR, { recursive: true });
                            cb(null, UPLOAD_DIR);
                        },
                        filename: (_req, file, cb) => {
                            const ext = path.extname(file.originalname) || '';
                            cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
                        },
                    }),
                    limits: { fileSize: MAX_FILE_SIZE },
                }))];
            _list_decorators = [(0, common_1.Get)()];
            _listFromSchoolAdmins_decorators = [(0, common_1.Get)('from-school-admins')];
            _createToSubCategoryAdmin_decorators = [(0, common_1.Post)('to-subcategory-admin')];
            _createToSuperAdmin_decorators = [(0, common_1.Post)('to-super-admin')];
            _listFromSubcategoryAdmins_decorators = [(0, common_1.Get)('from-subcategory-admins')];
            _listRaisedToSuperAdmin_decorators = [(0, common_1.Get)('raised-to-super-admin')];
            _sendFollowUpToSuperAdmin_decorators = [(0, common_1.Post)('raised-to-super-admin/:id/reply')];
            _replyToSubcategoryAdmin_decorators = [(0, common_1.Post)('from-subcategory-admins/:id/reply')];
            _replyToSchoolAdmin_decorators = [(0, common_1.Post)('from-school-admins/:id/reply')];
            _deleteFromSchoolAdmin_decorators = [(0, common_1.Delete)('from-school-admins/:id')];
            _deleteFromSubcategoryAdmin_decorators = [(0, common_1.Delete)('from-subcategory-admins/:id')];
            _deleteRaisedToSuperAdmin_decorators = [(0, common_1.Delete)('raised-to-super-admin/:id')];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadFile_decorators, { kind: "method", name: "uploadFile", static: false, private: false, access: { has: obj => "uploadFile" in obj, get: obj => obj.uploadFile }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listFromSchoolAdmins_decorators, { kind: "method", name: "listFromSchoolAdmins", static: false, private: false, access: { has: obj => "listFromSchoolAdmins" in obj, get: obj => obj.listFromSchoolAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createToSubCategoryAdmin_decorators, { kind: "method", name: "createToSubCategoryAdmin", static: false, private: false, access: { has: obj => "createToSubCategoryAdmin" in obj, get: obj => obj.createToSubCategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createToSuperAdmin_decorators, { kind: "method", name: "createToSuperAdmin", static: false, private: false, access: { has: obj => "createToSuperAdmin" in obj, get: obj => obj.createToSuperAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listFromSubcategoryAdmins_decorators, { kind: "method", name: "listFromSubcategoryAdmins", static: false, private: false, access: { has: obj => "listFromSubcategoryAdmins" in obj, get: obj => obj.listFromSubcategoryAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listRaisedToSuperAdmin_decorators, { kind: "method", name: "listRaisedToSuperAdmin", static: false, private: false, access: { has: obj => "listRaisedToSuperAdmin" in obj, get: obj => obj.listRaisedToSuperAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendFollowUpToSuperAdmin_decorators, { kind: "method", name: "sendFollowUpToSuperAdmin", static: false, private: false, access: { has: obj => "sendFollowUpToSuperAdmin" in obj, get: obj => obj.sendFollowUpToSuperAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _replyToSubcategoryAdmin_decorators, { kind: "method", name: "replyToSubcategoryAdmin", static: false, private: false, access: { has: obj => "replyToSubcategoryAdmin" in obj, get: obj => obj.replyToSubcategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _replyToSchoolAdmin_decorators, { kind: "method", name: "replyToSchoolAdmin", static: false, private: false, access: { has: obj => "replyToSchoolAdmin" in obj, get: obj => obj.replyToSchoolAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteFromSchoolAdmin_decorators, { kind: "method", name: "deleteFromSchoolAdmin", static: false, private: false, access: { has: obj => "deleteFromSchoolAdmin" in obj, get: obj => obj.deleteFromSchoolAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteFromSubcategoryAdmin_decorators, { kind: "method", name: "deleteFromSubcategoryAdmin", static: false, private: false, access: { has: obj => "deleteFromSubcategoryAdmin" in obj, get: obj => obj.deleteFromSubcategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteRaisedToSuperAdmin_decorators, { kind: "method", name: "deleteRaisedToSuperAdmin", static: false, private: false, access: { has: obj => "deleteRaisedToSuperAdmin" in obj, get: obj => obj.deleteRaisedToSuperAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminQueriesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        queriesService = __runInitializers(this, _instanceExtraInitializers);
        constructor(queriesService) {
            this.queriesService = queriesService;
        }
        async create(req, dto) {
            return this.queriesService.create(req.user.sub, dto);
        }
        async uploadFile(file) {
            if (!file)
                throw new common_1.BadRequestException('File is required');
            return { url: `/uploads/category-admin-query-attachments/${file.filename}` };
        }
        async list(req) {
            return this.queriesService.listFromSubcategoryAdmins(req.user.sub);
        }
        async listFromSchoolAdmins(req) {
            return this.queriesService.listFromSchoolAdmins(req.user.sub);
        }
        async createToSubCategoryAdmin(req, dto) {
            return this.queriesService.createToSubCategoryAdmin(req.user.sub, dto);
        }
        async createToSuperAdmin(req, dto) {
            return this.queriesService.createToSuperAdmin(req.user.sub, dto);
        }
        async listFromSubcategoryAdmins(req) {
            return this.queriesService.listFromSubcategoryAdmins(req.user.sub);
        }
        async listRaisedToSuperAdmin(req) {
            return this.queriesService.listRaisedToSuperAdmin(req.user.sub);
        }
        async sendFollowUpToSuperAdmin(id, req, body) {
            return this.queriesService.sendFollowUpToSuperAdmin(req.user.sub, id, body.message);
        }
        async replyToSubcategoryAdmin(id, body) {
            return this.queriesService.replyToSubcategoryAdmin(id, body.message);
        }
        async replyToSchoolAdmin(id, req, body) {
            return this.queriesService.replyToSchoolAdmin(req.user.sub, id, body.message);
        }
        async deleteFromSchoolAdmin(id, req) {
            return this.queriesService.deleteFromSchoolAdmin(id, req.user.sub);
        }
        async deleteFromSubcategoryAdmin(id, req) {
            return this.queriesService.deleteFromSubcategoryAdmin(id, req.user.sub);
        }
        async deleteRaisedToSuperAdmin(id, req) {
            return this.queriesService.deleteRaisedToSuperAdmin(id, req.user.sub);
        }
    };
    return CategoryAdminQueriesController = _classThis;
})();
exports.CategoryAdminQueriesController = CategoryAdminQueriesController;
//# sourceMappingURL=queries.controller.js.map