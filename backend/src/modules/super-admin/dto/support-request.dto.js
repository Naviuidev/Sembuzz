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
exports.SupportRequestDto = exports.TimeZone = exports.MeetingType = exports.SupportRequestType = void 0;
const class_validator_1 = require("class-validator");
var SupportRequestType;
(function (SupportRequestType) {
    SupportRequestType["RAISE_ISSUE"] = "raise_issue";
    SupportRequestType["INTEGRATE_FEATURE"] = "integrate_feature";
    SupportRequestType["UI_CHANGE"] = "ui_change";
    SupportRequestType["UPSCALE_PLATFORM"] = "upscale_platform";
    SupportRequestType["CUSTOM_MESSAGE"] = "custom_message";
    SupportRequestType["SCHEDULE_MEETING"] = "schedule_meeting";
})(SupportRequestType || (exports.SupportRequestType = SupportRequestType = {}));
var MeetingType;
(function (MeetingType) {
    MeetingType["GOOGLE_MEET"] = "google_meet";
    MeetingType["ZOOM"] = "zoom";
})(MeetingType || (exports.MeetingType = MeetingType = {}));
var TimeZone;
(function (TimeZone) {
    TimeZone["US"] = "US";
    TimeZone["INDIA"] = "India";
})(TimeZone || (exports.TimeZone = TimeZone = {}));
let SupportRequestDto = (() => {
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _meetingType_decorators;
    let _meetingType_initializers = [];
    let _meetingType_extraInitializers = [];
    let _meetingDate_decorators;
    let _meetingDate_initializers = [];
    let _meetingDate_extraInitializers = [];
    let _timeZone_decorators;
    let _timeZone_initializers = [];
    let _timeZone_extraInitializers = [];
    let _timeSlot_decorators;
    let _timeSlot_initializers = [];
    let _timeSlot_extraInitializers = [];
    let _customMessage_decorators;
    let _customMessage_initializers = [];
    let _customMessage_extraInitializers = [];
    return class SupportRequestDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsIn)(Object.values(SupportRequestType))];
            _description_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _meetingType_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.IsIn)(Object.values(MeetingType))];
            _meetingDate_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            _timeZone_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.IsIn)(Object.values(TimeZone))];
            _timeSlot_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _customMessage_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _meetingType_decorators, { kind: "field", name: "meetingType", static: false, private: false, access: { has: obj => "meetingType" in obj, get: obj => obj.meetingType, set: (obj, value) => { obj.meetingType = value; } }, metadata: _metadata }, _meetingType_initializers, _meetingType_extraInitializers);
            __esDecorate(null, null, _meetingDate_decorators, { kind: "field", name: "meetingDate", static: false, private: false, access: { has: obj => "meetingDate" in obj, get: obj => obj.meetingDate, set: (obj, value) => { obj.meetingDate = value; } }, metadata: _metadata }, _meetingDate_initializers, _meetingDate_extraInitializers);
            __esDecorate(null, null, _timeZone_decorators, { kind: "field", name: "timeZone", static: false, private: false, access: { has: obj => "timeZone" in obj, get: obj => obj.timeZone, set: (obj, value) => { obj.timeZone = value; } }, metadata: _metadata }, _timeZone_initializers, _timeZone_extraInitializers);
            __esDecorate(null, null, _timeSlot_decorators, { kind: "field", name: "timeSlot", static: false, private: false, access: { has: obj => "timeSlot" in obj, get: obj => obj.timeSlot, set: (obj, value) => { obj.timeSlot = value; } }, metadata: _metadata }, _timeSlot_initializers, _timeSlot_extraInitializers);
            __esDecorate(null, null, _customMessage_decorators, { kind: "field", name: "customMessage", static: false, private: false, access: { has: obj => "customMessage" in obj, get: obj => obj.customMessage, set: (obj, value) => { obj.customMessage = value; } }, metadata: _metadata }, _customMessage_initializers, _customMessage_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        type = __runInitializers(this, _type_initializers, void 0);
        description = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _description_initializers, void 0));
        meetingType = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _meetingType_initializers, void 0));
        meetingDate = (__runInitializers(this, _meetingType_extraInitializers), __runInitializers(this, _meetingDate_initializers, void 0));
        timeZone = (__runInitializers(this, _meetingDate_extraInitializers), __runInitializers(this, _timeZone_initializers, void 0));
        timeSlot = (__runInitializers(this, _timeZone_extraInitializers), __runInitializers(this, _timeSlot_initializers, void 0));
        customMessage = (__runInitializers(this, _timeSlot_extraInitializers), __runInitializers(this, _customMessage_initializers, void 0));
        constructor() {
            __runInitializers(this, _customMessage_extraInitializers);
        }
    };
})();
exports.SupportRequestDto = SupportRequestDto;
//# sourceMappingURL=support-request.dto.js.map