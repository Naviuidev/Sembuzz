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
exports.UpdateProfileDto = void 0;
const class_validator_1 = require("class-validator");
let UpdateProfileDto = (() => {
    let _firstName_decorators;
    let _firstName_initializers = [];
    let _firstName_extraInitializers = [];
    let _lastName_decorators;
    let _lastName_initializers = [];
    let _lastName_extraInitializers = [];
    let _profilePicUrl_decorators;
    let _profilePicUrl_initializers = [];
    let _profilePicUrl_extraInitializers = [];
    let _currentPassword_decorators;
    let _currentPassword_initializers = [];
    let _currentPassword_extraInitializers = [];
    let _newPassword_decorators;
    let _newPassword_initializers = [];
    let _newPassword_extraInitializers = [];
    let _confirmPassword_decorators;
    let _confirmPassword_initializers = [];
    let _confirmPassword_extraInitializers = [];
    return class UpdateProfileDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _firstName_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1, { message: 'First name cannot be empty' })];
            _lastName_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1, { message: 'Last name cannot be empty' })];
            _profilePicUrl_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _currentPassword_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _newPassword_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(6, { message: 'New password must be at least 6 characters' })];
            _confirmPassword_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: obj => "firstName" in obj, get: obj => obj.firstName, set: (obj, value) => { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
            __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: obj => "lastName" in obj, get: obj => obj.lastName, set: (obj, value) => { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
            __esDecorate(null, null, _profilePicUrl_decorators, { kind: "field", name: "profilePicUrl", static: false, private: false, access: { has: obj => "profilePicUrl" in obj, get: obj => obj.profilePicUrl, set: (obj, value) => { obj.profilePicUrl = value; } }, metadata: _metadata }, _profilePicUrl_initializers, _profilePicUrl_extraInitializers);
            __esDecorate(null, null, _currentPassword_decorators, { kind: "field", name: "currentPassword", static: false, private: false, access: { has: obj => "currentPassword" in obj, get: obj => obj.currentPassword, set: (obj, value) => { obj.currentPassword = value; } }, metadata: _metadata }, _currentPassword_initializers, _currentPassword_extraInitializers);
            __esDecorate(null, null, _newPassword_decorators, { kind: "field", name: "newPassword", static: false, private: false, access: { has: obj => "newPassword" in obj, get: obj => obj.newPassword, set: (obj, value) => { obj.newPassword = value; } }, metadata: _metadata }, _newPassword_initializers, _newPassword_extraInitializers);
            __esDecorate(null, null, _confirmPassword_decorators, { kind: "field", name: "confirmPassword", static: false, private: false, access: { has: obj => "confirmPassword" in obj, get: obj => obj.confirmPassword, set: (obj, value) => { obj.confirmPassword = value; } }, metadata: _metadata }, _confirmPassword_initializers, _confirmPassword_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        firstName = __runInitializers(this, _firstName_initializers, void 0);
        lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
        profilePicUrl = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _profilePicUrl_initializers, void 0));
        currentPassword = (__runInitializers(this, _profilePicUrl_extraInitializers), __runInitializers(this, _currentPassword_initializers, void 0));
        newPassword = (__runInitializers(this, _currentPassword_extraInitializers), __runInitializers(this, _newPassword_initializers, void 0));
        confirmPassword = (__runInitializers(this, _newPassword_extraInitializers), __runInitializers(this, _confirmPassword_initializers, void 0));
        constructor() {
            __runInitializers(this, _confirmPassword_extraInitializers);
        }
    };
})();
exports.UpdateProfileDto = UpdateProfileDto;
//# sourceMappingURL=update-profile.dto.js.map