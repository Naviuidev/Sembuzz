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
exports.UpdateScrapedEventSourceDto = void 0;
const class_validator_1 = require("class-validator");
let UpdateScrapedEventSourceDto = (() => {
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _websiteUrl_decorators;
    let _websiteUrl_initializers = [];
    let _websiteUrl_extraInitializers = [];
    let _scraperType_decorators;
    let _scraperType_initializers = [];
    let _scraperType_extraInitializers = [];
    let _selectorsJson_decorators;
    let _selectorsJson_initializers = [];
    let _selectorsJson_extraInitializers = [];
    let _active_decorators;
    let _active_initializers = [];
    let _active_extraInitializers = [];
    return class UpdateScrapedEventSourceDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2)];
            _websiteUrl_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^https?:\/\/.+/i, { message: 'websiteUrl must start with http:// or https://' })];
            _scraperType_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _selectorsJson_decorators = [(0, class_validator_1.IsOptional)()];
            _active_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _websiteUrl_decorators, { kind: "field", name: "websiteUrl", static: false, private: false, access: { has: obj => "websiteUrl" in obj, get: obj => obj.websiteUrl, set: (obj, value) => { obj.websiteUrl = value; } }, metadata: _metadata }, _websiteUrl_initializers, _websiteUrl_extraInitializers);
            __esDecorate(null, null, _scraperType_decorators, { kind: "field", name: "scraperType", static: false, private: false, access: { has: obj => "scraperType" in obj, get: obj => obj.scraperType, set: (obj, value) => { obj.scraperType = value; } }, metadata: _metadata }, _scraperType_initializers, _scraperType_extraInitializers);
            __esDecorate(null, null, _selectorsJson_decorators, { kind: "field", name: "selectorsJson", static: false, private: false, access: { has: obj => "selectorsJson" in obj, get: obj => obj.selectorsJson, set: (obj, value) => { obj.selectorsJson = value; } }, metadata: _metadata }, _selectorsJson_initializers, _selectorsJson_extraInitializers);
            __esDecorate(null, null, _active_decorators, { kind: "field", name: "active", static: false, private: false, access: { has: obj => "active" in obj, get: obj => obj.active, set: (obj, value) => { obj.active = value; } }, metadata: _metadata }, _active_initializers, _active_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        name = __runInitializers(this, _name_initializers, void 0);
        websiteUrl = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _websiteUrl_initializers, void 0));
        scraperType = (__runInitializers(this, _websiteUrl_extraInitializers), __runInitializers(this, _scraperType_initializers, void 0));
        selectorsJson = (__runInitializers(this, _scraperType_extraInitializers), __runInitializers(this, _selectorsJson_initializers, void 0));
        active = (__runInitializers(this, _selectorsJson_extraInitializers), __runInitializers(this, _active_initializers, void 0));
        constructor() {
            __runInitializers(this, _active_extraInitializers);
        }
    };
})();
exports.UpdateScrapedEventSourceDto = UpdateScrapedEventSourceDto;
//# sourceMappingURL=update-scraped-event-source.dto.js.map