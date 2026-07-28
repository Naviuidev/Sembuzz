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
exports.UserAuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer = __importStar(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const user_guard_1 = require("../guards/user.guard");
const REGISTRATION_DOCS_DIR = path.join(process.cwd(), 'uploads', 'registration-docs');
const PROFILE_PICS_DIR = path.join(process.cwd(), 'uploads', 'profile-pics');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
let UserAuthController = (() => {
    let _classDecorators = [(0, common_1.Controller)('user/auth')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getSchools_decorators;
    let _verifyUpdateDocToken_decorators;
    let _verifyApproval_decorators;
    let _submitUpdateDoc_decorators;
    let _uploadRegistrationDoc_decorators;
    let _uploadProfilePic_decorators;
    let _register_decorators;
    let _resendOtp_decorators;
    let _verifyOtp_decorators;
    let _login_decorators;
    let _requestPasswordResetOtp_decorators;
    let _verifyPasswordResetOtp_decorators;
    let _resetPassword_decorators;
    let _getMe_decorators;
    let _deleteAccount_decorators;
    let _updateProfile_decorators;
    var UserAuthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _getSchools_decorators = [(0, common_1.Get)('schools')];
            _verifyUpdateDocToken_decorators = [(0, common_1.Get)('verify-update-doc-token')];
            _verifyApproval_decorators = [(0, common_1.Get)('verify-approval')];
            _submitUpdateDoc_decorators = [(0, common_1.Post)('submit-update-doc'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                    storage: multer.diskStorage({
                        destination: (_req, _file, cb) => {
                            if (!fs.existsSync(REGISTRATION_DOCS_DIR)) {
                                fs.mkdirSync(REGISTRATION_DOCS_DIR, { recursive: true });
                            }
                            cb(null, REGISTRATION_DOCS_DIR);
                        },
                        filename: (_req, file, cb) => {
                            const ext = path.extname(file.originalname) || '';
                            const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
                            cb(null, name);
                        },
                    }),
                    limits: { fileSize: MAX_FILE_SIZE },
                }))];
            _uploadRegistrationDoc_decorators = [(0, common_1.Post)('upload-registration-doc'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                    storage: multer.diskStorage({
                        destination: (_req, _file, cb) => {
                            if (!fs.existsSync(REGISTRATION_DOCS_DIR)) {
                                fs.mkdirSync(REGISTRATION_DOCS_DIR, { recursive: true });
                            }
                            cb(null, REGISTRATION_DOCS_DIR);
                        },
                        filename: (_req, file, cb) => {
                            const ext = path.extname(file.originalname) || '';
                            const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
                            cb(null, name);
                        },
                    }),
                    limits: { fileSize: MAX_FILE_SIZE },
                }))];
            _uploadProfilePic_decorators = [(0, common_1.Post)('upload-profile-pic'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                    storage: multer.diskStorage({
                        destination: (_req, _file, cb) => {
                            if (!fs.existsSync(PROFILE_PICS_DIR)) {
                                fs.mkdirSync(PROFILE_PICS_DIR, { recursive: true });
                            }
                            cb(null, PROFILE_PICS_DIR);
                        },
                        filename: (_req, file, cb) => {
                            const ext = path.extname(file.originalname) || '.jpg';
                            const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
                            cb(null, name);
                        },
                    }),
                    limits: { fileSize: MAX_FILE_SIZE },
                }))];
            _register_decorators = [(0, common_1.Post)('register')];
            _resendOtp_decorators = [(0, common_1.Post)('resend-otp')];
            _verifyOtp_decorators = [(0, common_1.Post)('verify-otp')];
            _login_decorators = [(0, common_1.Post)('login')];
            _requestPasswordResetOtp_decorators = [(0, common_1.Post)('forgot-password/request-otp')];
            _verifyPasswordResetOtp_decorators = [(0, common_1.Post)('forgot-password/verify-otp')];
            _resetPassword_decorators = [(0, common_1.Post)('forgot-password/reset')];
            _getMe_decorators = [(0, common_1.Get)('me'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            _deleteAccount_decorators = [(0, common_1.Post)('delete-account'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            _updateProfile_decorators = [(0, common_1.Post)('update-profile'), (0, common_1.UseGuards)(user_guard_1.UserGuard)];
            __esDecorate(this, null, _getSchools_decorators, { kind: "method", name: "getSchools", static: false, private: false, access: { has: obj => "getSchools" in obj, get: obj => obj.getSchools }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _verifyUpdateDocToken_decorators, { kind: "method", name: "verifyUpdateDocToken", static: false, private: false, access: { has: obj => "verifyUpdateDocToken" in obj, get: obj => obj.verifyUpdateDocToken }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _verifyApproval_decorators, { kind: "method", name: "verifyApproval", static: false, private: false, access: { has: obj => "verifyApproval" in obj, get: obj => obj.verifyApproval }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _submitUpdateDoc_decorators, { kind: "method", name: "submitUpdateDoc", static: false, private: false, access: { has: obj => "submitUpdateDoc" in obj, get: obj => obj.submitUpdateDoc }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadRegistrationDoc_decorators, { kind: "method", name: "uploadRegistrationDoc", static: false, private: false, access: { has: obj => "uploadRegistrationDoc" in obj, get: obj => obj.uploadRegistrationDoc }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _uploadProfilePic_decorators, { kind: "method", name: "uploadProfilePic", static: false, private: false, access: { has: obj => "uploadProfilePic" in obj, get: obj => obj.uploadProfilePic }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _register_decorators, { kind: "method", name: "register", static: false, private: false, access: { has: obj => "register" in obj, get: obj => obj.register }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resendOtp_decorators, { kind: "method", name: "resendOtp", static: false, private: false, access: { has: obj => "resendOtp" in obj, get: obj => obj.resendOtp }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _verifyOtp_decorators, { kind: "method", name: "verifyOtp", static: false, private: false, access: { has: obj => "verifyOtp" in obj, get: obj => obj.verifyOtp }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: obj => "login" in obj, get: obj => obj.login }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _requestPasswordResetOtp_decorators, { kind: "method", name: "requestPasswordResetOtp", static: false, private: false, access: { has: obj => "requestPasswordResetOtp" in obj, get: obj => obj.requestPasswordResetOtp }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _verifyPasswordResetOtp_decorators, { kind: "method", name: "verifyPasswordResetOtp", static: false, private: false, access: { has: obj => "verifyPasswordResetOtp" in obj, get: obj => obj.verifyPasswordResetOtp }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resetPassword_decorators, { kind: "method", name: "resetPassword", static: false, private: false, access: { has: obj => "resetPassword" in obj, get: obj => obj.resetPassword }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getMe_decorators, { kind: "method", name: "getMe", static: false, private: false, access: { has: obj => "getMe" in obj, get: obj => obj.getMe }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _deleteAccount_decorators, { kind: "method", name: "deleteAccount", static: false, private: false, access: { has: obj => "deleteAccount" in obj, get: obj => obj.deleteAccount }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _updateProfile_decorators, { kind: "method", name: "updateProfile", static: false, private: false, access: { has: obj => "updateProfile" in obj, get: obj => obj.updateProfile }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserAuthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        authService = __runInitializers(this, _instanceExtraInitializers);
        constructor(authService) {
            this.authService = authService;
        }
        async getSchools() {
            return this.authService.getSchools();
        }
        async verifyUpdateDocToken(token) {
            return this.authService.verifyUpdateDocToken(token || '');
        }
        async verifyApproval(token) {
            return this.authService.verifyApprovalToken(token || '');
        }
        async submitUpdateDoc(req, file) {
            const token = req.body?.token;
            if (!token) {
                throw new common_1.BadRequestException('Link expired or invalid. Please use the latest link from your email.');
            }
            if (!file) {
                throw new common_1.BadRequestException('Please select a file to upload.');
            }
            const docUrl = `/uploads/registration-docs/${file.filename}`;
            return this.authService.submitUpdateDoc(token, docUrl);
        }
        async uploadRegistrationDoc(file) {
            if (!file) {
                throw new common_1.BadRequestException('Please select a file to upload.');
            }
            const url = `/uploads/registration-docs/${file.filename}`;
            return { url };
        }
        async uploadProfilePic(file) {
            if (!file) {
                throw new common_1.BadRequestException('Please select a file to upload.');
            }
            const url = `/uploads/profile-pics/${file.filename}`;
            return { url };
        }
        async register(dto) {
            return this.authService.register(dto);
        }
        async resendOtp(dto) {
            return this.authService.resendOtp(dto.email);
        }
        async verifyOtp(dto) {
            return this.authService.verifyOtp(dto);
        }
        async login(dto) {
            return this.authService.login(dto);
        }
        async requestPasswordResetOtp(dto) {
            return this.authService.requestPasswordResetOtp(dto);
        }
        async verifyPasswordResetOtp(dto) {
            return this.authService.verifyPasswordResetOtp(dto);
        }
        async resetPassword(dto) {
            return this.authService.resetPassword(dto);
        }
        async getMe(req) {
            return this.authService.getMe(req.user.sub);
        }
        async deleteAccount(req, dto) {
            return this.authService.deleteAccount(req.user.sub, dto.password);
        }
        async updateProfile(req, dto) {
            return this.authService.updateProfile(req.user.sub, dto);
        }
    };
    return UserAuthController = _classThis;
})();
exports.UserAuthController = UserAuthController;
//# sourceMappingURL=auth.controller.js.map