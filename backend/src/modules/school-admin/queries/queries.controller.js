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
exports.QueriesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer = __importStar(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const school_admin_guard_1 = require("../guards/school-admin.guard");
const super_admin_guard_1 = require("../../super-admin/guards/super-admin.guard");
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'query-attachments');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
let QueriesController = (() => {
    let _classDecorators = [(0, common_1.Controller)('school-admin/queries')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _create_decorators;
    let _uploadFile_decorators;
    let _findAllForAdmin_decorators;
    let _listFromCategoryAdmins_decorators;
    let _listFromSubCategoryAdmins_decorators;
    let _createToCategoryAdmin_decorators;
    let _createToSubCategoryAdmin_decorators;
    let _replyToCategoryAdmin_decorators;
    let _replyToSubcategoryAdmin_decorators;
    let _findAllForSuperAdmin_decorators;
    let _findOne_decorators;
    let _updateStatus_decorators;
    let _sendReply_decorators;
    let _deleteRaised_decorators;
    let _deleteFromCategoryAdmin_decorators;
    let _deleteFromSubcategoryAdmin_decorators;
    var QueriesController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _create_decorators = [(0, common_1.Post)(), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _uploadFile_decorators = [(0, common_1.Post)('upload'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                    storage: multer.diskStorage({
                        destination: (_req, _file, cb) => {
                            if (!fs.existsSync(UPLOAD_DIR)) {
                                fs.mkdirSync(UPLOAD_DIR, { recursive: true });
                            }
                            cb(null, UPLOAD_DIR);
                        },
                        filename: (_req, file, cb) => {
                            const ext = path.extname(file.originalname) || '';
                            const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
                            cb(null, name);
                        },
                    }),
                    limits: { fileSize: MAX_FILE_SIZE },
                }))];
            _findAllForAdmin_decorators = [(0, common_1.Get)(), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _listFromCategoryAdmins_decorators = [(0, common_1.Get)('from-category-admins'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _listFromSubCategoryAdmins_decorators = [(0, common_1.Get)('from-subcategory-admins'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _createToCategoryAdmin_decorators = [(0, common_1.Post)('to-category-admin'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _createToSubCategoryAdmin_decorators = [(0, common_1.Post)('to-subcategory-admin'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _replyToCategoryAdmin_decorators = [(0, common_1.Post)('from-category-admins/:id/reply'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _replyToSubcategoryAdmin_decorators = [(0, common_1.Post)('from-subcategory-admins/:id/reply'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _findAllForSuperAdmin_decorators = [(0, common_1.Get)('all'), (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard)];
            _findOne_decorators = [(0, common_1.Get)(':id'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _updateStatus_decorators = [(0, common_1.Put)(':id/status'), (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard)];
            _sendReply_decorators = [(0, common_1.Post)(':id/reply'), (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard)];
            _deleteRaised_decorators = [(0, common_1.Delete)('raised/:id'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _deleteFromCategoryAdmin_decorators = [(0, common_1.Delete)('from-category-admins/:id'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _deleteFromSubcategoryAdmin_decorators = [(0, common_1.Delete)('from-subcategory-admins/:id'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadFile_decorators, { kind: "method", name: "uploadFile", static: false, private: false, access: { has: obj => "uploadFile" in obj, get: obj => obj.uploadFile }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findAllForAdmin_decorators, { kind: "method", name: "findAllForAdmin", static: false, private: false, access: { has: obj => "findAllForAdmin" in obj, get: obj => obj.findAllForAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listFromCategoryAdmins_decorators, { kind: "method", name: "listFromCategoryAdmins", static: false, private: false, access: { has: obj => "listFromCategoryAdmins" in obj, get: obj => obj.listFromCategoryAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listFromSubCategoryAdmins_decorators, { kind: "method", name: "listFromSubCategoryAdmins", static: false, private: false, access: { has: obj => "listFromSubCategoryAdmins" in obj, get: obj => obj.listFromSubCategoryAdmins }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createToCategoryAdmin_decorators, { kind: "method", name: "createToCategoryAdmin", static: false, private: false, access: { has: obj => "createToCategoryAdmin" in obj, get: obj => obj.createToCategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createToSubCategoryAdmin_decorators, { kind: "method", name: "createToSubCategoryAdmin", static: false, private: false, access: { has: obj => "createToSubCategoryAdmin" in obj, get: obj => obj.createToSubCategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _replyToCategoryAdmin_decorators, { kind: "method", name: "replyToCategoryAdmin", static: false, private: false, access: { has: obj => "replyToCategoryAdmin" in obj, get: obj => obj.replyToCategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _replyToSubcategoryAdmin_decorators, { kind: "method", name: "replyToSubcategoryAdmin", static: false, private: false, access: { has: obj => "replyToSubcategoryAdmin" in obj, get: obj => obj.replyToSubcategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findAllForSuperAdmin_decorators, { kind: "method", name: "findAllForSuperAdmin", static: false, private: false, access: { has: obj => "findAllForSuperAdmin" in obj, get: obj => obj.findAllForSuperAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: obj => "findOne" in obj, get: obj => obj.findOne }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateStatus_decorators, { kind: "method", name: "updateStatus", static: false, private: false, access: { has: obj => "updateStatus" in obj, get: obj => obj.updateStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendReply_decorators, { kind: "method", name: "sendReply", static: false, private: false, access: { has: obj => "sendReply" in obj, get: obj => obj.sendReply }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteRaised_decorators, { kind: "method", name: "deleteRaised", static: false, private: false, access: { has: obj => "deleteRaised" in obj, get: obj => obj.deleteRaised }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteFromCategoryAdmin_decorators, { kind: "method", name: "deleteFromCategoryAdmin", static: false, private: false, access: { has: obj => "deleteFromCategoryAdmin" in obj, get: obj => obj.deleteFromCategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteFromSubcategoryAdmin_decorators, { kind: "method", name: "deleteFromSubcategoryAdmin", static: false, private: false, access: { has: obj => "deleteFromSubcategoryAdmin" in obj, get: obj => obj.deleteFromSubcategoryAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            QueriesController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        queriesService = __runInitializers(this, _instanceExtraInitializers);
        constructor(queriesService) {
            this.queriesService = queriesService;
        }
        async create(req, createQueryDto) {
            return this.queriesService.create(req.user.sub, createQueryDto);
        }
        async uploadFile(file) {
            if (!file) {
                throw new common_1.BadRequestException('File is required');
            }
            const url = `/uploads/query-attachments/${file.filename}`;
            return { url };
        }
        async findAllForAdmin(req) {
            return this.queriesService.findAll(req.user.sub);
        }
        async listFromCategoryAdmins(req) {
            return this.queriesService.listFromCategoryAdmins(req.user.sub);
        }
        async listFromSubCategoryAdmins(req) {
            return this.queriesService.listFromSubCategoryAdmins(req.user.sub);
        }
        async createToCategoryAdmin(req, dto) {
            return this.queriesService.createToCategoryAdmin(req.user.sub, dto);
        }
        async createToSubCategoryAdmin(req, dto) {
            return this.queriesService.createToSubCategoryAdmin(req.user.sub, dto);
        }
        async replyToCategoryAdmin(id, body) {
            return this.queriesService.replyToCategoryAdmin(id, body.message);
        }
        async replyToSubcategoryAdmin(id, req, body) {
            return this.queriesService.replyToSubcategoryAdmin(req.user.sub, id, body.message);
        }
        async findAllForSuperAdmin() {
            return this.queriesService.findAll();
        }
        async findOne(id) {
            return this.queriesService.findOne(id);
        }
        async updateStatus(id, body) {
            return this.queriesService.updateStatus(id, body.status);
        }
        async sendReply(id, body) {
            return this.queriesService.sendReply(id, body.message);
        }
        async deleteRaised(id, req) {
            return this.queriesService.deleteRaisedToSuperAdmin(id, req.user.sub);
        }
        async deleteFromCategoryAdmin(id, req) {
            return this.queriesService.deleteFromCategoryAdmin(id, req.user.sub);
        }
        async deleteFromSubcategoryAdmin(id, req) {
            return this.queriesService.deleteFromSubcategoryAdmin(id, req.user.sub);
        }
    };
    return QueriesController = _classThis;
})();
exports.QueriesController = QueriesController;
//# sourceMappingURL=queries.controller.js.map