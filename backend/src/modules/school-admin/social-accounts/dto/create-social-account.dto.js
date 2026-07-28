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
exports.CreateSocialAccountDto = void 0;
const class_validator_1 = require("class-validator");
let CreateSocialAccountDto = (() => {
    let _platformId_decorators;
    let _platformId_initializers = [];
    let _platformId_extraInitializers = [];
    let _platformName_decorators;
    let _platformName_initializers = [];
    let _platformName_extraInitializers = [];
    let _pageName_decorators;
    let _pageName_initializers = [];
    let _pageName_extraInitializers = [];
    let _icon_decorators;
    let _icon_initializers = [];
    let _icon_extraInitializers = [];
    let _link_decorators;
    let _link_initializers = [];
    let _link_extraInitializers = [];
    return class CreateSocialAccountDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _platformId_decorators = [(0, class_validator_1.IsString)()];
            _platformName_decorators = [(0, class_validator_1.IsString)()];
            _pageName_decorators = [(0, class_validator_1.IsString)()];
            _icon_decorators = [(0, class_validator_1.IsString)()];
            _link_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsUrl)(), (0, class_validator_1.MaxLength)(1000)];
            __esDecorate(null, null, _platformId_decorators, { kind: "field", name: "platformId", static: false, private: false, access: { has: obj => "platformId" in obj, get: obj => obj.platformId, set: (obj, value) => { obj.platformId = value; } }, metadata: _metadata }, _platformId_initializers, _platformId_extraInitializers);
            __esDecorate(null, null, _platformName_decorators, { kind: "field", name: "platformName", static: false, private: false, access: { has: obj => "platformName" in obj, get: obj => obj.platformName, set: (obj, value) => { obj.platformName = value; } }, metadata: _metadata }, _platformName_initializers, _platformName_extraInitializers);
            __esDecorate(null, null, _pageName_decorators, { kind: "field", name: "pageName", static: false, private: false, access: { has: obj => "pageName" in obj, get: obj => obj.pageName, set: (obj, value) => { obj.pageName = value; } }, metadata: _metadata }, _pageName_initializers, _pageName_extraInitializers);
            __esDecorate(null, null, _icon_decorators, { kind: "field", name: "icon", static: false, private: false, access: { has: obj => "icon" in obj, get: obj => obj.icon, set: (obj, value) => { obj.icon = value; } }, metadata: _metadata }, _icon_initializers, _icon_extraInitializers);
            __esDecorate(null, null, _link_decorators, { kind: "field", name: "link", static: false, private: false, access: { has: obj => "link" in obj, get: obj => obj.link, set: (obj, value) => { obj.link = value; } }, metadata: _metadata }, _link_initializers, _link_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        platformId = __runInitializers(this, _platformId_initializers, void 0);
        platformName = (__runInitializers(this, _platformId_extraInitializers), __runInitializers(this, _platformName_initializers, void 0));
        pageName = (__runInitializers(this, _platformName_extraInitializers), __runInitializers(this, _pageName_initializers, void 0));
        icon = (__runInitializers(this, _pageName_extraInitializers), __runInitializers(this, _icon_initializers, void 0));
        link = (__runInitializers(this, _icon_extraInitializers), __runInitializers(this, _link_initializers, void 0));
        constructor() {
            __runInitializers(this, _link_extraInitializers);
        }
    };
})();
exports.CreateSocialAccountDto = CreateSocialAccountDto;
//# sourceMappingURL=create-social-account.dto.js.map