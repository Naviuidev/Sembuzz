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
exports.CreateBlogDto = void 0;
const class_validator_1 = require("class-validator");
let CreateBlogDto = (() => {
    let _subCategoryId_decorators;
    let _subCategoryId_initializers = [];
    let _subCategoryId_extraInitializers = [];
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _content_decorators;
    let _content_initializers = [];
    let _content_extraInitializers = [];
    let _coverImageUrl_decorators;
    let _coverImageUrl_initializers = [];
    let _coverImageUrl_extraInitializers = [];
    let _imageUrls_decorators;
    let _imageUrls_initializers = [];
    let _imageUrls_extraInitializers = [];
    let _heroTitle_decorators;
    let _heroTitle_initializers = [];
    let _heroTitle_extraInitializers = [];
    let _heroParagraph_decorators;
    let _heroParagraph_initializers = [];
    let _heroParagraph_extraInitializers = [];
    let _heroButtonText_decorators;
    let _heroButtonText_initializers = [];
    let _heroButtonText_extraInitializers = [];
    let _heroButtonLink_decorators;
    let _heroButtonLink_initializers = [];
    let _heroButtonLink_extraInitializers = [];
    let _contentBlocks_decorators;
    let _contentBlocks_initializers = [];
    let _contentBlocks_extraInitializers = [];
    return class CreateBlogDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _subCategoryId_decorators = [(0, class_validator_1.IsUUID)()];
            _title_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1), (0, class_validator_1.MaxLength)(500)];
            _content_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(100000)];
            _coverImageUrl_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(2048)];
            _imageUrls_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true })];
            _heroTitle_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(300)];
            _heroParagraph_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _heroButtonText_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(120)];
            _heroButtonLink_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(2048)];
            _contentBlocks_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.Allow)()];
            __esDecorate(null, null, _subCategoryId_decorators, { kind: "field", name: "subCategoryId", static: false, private: false, access: { has: obj => "subCategoryId" in obj, get: obj => obj.subCategoryId, set: (obj, value) => { obj.subCategoryId = value; } }, metadata: _metadata }, _subCategoryId_initializers, _subCategoryId_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _content_decorators, { kind: "field", name: "content", static: false, private: false, access: { has: obj => "content" in obj, get: obj => obj.content, set: (obj, value) => { obj.content = value; } }, metadata: _metadata }, _content_initializers, _content_extraInitializers);
            __esDecorate(null, null, _coverImageUrl_decorators, { kind: "field", name: "coverImageUrl", static: false, private: false, access: { has: obj => "coverImageUrl" in obj, get: obj => obj.coverImageUrl, set: (obj, value) => { obj.coverImageUrl = value; } }, metadata: _metadata }, _coverImageUrl_initializers, _coverImageUrl_extraInitializers);
            __esDecorate(null, null, _imageUrls_decorators, { kind: "field", name: "imageUrls", static: false, private: false, access: { has: obj => "imageUrls" in obj, get: obj => obj.imageUrls, set: (obj, value) => { obj.imageUrls = value; } }, metadata: _metadata }, _imageUrls_initializers, _imageUrls_extraInitializers);
            __esDecorate(null, null, _heroTitle_decorators, { kind: "field", name: "heroTitle", static: false, private: false, access: { has: obj => "heroTitle" in obj, get: obj => obj.heroTitle, set: (obj, value) => { obj.heroTitle = value; } }, metadata: _metadata }, _heroTitle_initializers, _heroTitle_extraInitializers);
            __esDecorate(null, null, _heroParagraph_decorators, { kind: "field", name: "heroParagraph", static: false, private: false, access: { has: obj => "heroParagraph" in obj, get: obj => obj.heroParagraph, set: (obj, value) => { obj.heroParagraph = value; } }, metadata: _metadata }, _heroParagraph_initializers, _heroParagraph_extraInitializers);
            __esDecorate(null, null, _heroButtonText_decorators, { kind: "field", name: "heroButtonText", static: false, private: false, access: { has: obj => "heroButtonText" in obj, get: obj => obj.heroButtonText, set: (obj, value) => { obj.heroButtonText = value; } }, metadata: _metadata }, _heroButtonText_initializers, _heroButtonText_extraInitializers);
            __esDecorate(null, null, _heroButtonLink_decorators, { kind: "field", name: "heroButtonLink", static: false, private: false, access: { has: obj => "heroButtonLink" in obj, get: obj => obj.heroButtonLink, set: (obj, value) => { obj.heroButtonLink = value; } }, metadata: _metadata }, _heroButtonLink_initializers, _heroButtonLink_extraInitializers);
            __esDecorate(null, null, _contentBlocks_decorators, { kind: "field", name: "contentBlocks", static: false, private: false, access: { has: obj => "contentBlocks" in obj, get: obj => obj.contentBlocks, set: (obj, value) => { obj.contentBlocks = value; } }, metadata: _metadata }, _contentBlocks_initializers, _contentBlocks_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        subCategoryId = __runInitializers(this, _subCategoryId_initializers, void 0);
        title = (__runInitializers(this, _subCategoryId_extraInitializers), __runInitializers(this, _title_initializers, void 0));
        /** Plain text for listings / search; optional if contentBlocks carry text. */
        content = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _content_initializers, void 0));
        coverImageUrl = (__runInitializers(this, _content_extraInitializers), __runInitializers(this, _coverImageUrl_initializers, void 0));
        imageUrls = (__runInitializers(this, _coverImageUrl_extraInitializers), __runInitializers(this, _imageUrls_initializers, void 0));
        heroTitle = (__runInitializers(this, _imageUrls_extraInitializers), __runInitializers(this, _heroTitle_initializers, void 0));
        heroParagraph = (__runInitializers(this, _heroTitle_extraInitializers), __runInitializers(this, _heroParagraph_initializers, void 0));
        heroButtonText = (__runInitializers(this, _heroParagraph_extraInitializers), __runInitializers(this, _heroButtonText_initializers, void 0));
        heroButtonLink = (__runInitializers(this, _heroButtonText_extraInitializers), __runInitializers(this, _heroButtonLink_initializers, void 0));
        /** Raw JSON array; validated in service (avoids strict pipe issues). */
        contentBlocks = (__runInitializers(this, _heroButtonLink_extraInitializers), __runInitializers(this, _contentBlocks_initializers, void 0));
        constructor() {
            __runInitializers(this, _contentBlocks_extraInitializers);
        }
    };
})();
exports.CreateBlogDto = CreateBlogDto;
//# sourceMappingURL=create-blog.dto.js.map