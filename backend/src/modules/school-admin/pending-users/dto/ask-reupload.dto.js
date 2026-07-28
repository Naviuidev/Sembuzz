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
exports.AskReuploadDto = void 0;
const class_validator_1 = require("class-validator");
let AskReuploadDto = (() => {
    let _message_decorators;
    let _message_initializers = [];
    let _message_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    return class AskReuploadDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _message_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)({ message: 'Please provide a message to send to the student.' }), (0, class_validator_1.MinLength)(1, { message: 'Message cannot be empty.' })];
            _type_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.IsIn)(['reupload', 'additional'], { message: 'type must be reupload or additional' })];
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: obj => "message" in obj, get: obj => obj.message, set: (obj, value) => { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        message = __runInitializers(this, _message_initializers, void 0);
        type = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _type_initializers, void 0));
        constructor() {
            __runInitializers(this, _type_extraInitializers);
        }
    };
})();
exports.AskReuploadDto = AskReuploadDto;
//# sourceMappingURL=ask-reupload.dto.js.map