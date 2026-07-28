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
exports.ContactController = exports.ContactFormDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
let ContactFormDto = (() => {
    let _firstName_decorators;
    let _firstName_initializers = [];
    let _firstName_extraInitializers = [];
    let _lastName_decorators;
    let _lastName_initializers = [];
    let _lastName_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _intent_decorators;
    let _intent_initializers = [];
    let _intent_extraInitializers = [];
    let _message_decorators;
    let _message_initializers = [];
    let _message_extraInitializers = [];
    let _query_decorators;
    let _query_initializers = [];
    let _query_extraInitializers = [];
    return class ContactFormDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _firstName_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _lastName_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _email_decorators = [(0, class_validator_1.IsEmail)(), (0, class_validator_1.IsNotEmpty)()];
            _intent_decorators = [(0, class_validator_1.IsString)()];
            _message_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _query_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: obj => "firstName" in obj, get: obj => obj.firstName, set: (obj, value) => { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
            __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: obj => "lastName" in obj, get: obj => obj.lastName, set: (obj, value) => { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _intent_decorators, { kind: "field", name: "intent", static: false, private: false, access: { has: obj => "intent" in obj, get: obj => obj.intent, set: (obj, value) => { obj.intent = value; } }, metadata: _metadata }, _intent_initializers, _intent_extraInitializers);
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: obj => "message" in obj, get: obj => obj.message, set: (obj, value) => { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _query_decorators, { kind: "field", name: "query", static: false, private: false, access: { has: obj => "query" in obj, get: obj => obj.query, set: (obj, value) => { obj.query = value; } }, metadata: _metadata }, _query_initializers, _query_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        firstName = __runInitializers(this, _firstName_initializers, void 0);
        lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
        email = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _email_initializers, void 0));
        intent = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _intent_initializers, void 0));
        message = (__runInitializers(this, _intent_extraInitializers), __runInitializers(this, _message_initializers, void 0));
        query = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _query_initializers, void 0));
        constructor() {
            __runInitializers(this, _query_extraInitializers);
        }
    };
})();
exports.ContactFormDto = ContactFormDto;
let ContactController = (() => {
    let _classDecorators = [(0, common_1.Controller)('contact')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _submit_decorators;
    var ContactController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _submit_decorators = [(0, common_1.Post)()];
            __esDecorate(this, null, _submit_decorators, { kind: "method", name: "submit", static: false, private: false, access: { has: obj => "submit" in obj, get: obj => obj.submit }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ContactController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        contactService = __runInitializers(this, _instanceExtraInitializers);
        constructor(contactService) {
            this.contactService = contactService;
        }
        async submit(body) {
            try {
                await this.contactService.submit(body);
                return { success: true, message: 'Thank you for your message. We will get back to you soon.' };
            }
            catch (err) {
                if (err instanceof common_1.HttpException)
                    throw err;
                throw new common_1.HttpException({ message: err?.message || 'Failed to send your message. Please try again later.' }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    return ContactController = _classThis;
})();
exports.ContactController = ContactController;
//# sourceMappingURL=contact.controller.js.map