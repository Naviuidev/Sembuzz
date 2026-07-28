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
exports.CategoryAdminBannerAdsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer = __importStar(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const category_admin_guard_1 = require("../guards/category-admin.guard");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const BANNER_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'category-admin-banner-ads');
let CategoryAdminBannerAdsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('category-admin/banner-ads'), (0, common_1.UseGuards)(category_admin_guard_1.CategoryAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _uploadBannerImage_decorators;
    let _create_decorators;
    let _list_decorators;
    let _getAnalytics_decorators;
    let _update_decorators;
    let _endNow_decorators;
    let _delete_decorators;
    var CategoryAdminBannerAdsController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _uploadBannerImage_decorators = [(0, common_1.Post)('upload-image'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                    storage: multer.diskStorage({
                        destination: (_req, _file, cb) => {
                            if (!fs.existsSync(BANNER_IMAGES_DIR)) {
                                fs.mkdirSync(BANNER_IMAGES_DIR, { recursive: true });
                            }
                            cb(null, BANNER_IMAGES_DIR);
                        },
                        filename: (_req, file, cb) => {
                            const ext = path.extname(file.originalname) || '.jpg';
                            cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
                        },
                    }),
                    limits: { fileSize: MAX_SIZE },
                }))];
            _create_decorators = [(0, common_1.Post)()];
            _list_decorators = [(0, common_1.Get)()];
            _getAnalytics_decorators = [(0, common_1.Get)('analytics')];
            _update_decorators = [(0, common_1.Patch)(':id')];
            _endNow_decorators = [(0, common_1.Patch)(':id/end-now')];
            _delete_decorators = [(0, common_1.Delete)(':id')];
            __esDecorate(this, null, _uploadBannerImage_decorators, { kind: "method", name: "uploadBannerImage", static: false, private: false, access: { has: obj => "uploadBannerImage" in obj, get: obj => obj.uploadBannerImage }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: obj => "create" in obj, get: obj => obj.create }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getAnalytics_decorators, { kind: "method", name: "getAnalytics", static: false, private: false, access: { has: obj => "getAnalytics" in obj, get: obj => obj.getAnalytics }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: obj => "update" in obj, get: obj => obj.update }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _endNow_decorators, { kind: "method", name: "endNow", static: false, private: false, access: { has: obj => "endNow" in obj, get: obj => obj.endNow }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _delete_decorators, { kind: "method", name: "delete", static: false, private: false, access: { has: obj => "delete" in obj, get: obj => obj.delete }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            CategoryAdminBannerAdsController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        bannerAdsService = __runInitializers(this, _instanceExtraInitializers);
        constructor(bannerAdsService) {
            this.bannerAdsService = bannerAdsService;
        }
        async uploadBannerImage(file) {
            if (!file)
                throw new common_1.BadRequestException('File is required');
            if (!ALLOWED_MIMES.includes(file.mimetype)) {
                throw new common_1.BadRequestException('Allowed types: JPEG, PNG, GIF, WebP');
            }
            return {
                url: `/uploads/category-admin-banner-ads/${file.filename}`,
            };
        }
        async create(req, dto) {
            return this.bannerAdsService.create(req.user.sub, dto);
        }
        async list(req) {
            return this.bannerAdsService.listByCategoryAdmin(req.user.sub);
        }
        async getAnalytics(req, dateFrom, dateTo, bannerAdId) {
            return this.bannerAdsService.getAnalytics(req.user.sub, dateFrom, dateTo, bannerAdId);
        }
        async update(req, id, dto) {
            return this.bannerAdsService.updateSchedule(req.user.sub, id, dto);
        }
        async endNow(req, id) {
            return this.bannerAdsService.endNow(req.user.sub, id);
        }
        async delete(req, id) {
            return this.bannerAdsService.remove(req.user.sub, id);
        }
    };
    return CategoryAdminBannerAdsController = _classThis;
})();
exports.CategoryAdminBannerAdsController = CategoryAdminBannerAdsController;
//# sourceMappingURL=banner-ads.controller.js.map