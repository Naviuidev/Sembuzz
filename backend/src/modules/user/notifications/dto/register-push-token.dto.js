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
exports.RegisterPushTokenDto = void 0;
const class_validator_1 = require("class-validator");
let RegisterPushTokenDto = (() => {
    let _token_decorators;
    let _token_initializers = [];
    let _token_extraInitializers = [];
    let _platform_decorators;
    let _platform_initializers = [];
    let _platform_extraInitializers = [];
    return class RegisterPushTokenDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _token_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(10)];
            _platform_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsIn)(['android', 'ios', 'web'])];
            __esDecorate(null, null, _token_decorators, { kind: "field", name: "token", static: false, private: false, access: { has: obj => "token" in obj, get: obj => obj.token, set: (obj, value) => { obj.token = value; } }, metadata: _metadata }, _token_initializers, _token_extraInitializers);
            __esDecorate(null, null, _platform_decorators, { kind: "field", name: "platform", static: false, private: false, access: { has: obj => "platform" in obj, get: obj => obj.platform, set: (obj, value) => { obj.platform = value; } }, metadata: _metadata }, _platform_initializers, _platform_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        token = __runInitializers(this, _token_initializers, void 0);
        platform = (__runInitializers(this, _token_extraInitializers), __runInitializers(this, _platform_initializers, void 0));
        constructor() {
            __runInitializers(this, _platform_extraInitializers);
        }
    };
})();
exports.RegisterPushTokenDto = RegisterPushTokenDto;
//# sourceMappingURL=register-push-token.dto.js.map