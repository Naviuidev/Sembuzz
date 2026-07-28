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
exports.CreateSchoolDto = void 0;
const class_validator_1 = require("class-validator");
let CreateSchoolDto = (() => {
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
    let _domain_decorators;
    let _domain_initializers = [];
    let _domain_extraInitializers = [];
    let _image_decorators;
    let _image_initializers = [];
    let _image_extraInitializers = [];
    let _selectedFeatures_decorators;
    let _selectedFeatures_initializers = [];
    let _selectedFeatures_extraInitializers = [];
    let _adminEmail_decorators;
    let _adminEmail_initializers = [];
    let _adminEmail_extraInitializers = [];
    let _adsAdminEmail_decorators;
    let _adsAdminEmail_initializers = [];
    let _adsAdminEmail_extraInitializers = [];
    let _tenure_decorators;
    let _tenure_initializers = [];
    let _tenure_extraInitializers = [];
    return class CreateSchoolDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _schoolName_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _country_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _state_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _city_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _domain_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.Matches)(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, {
                    message: 'Domain must be a valid domain name (e.g., school.edu)',
                })];
            _image_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _selectedFeatures_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.ArrayMinSize)(1), (0, class_validator_1.IsString)({ each: true })];
            _adminEmail_decorators = [(0, class_validator_1.IsEmail)(), (0, class_validator_1.IsNotEmpty)()];
            _adsAdminEmail_decorators = [(0, class_validator_1.ValidateIf)((o) => (o.adsAdminEmail ?? '') !== ''), (0, class_validator_1.IsEmail)({}, { message: 'Ads Admin email must be a valid email when provided.' }), (0, class_validator_1.IsOptional)()];
            _tenure_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _schoolName_decorators, { kind: "field", name: "schoolName", static: false, private: false, access: { has: obj => "schoolName" in obj, get: obj => obj.schoolName, set: (obj, value) => { obj.schoolName = value; } }, metadata: _metadata }, _schoolName_initializers, _schoolName_extraInitializers);
            __esDecorate(null, null, _country_decorators, { kind: "field", name: "country", static: false, private: false, access: { has: obj => "country" in obj, get: obj => obj.country, set: (obj, value) => { obj.country = value; } }, metadata: _metadata }, _country_initializers, _country_extraInitializers);
            __esDecorate(null, null, _state_decorators, { kind: "field", name: "state", static: false, private: false, access: { has: obj => "state" in obj, get: obj => obj.state, set: (obj, value) => { obj.state = value; } }, metadata: _metadata }, _state_initializers, _state_extraInitializers);
            __esDecorate(null, null, _city_decorators, { kind: "field", name: "city", static: false, private: false, access: { has: obj => "city" in obj, get: obj => obj.city, set: (obj, value) => { obj.city = value; } }, metadata: _metadata }, _city_initializers, _city_extraInitializers);
            __esDecorate(null, null, _domain_decorators, { kind: "field", name: "domain", static: false, private: false, access: { has: obj => "domain" in obj, get: obj => obj.domain, set: (obj, value) => { obj.domain = value; } }, metadata: _metadata }, _domain_initializers, _domain_extraInitializers);
            __esDecorate(null, null, _image_decorators, { kind: "field", name: "image", static: false, private: false, access: { has: obj => "image" in obj, get: obj => obj.image, set: (obj, value) => { obj.image = value; } }, metadata: _metadata }, _image_initializers, _image_extraInitializers);
            __esDecorate(null, null, _selectedFeatures_decorators, { kind: "field", name: "selectedFeatures", static: false, private: false, access: { has: obj => "selectedFeatures" in obj, get: obj => obj.selectedFeatures, set: (obj, value) => { obj.selectedFeatures = value; } }, metadata: _metadata }, _selectedFeatures_initializers, _selectedFeatures_extraInitializers);
            __esDecorate(null, null, _adminEmail_decorators, { kind: "field", name: "adminEmail", static: false, private: false, access: { has: obj => "adminEmail" in obj, get: obj => obj.adminEmail, set: (obj, value) => { obj.adminEmail = value; } }, metadata: _metadata }, _adminEmail_initializers, _adminEmail_extraInitializers);
            __esDecorate(null, null, _adsAdminEmail_decorators, { kind: "field", name: "adsAdminEmail", static: false, private: false, access: { has: obj => "adsAdminEmail" in obj, get: obj => obj.adsAdminEmail, set: (obj, value) => { obj.adsAdminEmail = value; } }, metadata: _metadata }, _adsAdminEmail_initializers, _adsAdminEmail_extraInitializers);
            __esDecorate(null, null, _tenure_decorators, { kind: "field", name: "tenure", static: false, private: false, access: { has: obj => "tenure" in obj, get: obj => obj.tenure, set: (obj, value) => { obj.tenure = value; } }, metadata: _metadata }, _tenure_initializers, _tenure_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        schoolName = __runInitializers(this, _schoolName_initializers, void 0);
        country = (__runInitializers(this, _schoolName_extraInitializers), __runInitializers(this, _country_initializers, void 0));
        state = (__runInitializers(this, _country_extraInitializers), __runInitializers(this, _state_initializers, void 0)); // Required only for US
        city = (__runInitializers(this, _state_extraInitializers), __runInitializers(this, _city_initializers, void 0));
        domain = (__runInitializers(this, _city_extraInitializers), __runInitializers(this, _domain_initializers, void 0));
        image = (__runInitializers(this, _domain_extraInitializers), __runInitializers(this, _image_initializers, void 0)); // URL or base64 string for image
        selectedFeatures = (__runInitializers(this, _image_extraInitializers), __runInitializers(this, _selectedFeatures_initializers, void 0)); // feature codes or IDs
        adminEmail = (__runInitializers(this, _selectedFeatures_extraInitializers), __runInitializers(this, _adminEmail_initializers, void 0));
        /** Required only when "ADS" is in selectedFeatures. Email for the Ads Admin (manages banner/sponsored ads). */
        adsAdminEmail = (__runInitializers(this, _adminEmail_extraInitializers), __runInitializers(this, _adsAdminEmail_initializers, void 0));
        tenure = (__runInitializers(this, _adsAdminEmail_extraInitializers), __runInitializers(this, _tenure_initializers, void 0)); // Tenure in months
        constructor() {
            __runInitializers(this, _tenure_extraInitializers);
        }
    };
})();
exports.CreateSchoolDto = CreateSchoolDto;
//# sourceMappingURL=create-school.dto.js.map