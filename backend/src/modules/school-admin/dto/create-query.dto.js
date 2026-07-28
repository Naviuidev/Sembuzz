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
exports.CreateQueryDto = void 0;
const class_validator_1 = require("class-validator");
let CreateQueryDto = (() => {
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _meetingType_decorators;
    let _meetingType_initializers = [];
    let _meetingType_extraInitializers = [];
    let _date_decorators;
    let _date_initializers = [];
    let _date_extraInitializers = [];
    let _timeSlot_decorators;
    let _timeSlot_initializers = [];
    let _timeSlot_extraInitializers = [];
    let _timeZone_decorators;
    let _timeZone_initializers = [];
    let _timeZone_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _customMessage_decorators;
    let _customMessage_initializers = [];
    let _customMessage_extraInitializers = [];
    let _attachmentUrl_decorators;
    let _attachmentUrl_initializers = [];
    let _attachmentUrl_extraInitializers = [];
    return class CreateQueryDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsIn)(['dev_support', 'features_not_working', 'schedule_meeting', 'custom_message'])];
            _meetingType_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsIn)(['google_meet', 'zoom'])];
            _date_decorators = [(0, class_validator_1.IsDateString)(), (0, class_validator_1.IsOptional)()];
            _timeSlot_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _timeZone_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _description_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _customMessage_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _attachmentUrl_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _meetingType_decorators, { kind: "field", name: "meetingType", static: false, private: false, access: { has: obj => "meetingType" in obj, get: obj => obj.meetingType, set: (obj, value) => { obj.meetingType = value; } }, metadata: _metadata }, _meetingType_initializers, _meetingType_extraInitializers);
            __esDecorate(null, null, _date_decorators, { kind: "field", name: "date", static: false, private: false, access: { has: obj => "date" in obj, get: obj => obj.date, set: (obj, value) => { obj.date = value; } }, metadata: _metadata }, _date_initializers, _date_extraInitializers);
            __esDecorate(null, null, _timeSlot_decorators, { kind: "field", name: "timeSlot", static: false, private: false, access: { has: obj => "timeSlot" in obj, get: obj => obj.timeSlot, set: (obj, value) => { obj.timeSlot = value; } }, metadata: _metadata }, _timeSlot_initializers, _timeSlot_extraInitializers);
            __esDecorate(null, null, _timeZone_decorators, { kind: "field", name: "timeZone", static: false, private: false, access: { has: obj => "timeZone" in obj, get: obj => obj.timeZone, set: (obj, value) => { obj.timeZone = value; } }, metadata: _metadata }, _timeZone_initializers, _timeZone_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _customMessage_decorators, { kind: "field", name: "customMessage", static: false, private: false, access: { has: obj => "customMessage" in obj, get: obj => obj.customMessage, set: (obj, value) => { obj.customMessage = value; } }, metadata: _metadata }, _customMessage_initializers, _customMessage_extraInitializers);
            __esDecorate(null, null, _attachmentUrl_decorators, { kind: "field", name: "attachmentUrl", static: false, private: false, access: { has: obj => "attachmentUrl" in obj, get: obj => obj.attachmentUrl, set: (obj, value) => { obj.attachmentUrl = value; } }, metadata: _metadata }, _attachmentUrl_initializers, _attachmentUrl_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        type = __runInitializers(this, _type_initializers, void 0);
        meetingType = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _meetingType_initializers, void 0));
        date = (__runInitializers(this, _meetingType_extraInitializers), __runInitializers(this, _date_initializers, void 0));
        timeSlot = (__runInitializers(this, _date_extraInitializers), __runInitializers(this, _timeSlot_initializers, void 0));
        timeZone = (__runInitializers(this, _timeSlot_extraInitializers), __runInitializers(this, _timeZone_initializers, void 0));
        description = (__runInitializers(this, _timeZone_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        /** Custom message text (for type custom_message). Stored in description. */
        customMessage = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _customMessage_initializers, void 0));
        /** Optional document attachment URL */
        attachmentUrl = (__runInitializers(this, _customMessage_extraInitializers), __runInitializers(this, _attachmentUrl_initializers, void 0));
        constructor() {
            __runInitializers(this, _attachmentUrl_extraInitializers);
        }
    };
})();
exports.CreateQueryDto = CreateQueryDto;
//# sourceMappingURL=create-query.dto.js.map