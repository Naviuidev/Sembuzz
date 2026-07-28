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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer = __importStar(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const subcategory_admin_guard_1 = require("../guards/subcategory-admin.guard");
const parse_create_blog_body_1 = require("../blogs/dto/parse-create-blog-body");
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const EVENT_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'subcategory-admin-event-images');
const BLOG_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'subcategory-admin-blog-images');
let EventsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('subcategory-admin/events'), (0, common_1.UseGuards)(subcategory_admin_guard_1.SubCategoryAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _analyzeBanner_decorators;
    let _uploadEventImage_decorators;
    let _createBlog_decorators;
    let _create_decorators;
    let _findPending_decorators;
    let _findReverted_decorators;
    let _findApproved_decorators;
    var EventsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _analyzeBanner_decorators = [(0, common_1.Post)('analyze-banner'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('banner', {
                    storage: multer.memoryStorage(),
                    limits: { fileSize: MAX_SIZE },
                }))];
            _uploadEventImage_decorators = [(0, common_1.Post)('upload-image'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                    storage: multer.diskStorage({
                        destination: (req, _file, cb) => {
                            const forBlog = String(req.query?.for || '') === 'blog' ||
                                String(req.query?.dest || '') === 'blog';
                            const dir = forBlog ? BLOG_IMAGES_DIR : EVENT_IMAGES_DIR;
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            cb(null, dir);
                        },
                        filename: (_req, file, cb) => {
                            const ext = path.extname(file.originalname) || '.jpg';
                            cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
                        },
                    }),
                    limits: { fileSize: MAX_SIZE },
                }))];
            _createBlog_decorators = [(0, common_1.Post)('blog')];
            _create_decorators = [(0, common_1.Post)()];
            _findPending_decorators = [(0, common_1.Get)('pending')];
            _findReverted_decorators = [(0, common_1.Get)('reverted')];
            _findApproved_decorators = [(0, common_1.Get)('approved')];
            __esDecorate(this, null, _analyzeBanner_decorators, { kind: "method", name: "analyzeBanner", static: false, private: false, access: { has: obj => "analyzeBanner" in obj, get: obj => obj.analyzeBanner }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadEventImage_decorators, { kind: "method", name: "uploadEventImage", static: false, private: false, access: { has: obj => "uploadEventImage" in obj, get: obj => obj.uploadEventImage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createBlog_decorators, { kind: "method", name: "createBlog", static: false, private: false, access: { has: obj => "createBlog" in obj, get: obj => obj.createBlog }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findPending_decorators, { kind: "method", name: "findPending", static: false, private: false, access: { has: obj => "findPending" in obj, get: obj => obj.findPending }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findReverted_decorators, { kind: "method", name: "findReverted", static: false, private: false, access: { has: obj => "findReverted" in obj, get: obj => obj.findReverted }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findApproved_decorators, { kind: "method", name: "findApproved", static: false, private: false, access: { has: obj => "findApproved" in obj, get: obj => obj.findApproved }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            EventsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        eventsService = __runInitializers(this, _instanceExtraInitializers);
        blogsService;
        constructor(eventsService, blogsService) {
            this.eventsService = eventsService;
            this.blogsService = blogsService;
        }
        async analyzeBanner(file) {
            if (!file) {
                throw new common_1.BadRequestException('Banner image is required');
            }
            const buffer = file.buffer ?? file.buffer;
            if (!buffer) {
                throw new common_1.BadRequestException('Could not read file. Try a smaller image.');
            }
            if (!ALLOWED_MIMES.includes(file.mimetype)) {
                throw new common_1.BadRequestException('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
            }
            return this.eventsService.analyzeBannerImage(buffer, file.mimetype);
        }
        /** Event images, or blog images when query ?for=blog (same URL so one proxy / one route always works) */
        async uploadEventImage(req, file) {
            if (!file)
                throw new common_1.BadRequestException('File is required');
            if (!ALLOWED_MIMES.includes(file.mimetype)) {
                throw new common_1.BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
            }
            const forBlog = String(req.query?.for || '') === 'blog' ||
                String(req.query?.dest || '') === 'blog';
            const sub = forBlog ? 'subcategory-admin-blog-images' : 'subcategory-admin-event-images';
            /** Path only — clients resolve with their API base (avoids localhost vs production mismatch in DB). */
            return {
                url: `/uploads/${sub}/${file.filename}`,
            };
        }
        /** Create blog (raw body — avoids ValidationPipe rejecting hero/contentBlocks). */
        async createBlog(req) {
            const dto = (0, parse_create_blog_body_1.parseCreateBlogBody)(req.body);
            if (!dto.subCategoryId?.trim() || !dto.title?.trim()) {
                throw new common_1.BadRequestException('subCategoryId and title are required');
            }
            return this.blogsService.create(req.user.sub, dto);
        }
        async create(req, dto) {
            return this.eventsService.create(req.user.sub, dto);
        }
        async findPending(req) {
            return this.eventsService.findPendingBySubCategoryAdmin(req.user.sub);
        }
        async findReverted(req) {
            return this.eventsService.findRevertedBySubCategoryAdmin(req.user.sub);
        }
        async findApproved(req) {
            return this.eventsService.findApprovedBySubCategoryAdmin(req.user.sub);
        }
    };
    return EventsController = _classThis;
})();
exports.EventsController = EventsController;
//# sourceMappingURL=events.controller.js.map