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
exports.SubCategoryAdminBlogsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer = __importStar(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const subcategory_admin_guard_1 = require("../guards/subcategory-admin.guard");
const parse_create_blog_body_1 = require("./dto/parse-create-blog-body");
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const BLOG_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'subcategory-admin-blog-images');
let SubCategoryAdminBlogsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('subcategory-admin/blogs'), (0, common_1.UseGuards)(subcategory_admin_guard_1.SubCategoryAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _uploadImage_decorators;
    let _create_decorators;
    let _pending_decorators;
    let _reverted_decorators;
    let _rejected_decorators;
    let _approved_decorators;
    var SubCategoryAdminBlogsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _uploadImage_decorators = [(0, common_1.Post)('upload-image'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                    storage: multer.diskStorage({
                        destination: (_req, _file, cb) => {
                            if (!fs.existsSync(BLOG_IMAGES_DIR)) {
                                fs.mkdirSync(BLOG_IMAGES_DIR, { recursive: true });
                            }
                            cb(null, BLOG_IMAGES_DIR);
                        },
                        filename: (_req, file, cb) => {
                            const ext = path.extname(file.originalname) || '.jpg';
                            cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
                        },
                    }),
                    limits: { fileSize: MAX_SIZE },
                }))];
            _create_decorators = [(0, common_1.Post)()];
            _pending_decorators = [(0, common_1.Get)('pending')];
            _reverted_decorators = [(0, common_1.Get)('reverted')];
            _rejected_decorators = [(0, common_1.Get)('rejected')];
            _approved_decorators = [(0, common_1.Get)('approved')];
            __esDecorate(this, null, _uploadImage_decorators, { kind: "method", name: "uploadImage", static: false, private: false, access: { has: obj => "uploadImage" in obj, get: obj => obj.uploadImage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _pending_decorators, { kind: "method", name: "pending", static: false, private: false, access: { has: obj => "pending" in obj, get: obj => obj.pending }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reverted_decorators, { kind: "method", name: "reverted", static: false, private: false, access: { has: obj => "reverted" in obj, get: obj => obj.reverted }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _rejected_decorators, { kind: "method", name: "rejected", static: false, private: false, access: { has: obj => "rejected" in obj, get: obj => obj.rejected }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _approved_decorators, { kind: "method", name: "approved", static: false, private: false, access: { has: obj => "approved" in obj, get: obj => obj.approved }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SubCategoryAdminBlogsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        blogsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(blogsService) {
            this.blogsService = blogsService;
        }
        async uploadImage(file) {
            if (!file)
                throw new common_1.BadRequestException('File is required');
            if (!ALLOWED_MIMES.includes(file.mimetype)) {
                throw new common_1.BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
            }
            return {
                url: `/uploads/subcategory-admin-blog-images/${file.filename}`,
            };
        }
        async create(req) {
            const dto = (0, parse_create_blog_body_1.parseCreateBlogBody)(req.body);
            if (!dto.subCategoryId?.trim() || !dto.title?.trim()) {
                throw new common_1.BadRequestException('subCategoryId and title are required');
            }
            return this.blogsService.create(req.user.sub, dto);
        }
        async pending(req) {
            return this.blogsService.findPending(req.user.sub);
        }
        async reverted(req) {
            return this.blogsService.findReverted(req.user.sub);
        }
        async rejected(req) {
            return this.blogsService.findRejected(req.user.sub);
        }
        async approved(req) {
            return this.blogsService.findApproved(req.user.sub);
        }
    };
    return SubCategoryAdminBlogsController = _classThis;
})();
exports.SubCategoryAdminBlogsController = SubCategoryAdminBlogsController;
//# sourceMappingURL=blogs.controller.js.map