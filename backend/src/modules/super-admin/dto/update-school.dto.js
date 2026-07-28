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
exports.UpdateSchoolDto = void 0;
const class_validator_1 = require("class-validator");
let UpdateSchoolDto = (() => {
    let _schoolName_decorators;
    let _schoolName_initializers = [];
    let _schoolName_extraInitializers = [];
    let _country_decorators;
    let _country_initializers = [];
    let _country_extraInitializers = [];
    let _state_decorators;
    let _state_initializers = [];
    let _state_extraInitializers = [];
    let _city_decorators;
    let _city_initializers = [];
    let _city_extraInitializers = [];
    let _tenure_decorators;
    let _tenure_initializers = [];
    let _tenure_extraInitializers = [];
    let _selectedFeatures_decorators;
    let _selectedFeatures_initializers = [];
    let _selectedFeatures_extraInitializers = [];
    let _adminEmail_decorators;
    let _adminEmail_initializers = [];
    let _adminEmail_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    let _resetAdminPassword_decorators;
    let _resetAdminPassword_initializers = [];
    let _resetAdminPassword_extraInitializers = [];
    return class UpdateSchoolDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _schoolName_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _country_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _state_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _city_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _tenure_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _selectedFeatures_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsArray)(), (0, class_validator_1.IsString)({ each: true })];
            _adminEmail_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEmail)()];
            _isActive_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            _resetAdminPassword_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _schoolName_decorators, { kind: "field", name: "schoolName", static: false, private: false, access: { has: obj => "schoolName" in obj, get: obj => obj.schoolName, set: (obj, value) => { obj.schoolName = value; } }, metadata: _metadata }, _schoolName_initializers, _schoolName_extraInitializers);
            __esDecorate(null, null, _country_decorators, { kind: "field", name: "country", static: false, private: false, access: { has: obj => "country" in obj, get: obj => obj.country, set: (obj, value) => { obj.country = value; } }, metadata: _metadata }, _country_initializers, _country_extraInitializers);
            __esDecorate(null, null, _state_decorators, { kind: "field", name: "state", static: false, private: false, access: { has: obj => "state" in obj, get: obj => obj.state, set: (obj, value) => { obj.state = value; } }, metadata: _metadata }, _state_initializers, _state_extraInitializers);
            __esDecorate(null, null, _city_decorators, { kind: "field", name: "city", static: false, private: false, access: { has: obj => "city" in obj, get: obj => obj.city, set: (obj, value) => { obj.city = value; } }, metadata: _metadata }, _city_initializers, _city_extraInitializers);
            __esDecorate(null, null, _tenure_decorators, { kind: "field", name: "tenure", static: false, private: false, access: { has: obj => "tenure" in obj, get: obj => obj.tenure, set: (obj, value) => { obj.tenure = value; } }, metadata: _metadata }, _tenure_initializers, _tenure_extraInitializers);
            __esDecorate(null, null, _selectedFeatures_decorators, { kind: "field", name: "selectedFeatures", static: false, private: false, access: { has: obj => "selectedFeatures" in obj, get: obj => obj.selectedFeatures, set: (obj, value) => { obj.selectedFeatures = value; } }, metadata: _metadata }, _selectedFeatures_initializers, _selectedFeatures_extraInitializers);
            __esDecorate(null, null, _adminEmail_decorators, { kind: "field", name: "adminEmail", static: false, private: false, access: { has: obj => "adminEmail" in obj, get: obj => obj.adminEmail, set: (obj, value) => { obj.adminEmail = value; } }, metadata: _metadata }, _adminEmail_initializers, _adminEmail_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _resetAdminPassword_decorators, { kind: "field", name: "resetAdminPassword", static: false, private: false, access: { has: obj => "resetAdminPassword" in obj, get: obj => obj.resetAdminPassword, set: (obj, value) => { obj.resetAdminPassword = value; } }, metadata: _metadata }, _resetAdminPassword_initializers, _resetAdminPassword_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        schoolName = __runInitializers(this, _schoolName_initializers, void 0);
        country = (__runInitializers(this, _schoolName_extraInitializers), __runInitializers(this, _country_initializers, void 0));
        state = (__runInitializers(this, _country_extraInitializers), __runInitializers(this, _state_initializers, void 0));
        city = (__runInitializers(this, _state_extraInitializers), __runInitializers(this, _city_initializers, void 0));
        tenure = (__runInitializers(this, _city_extraInitializers), __runInitializers(this, _tenure_initializers, void 0));
        selectedFeatures = (__runInitializers(this, _tenure_extraInitializers), __runInitializers(this, _selectedFeatures_initializers, void 0));
        adminEmail = (__runInitializers(this, _selectedFeatures_extraInitializers), __runInitializers(this, _adminEmail_initializers, void 0));
        isActive = (__runInitializers(this, _adminEmail_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
        resetAdminPassword = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _resetAdminPassword_initializers, void 0));
        constructor() {
            __runInitializers(this, _resetAdminPassword_extraInitializers);
        }
    };
})();
exports.UpdateSchoolDto = UpdateSchoolDto;
//# sourceMappingURL=update-school.dto.js.map