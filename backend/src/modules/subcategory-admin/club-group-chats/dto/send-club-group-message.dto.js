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
exports.SubCategoryAdminSendClubGroupMessageDto = void 0;
const class_validator_1 = require("class-validator");
let SubCategoryAdminSendClubGroupMessageDto = (() => {
    let _body_decorators;
    let _body_initializers = [];
    let _body_extraInitializers = [];
    let _attachmentUrl_decorators;
    let _attachmentUrl_initializers = [];
    let _attachmentUrl_extraInitializers = [];
    let _attachmentType_decorators;
    let _attachmentType_initializers = [];
    let _attachmentType_extraInitializers = [];
    let _attachmentName_decorators;
    let _attachmentName_initializers = [];
    let _attachmentName_extraInitializers = [];
    let _replyToMessageId_decorators;
    let _replyToMessageId_initializers = [];
    let _replyToMessageId_extraInitializers = [];
    return class SubCategoryAdminSendClubGroupMessageDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _body_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(2000)];
            _attachmentUrl_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(1000)];
            _attachmentType_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['image', 'pdf'])];
            _attachmentName_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(500)];
            _replyToMessageId_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUUID)()];
            __esDecorate(null, null, _body_decorators, { kind: "field", name: "body", static: false, private: false, access: { has: obj => "body" in obj, get: obj => obj.body, set: (obj, value) => { obj.body = value; } }, metadata: _metadata }, _body_initializers, _body_extraInitializers);
            __esDecorate(null, null, _attachmentUrl_decorators, { kind: "field", name: "attachmentUrl", static: false, private: false, access: { has: obj => "attachmentUrl" in obj, get: obj => obj.attachmentUrl, set: (obj, value) => { obj.attachmentUrl = value; } }, metadata: _metadata }, _attachmentUrl_initializers, _attachmentUrl_extraInitializers);
            __esDecorate(null, null, _attachmentType_decorators, { kind: "field", name: "attachmentType", static: false, private: false, access: { has: obj => "attachmentType" in obj, get: obj => obj.attachmentType, set: (obj, value) => { obj.attachmentType = value; } }, metadata: _metadata }, _attachmentType_initializers, _attachmentType_extraInitializers);
            __esDecorate(null, null, _attachmentName_decorators, { kind: "field", name: "attachmentName", static: false, private: false, access: { has: obj => "attachmentName" in obj, get: obj => obj.attachmentName, set: (obj, value) => { obj.attachmentName = value; } }, metadata: _metadata }, _attachmentName_initializers, _attachmentName_extraInitializers);
            __esDecorate(null, null, _replyToMessageId_decorators, { kind: "field", name: "replyToMessageId", static: false, private: false, access: { has: obj => "replyToMessageId" in obj, get: obj => obj.replyToMessageId, set: (obj, value) => { obj.replyToMessageId = value; } }, metadata: _metadata }, _replyToMessageId_initializers, _replyToMessageId_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        body = __runInitializers(this, _body_initializers, void 0);
        attachmentUrl = (__runInitializers(this, _body_extraInitializers), __runInitializers(this, _attachmentUrl_initializers, void 0));
        attachmentType = (__runInitializers(this, _attachmentUrl_extraInitializers), __runInitializers(this, _attachmentType_initializers, void 0));
        attachmentName = (__runInitializers(this, _attachmentType_extraInitializers), __runInitializers(this, _attachmentName_initializers, void 0));
        replyToMessageId = (__runInitializers(this, _attachmentName_extraInitializers), __runInitializers(this, _replyToMessageId_initializers, void 0));
        constructor() {
            __runInitializers(this, _replyToMessageId_extraInitializers);
        }
    };
})();
exports.SubCategoryAdminSendClubGroupMessageDto = SubCategoryAdminSendClubGroupMessageDto;
//# sourceMappingURL=send-club-group-message.dto.js.map