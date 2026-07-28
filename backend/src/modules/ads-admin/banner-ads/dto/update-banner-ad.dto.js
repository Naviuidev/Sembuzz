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
exports.UpdateBannerAdDto = void 0;
const class_validator_1 = require("class-validator");
let UpdateBannerAdDto = (() => {
    let _startAt_decorators;
    let _startAt_initializers = [];
    let _startAt_extraInitializers = [];
    let _endAt_decorators;
    let _endAt_initializers = [];
    let _endAt_extraInitializers = [];
    let _externalLink_decorators;
    let _externalLink_initializers = [];
    let _externalLink_extraInitializers = [];
    return class UpdateBannerAdDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _startAt_decorators = [(0, class_validator_1.IsDateString)()];
            _endAt_decorators = [(0, class_validator_1.IsDateString)()];
            _externalLink_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _startAt_decorators, { kind: "field", name: "startAt", static: false, private: false, access: { has: obj => "startAt" in obj, get: obj => obj.startAt, set: (obj, value) => { obj.startAt = value; } }, metadata: _metadata }, _startAt_initializers, _startAt_extraInitializers);
            __esDecorate(null, null, _endAt_decorators, { kind: "field", name: "endAt", static: false, private: false, access: { has: obj => "endAt" in obj, get: obj => obj.endAt, set: (obj, value) => { obj.endAt = value; } }, metadata: _metadata }, _endAt_initializers, _endAt_extraInitializers);
            __esDecorate(null, null, _externalLink_decorators, { kind: "field", name: "externalLink", static: false, private: false, access: { has: obj => "externalLink" in obj, get: obj => obj.externalLink, set: (obj, value) => { obj.externalLink = value; } }, metadata: _metadata }, _externalLink_initializers, _externalLink_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        startAt = __runInitializers(this, _startAt_initializers, void 0);
        endAt = (__runInitializers(this, _startAt_extraInitializers), __runInitializers(this, _endAt_initializers, void 0));
        externalLink = (__runInitializers(this, _endAt_extraInitializers), __runInitializers(this, _externalLink_initializers, void 0));
        constructor() {
            __runInitializers(this, _externalLink_extraInitializers);
        }
    };
})();
exports.UpdateBannerAdDto = UpdateBannerAdDto;
//# sourceMappingURL=update-banner-ad.dto.js.map