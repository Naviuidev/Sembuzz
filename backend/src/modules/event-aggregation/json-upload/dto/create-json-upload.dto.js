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
exports.CreateJsonUploadDto = void 0;
const class_validator_1 = require("class-validator");
let CreateJsonUploadDto = (() => {
    let _fileName_decorators;
    let _fileName_initializers = [];
    let _fileName_extraInitializers = [];
    let _events_decorators;
    let _events_initializers = [];
    let _events_extraInitializers = [];
    return class CreateJsonUploadDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _fileName_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _events_decorators = [(0, class_validator_1.IsArray)()];
            __esDecorate(null, null, _fileName_decorators, { kind: "field", name: "fileName", static: false, private: false, access: { has: obj => "fileName" in obj, get: obj => obj.fileName, set: (obj, value) => { obj.fileName = value; } }, metadata: _metadata }, _fileName_initializers, _fileName_extraInitializers);
            __esDecorate(null, null, _events_decorators, { kind: "field", name: "events", static: false, private: false, access: { has: obj => "events" in obj, get: obj => obj.events, set: (obj, value) => { obj.events = value; } }, metadata: _metadata }, _events_initializers, _events_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        fileName = __runInitializers(this, _fileName_initializers, void 0);
        events = (__runInitializers(this, _fileName_extraInitializers), __runInitializers(this, _events_initializers, void 0));
        constructor() {
            __runInitializers(this, _events_extraInitializers);
        }
    };
})();
exports.CreateJsonUploadDto = CreateJsonUploadDto;
//# sourceMappingURL=create-json-upload.dto.js.map