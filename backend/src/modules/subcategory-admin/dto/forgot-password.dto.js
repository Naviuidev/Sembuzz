"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordDto = exports.VerifyOtpDto = exports.RequestOtpDto = void 0;
const class_validator_1 = require("class-validator");
let RequestOtpDto = (() => {
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    return class RequestOtpDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _email_decorators = [(0, class_validator_1.IsEmail)(), (0, class_validator_1.IsNotEmpty)()];
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        email = __runInitializers(this, _email_initializers, void 0);
        constructor() {
            __runInitializers(this, _email_extraInitializers);
        }
    };
})();
exports.RequestOtpDto = RequestOtpDto;
let VerifyOtpDto = (() => {
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _otp_decorators;
    let _otp_initializers = [];
    let _otp_extraInitializers = [];
    return class VerifyOtpDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _email_decorators = [(0, class_validator_1.IsEmail)(), (0, class_validator_1.IsNotEmpty)()];
            _otp_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _otp_decorators, { kind: "field", name: "otp", static: false, private: false, access: { has: obj => "otp" in obj, get: obj => obj.otp, set: (obj, value) => { obj.otp = value; } }, metadata: _metadata }, _otp_initializers, _otp_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        email = __runInitializers(this, _email_initializers, void 0);
        otp = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _otp_initializers, void 0));
        constructor() {
            __runInitializers(this, _otp_extraInitializers);
        }
    };
})();
exports.VerifyOtpDto = VerifyOtpDto;
let ResetPasswordDto = (() => {
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _otp_decorators;
    let _otp_initializers = [];
    let _otp_extraInitializers = [];
    let _newPassword_decorators;
    let _newPassword_initializers = [];
    let _newPassword_extraInitializers = [];
    let _confirmPassword_decorators;
    let _confirmPassword_initializers = [];
    let _confirmPassword_extraInitializers = [];
    return class ResetPasswordDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _email_decorators = [(0, class_validator_1.IsEmail)(), (0, class_validator_1.IsNotEmpty)()];
            _otp_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _newPassword_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters long' })];
            _confirmPassword_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.MinLength)(8, { message: 'Confirm password must be at least 8 characters long' })];
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _otp_decorators, { kind: "field", name: "otp", static: false, private: false, access: { has: obj => "otp" in obj, get: obj => obj.otp, set: (obj, value) => { obj.otp = value; } }, metadata: _metadata }, _otp_initializers, _otp_extraInitializers);
            __esDecorate(null, null, _newPassword_decorators, { kind: "field", name: "newPassword", static: false, private: false, access: { has: obj => "newPassword" in obj, get: obj => obj.newPassword, set: (obj, value) => { obj.newPassword = value; } }, metadata: _metadata }, _newPassword_initializers, _newPassword_extraInitializers);
            __esDecorate(null, null, _confirmPassword_decorators, { kind: "field", name: "confirmPassword", static: false, private: false, access: { has: obj => "confirmPassword" in obj, get: obj => obj.confirmPassword, set: (obj, value) => { obj.confirmPassword = value; } }, metadata: _metadata }, _confirmPassword_initializers, _confirmPassword_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        email = __runInitializers(this, _email_initializers, void 0);
        otp = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _otp_initializers, void 0));
        newPassword = (__runInitializers(this, _otp_extraInitializers), __runInitializers(this, _newPassword_initializers, void 0));
        confirmPassword = (__runInitializers(this, _newPassword_extraInitializers), __runInitializers(this, _confirmPassword_initializers, void 0));
        constructor() {
            __runInitializers(this, _confirmPassword_extraInitializers);
        }
    };
})();
exports.ResetPasswordDto = ResetPasswordDto;
//# sourceMappingURL=forgot-password.dto.js.map