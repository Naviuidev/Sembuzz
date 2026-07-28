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
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
let RegisterDto = (() => {
    let _registrationMethod_decorators;
    let _registrationMethod_initializers = [];
    let _registrationMethod_extraInitializers = [];
    let _firstName_decorators;
    let _firstName_initializers = [];
    let _firstName_extraInitializers = [];
    let _lastName_decorators;
    let _lastName_initializers = [];
    let _lastName_extraInitializers = [];
    let _profilePicUrl_decorators;
    let _profilePicUrl_initializers = [];
    let _profilePicUrl_extraInitializers = [];
    let _schoolId_decorators;
    let _schoolId_initializers = [];
    let _schoolId_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    let _verificationDocUrl_decorators;
    let _verificationDocUrl_initializers = [];
    let _verificationDocUrl_extraInitializers = [];
    return class RegisterDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _registrationMethod_decorators = [(0, class_validator_1.IsIn)(['school_domain', 'gmail'], { message: 'registrationMethod must be school_domain or gmail' })];
            _firstName_decorators = [(0, class_validator_1.IsString)()];
            _lastName_decorators = [(0, class_validator_1.IsString)()];
            _profilePicUrl_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _schoolId_decorators = [(0, class_validator_1.IsUUID)()];
            _email_decorators = [(0, class_validator_1.IsEmail)()];
            _password_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters' })];
            _verificationDocUrl_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _registrationMethod_decorators, { kind: "field", name: "registrationMethod", static: false, private: false, access: { has: obj => "registrationMethod" in obj, get: obj => obj.registrationMethod, set: (obj, value) => { obj.registrationMethod = value; } }, metadata: _metadata }, _registrationMethod_initializers, _registrationMethod_extraInitializers);
            __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: obj => "firstName" in obj, get: obj => obj.firstName, set: (obj, value) => { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
            __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: obj => "lastName" in obj, get: obj => obj.lastName, set: (obj, value) => { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
            __esDecorate(null, null, _profilePicUrl_decorators, { kind: "field", name: "profilePicUrl", static: false, private: false, access: { has: obj => "profilePicUrl" in obj, get: obj => obj.profilePicUrl, set: (obj, value) => { obj.profilePicUrl = value; } }, metadata: _metadata }, _profilePicUrl_initializers, _profilePicUrl_extraInitializers);
            __esDecorate(null, null, _schoolId_decorators, { kind: "field", name: "schoolId", static: false, private: false, access: { has: obj => "schoolId" in obj, get: obj => obj.schoolId, set: (obj, value) => { obj.schoolId = value; } }, metadata: _metadata }, _schoolId_initializers, _schoolId_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            __esDecorate(null, null, _verificationDocUrl_decorators, { kind: "field", name: "verificationDocUrl", static: false, private: false, access: { has: obj => "verificationDocUrl" in obj, get: obj => obj.verificationDocUrl, set: (obj, value) => { obj.verificationDocUrl = value; } }, metadata: _metadata }, _verificationDocUrl_initializers, _verificationDocUrl_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        registrationMethod = __runInitializers(this, _registrationMethod_initializers, void 0);
        firstName = (__runInitializers(this, _registrationMethod_extraInitializers), __runInitializers(this, _firstName_initializers, void 0));
        lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
        profilePicUrl = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _profilePicUrl_initializers, void 0));
        schoolId = (__runInitializers(this, _profilePicUrl_extraInitializers), __runInitializers(this, _schoolId_initializers, void 0));
        email = (__runInitializers(this, _schoolId_extraInitializers), __runInitializers(this, _email_initializers, void 0));
        password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
        /** Required for gmail/public domain: URL of uploaded school doc (ID card, fee receipt, etc.) */
        verificationDocUrl = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _verificationDocUrl_initializers, void 0));
        constructor() {
            __runInitializers(this, _verificationDocUrl_extraInitializers);
        }
    };
})();
exports.RegisterDto = RegisterDto;
//# sourceMappingURL=register.dto.js.map