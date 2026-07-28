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
exports.CreateEventDto = void 0;
const class_validator_1 = require("class-validator");
let CreateEventDto = (() => {
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _externalLink_decorators;
    let _externalLink_initializers = [];
    let _externalLink_extraInitializers = [];
    let _commentsEnabled_decorators;
    let _commentsEnabled_initializers = [];
    let _commentsEnabled_extraInitializers = [];
    let _subCategoryId_decorators;
    let _subCategoryId_initializers = [];
    let _subCategoryId_extraInitializers = [];
    let _imageUrls_decorators;
    let _imageUrls_initializers = [];
    let _imageUrls_extraInitializers = [];
    return class CreateEventDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _title_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            _description_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _externalLink_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            _commentsEnabled_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _subCategoryId_decorators = [(0, class_validator_1.IsString)()];
            _imageUrls_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true })];
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _externalLink_decorators, { kind: "field", name: "externalLink", static: false, private: false, access: { has: obj => "externalLink" in obj, get: obj => obj.externalLink, set: (obj, value) => { obj.externalLink = value; } }, metadata: _metadata }, _externalLink_initializers, _externalLink_extraInitializers);
            __esDecorate(null, null, _commentsEnabled_decorators, { kind: "field", name: "commentsEnabled", static: false, private: false, access: { has: obj => "commentsEnabled" in obj, get: obj => obj.commentsEnabled, set: (obj, value) => { obj.commentsEnabled = value; } }, metadata: _metadata }, _commentsEnabled_initializers, _commentsEnabled_extraInitializers);
            __esDecorate(null, null, _subCategoryId_decorators, { kind: "field", name: "subCategoryId", static: false, private: false, access: { has: obj => "subCategoryId" in obj, get: obj => obj.subCategoryId, set: (obj, value) => { obj.subCategoryId = value; } }, metadata: _metadata }, _subCategoryId_initializers, _subCategoryId_extraInitializers);
            __esDecorate(null, null, _imageUrls_decorators, { kind: "field", name: "imageUrls", static: false, private: false, access: { has: obj => "imageUrls" in obj, get: obj => obj.imageUrls, set: (obj, value) => { obj.imageUrls = value; } }, metadata: _metadata }, _imageUrls_initializers, _imageUrls_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        title = __runInitializers(this, _title_initializers, void 0);
        description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        externalLink = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _externalLink_initializers, void 0));
        commentsEnabled = (__runInitializers(this, _externalLink_extraInitializers), __runInitializers(this, _commentsEnabled_initializers, void 0));
        subCategoryId = (__runInitializers(this, _commentsEnabled_extraInitializers), __runInitializers(this, _subCategoryId_initializers, void 0));
        imageUrls = (__runInitializers(this, _subCategoryId_extraInitializers), __runInitializers(this, _imageUrls_initializers, void 0));
        constructor() {
            __runInitializers(this, _imageUrls_extraInitializers);
        }
    };
})();
exports.CreateEventDto = CreateEventDto;
//# sourceMappingURL=create-event.dto.js.map