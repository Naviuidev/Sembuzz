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
exports.SchoolAdminSocialAccountsController = void 0;
const common_1 = require("@nestjs/common");
const multer_exception_filter_1 = require("../../../common/filters/multer-exception.filter");
const platform_express_1 = require("@nestjs/platform-express");
const multer = __importStar(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const school_admin_guard_1 = require("../guards/school-admin.guard");
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIMES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'text/xml', // SVG sometimes reported as text/xml
    'application/xml', // SVG sometimes reported as application/xml
];
const CLUB_ICONS_DIR = path.join(process.cwd(), 'uploads', 'school-admin-club-icons');
function isAllowedFile(file) {
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    if (ext === '.svg')
        return true; // Allow any MIME for .svg (browsers vary)
    return ALLOWED_MIMES.includes(file.mimetype);
}
let SchoolAdminSocialAccountsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('school-admin/social-accounts'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _uploadIcon_decorators;
    let _list_decorators;
    let _createBulk_decorators;
    let _create_decorators;
    let _update_decorators;
    let _remove_decorators;
    var SchoolAdminSocialAccountsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _uploadIcon_decorators = [(0, common_1.Post)('upload-icon'), (0, common_1.UseFilters)(multer_exception_filter_1.MulterExceptionFilter), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                    storage: multer.diskStorage({
                        destination: (_req, _file, cb) => {
                            if (!fs.existsSync(CLUB_ICONS_DIR)) {
                                fs.mkdirSync(CLUB_ICONS_DIR, { recursive: true });
                            }
                            cb(null, CLUB_ICONS_DIR);
                        },
                        filename: (_req, file, cb) => {
                            const ext = path.extname(file.originalname) || '.png';
                            cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
                        },
                    }),
                    limits: { fileSize: MAX_SIZE },
                }))];
            _list_decorators = [(0, common_1.Get)()];
            _createBulk_decorators = [(0, common_1.Post)('bulk')];
            _create_decorators = [(0, common_1.Post)()];
            _update_decorators = [(0, common_1.Patch)(':id')];
            _remove_decorators = [(0, common_1.Delete)(':id')];
            __esDecorate(this, null, _uploadIcon_decorators, { kind: "method", name: "uploadIcon", static: false, private: false, access: { has: obj => "uploadIcon" in obj, get: obj => obj.uploadIcon }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createBulk_decorators, { kind: "method", name: "createBulk", static: false, private: false, access: { has: obj => "createBulk" in obj, get: obj => obj.createBulk }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: obj => "remove" in obj, get: obj => obj.remove }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SchoolAdminSocialAccountsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        constructor(service) {
            this.service = service;
        }
        async uploadIcon(file) {
            if (!file)
                throw new common_1.BadRequestException('Please select a file to upload.');
            if (!isAllowedFile(file)) {
                throw new common_1.BadRequestException('Allowed types: JPEG, PNG, GIF, WebP, SVG. Your file may have an unexpected MIME type—try renaming to .svg or use a PNG.');
            }
            return {
                url: `/uploads/school-admin-club-icons/${file.filename}`,
            };
        }
        async list(req) {
            return this.service.findAllForSchool(req.user.schoolId);
        }
        async createBulk(req, body) {
            return this.service.createMany(req.user.schoolId, body.accounts);
        }
        async create(req, dto) {
            return this.service.create(req.user.schoolId, dto);
        }
        async update(id, req, dto) {
            return this.service.update(id, req.user.schoolId, dto);
        }
        async remove(id, req) {
            return this.service.remove(id, req.user.schoolId);
        }
    };
    return SchoolAdminSocialAccountsController = _classThis;
})();
exports.SchoolAdminSocialAccountsController = SchoolAdminSocialAccountsController;
//# sourceMappingURL=school-admin-social-accounts.controller.js.map