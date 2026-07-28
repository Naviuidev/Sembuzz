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
exports.SchoolAdminAuthController = void 0;
const common_1 = require("@nestjs/common");
const school_admin_guard_1 = require("../guards/school-admin.guard");
let SchoolAdminAuthController = (() => {
    let _classDecorators = [(0, common_1.Controller)('school-admin/auth')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _login_decorators;
    let _changePassword_decorators;
    let _getMe_decorators;
    let _requestOtp_decorators;
    let _verifyOtp_decorators;
    let _resetPassword_decorators;
    var SchoolAdminAuthController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _login_decorators = [(0, common_1.Post)('login')];
            _changePassword_decorators = [(0, common_1.Post)('change-password'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _getMe_decorators = [(0, common_1.Get)('me'), (0, common_1.UseGuards)(school_admin_guard_1.SchoolAdminGuard)];
            _requestOtp_decorators = [(0, common_1.Post)('forgot-password/request-otp')];
            _verifyOtp_decorators = [(0, common_1.Post)('forgot-password/verify-otp')];
            _resetPassword_decorators = [(0, common_1.Post)('forgot-password/reset')];
            __esDecorate(this, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: obj => "login" in obj, get: obj => obj.login }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _changePassword_decorators, { kind: "method", name: "changePassword", static: false, private: false, access: { has: obj => "changePassword" in obj, get: obj => obj.changePassword }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getMe_decorators, { kind: "method", name: "getMe", static: false, private: false, access: { has: obj => "getMe" in obj, get: obj => obj.getMe }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _requestOtp_decorators, { kind: "method", name: "requestOtp", static: false, private: false, access: { has: obj => "requestOtp" in obj, get: obj => obj.requestOtp }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _verifyOtp_decorators, { kind: "method", name: "verifyOtp", static: false, private: false, access: { has: obj => "verifyOtp" in obj, get: obj => obj.verifyOtp }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _resetPassword_decorators, { kind: "method", name: "resetPassword", static: false, private: false, access: { has: obj => "resetPassword" in obj, get: obj => obj.resetPassword }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SchoolAdminAuthController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        authService = __runInitializers(this, _instanceExtraInitializers);
        constructor(authService) {
            this.authService = authService;
        }
        async login(loginDto) {
            return this.authService.login(loginDto);
        }
        async changePassword(req, changePasswordDto) {
            return this.authService.changePassword(req.user.sub, changePasswordDto);
        }
        async getMe(req) {
            return this.authService.validateUser(req.user.sub);
        }
        async requestOtp(requestOtpDto) {
            return this.authService.requestOtp(requestOtpDto);
        }
        async verifyOtp(verifyOtpDto) {
            return this.authService.verifyOtp(verifyOtpDto);
        }
        async resetPassword(resetPasswordDto) {
            return this.authService.resetPassword(resetPasswordDto);
        }
    };
    return SchoolAdminAuthController = _classThis;
})();
exports.SchoolAdminAuthController = SchoolAdminAuthController;
//# sourceMappingURL=auth.controller.js.map