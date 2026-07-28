"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchEventsPublicController = void 0;
const common_1 = require("@nestjs/common");
/**
 * Public endpoints for the University Event Aggregator.
 * No authentication: these power the /universities tab on the public events page.
 */
let FetchEventsPublicController = (() => {
    let _classDecorators = [(0, common_1.Controller)('public/universities')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _listUniversities_decorators;
    let _getUniversity_decorators;
    let _listEvents_decorators;
    var FetchEventsPublicController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _listUniversities_decorators = [(0, common_1.Get)()];
            _getUniversity_decorators = [(0, common_1.Get)(':id')];
            _listEvents_decorators = [(0, common_1.Get)(':id/events')];
            __esDecorate(this, null, _listUniversities_decorators, { kind: "method", name: "listUniversities", static: false, private: false, access: { has: obj => "listUniversities" in obj, get: obj => obj.listUniversities }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getUniversity_decorators, { kind: "method", name: "getUniversity", static: false, private: false, access: { has: obj => "getUniversity" in obj, get: obj => obj.getUniversity }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _listEvents_decorators, { kind: "method", name: "listEvents", static: false, private: false, access: { has: obj => "listEvents" in obj, get: obj => obj.listEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FetchEventsPublicController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        service = __runInitializers(this, _instanceExtraInitializers);
        constructor(service) {
            this.service = service;
        }
        async listUniversities() {
            return this.service.listPublicUniversities();
        }
        async getUniversity(id) {
            return this.service.getPublicUniversity(id);
        }
        async listEvents(id, search, category, upcoming, latest, trending, dateUtc, sort, order, page, pageSize) {
            return this.service.listEvents({
                sourceId: id,
                search,
                category,
                upcoming: upcoming === '1' || upcoming === 'true',
                latest: latest === '1' || latest === 'true',
                trending: trending === '1' || trending === 'true',
                onDateUtc: dateUtc?.trim() || undefined,
                sort: sort || undefined,
                order: order || undefined,
                page: page ? Number(page) : undefined,
                pageSize: pageSize ? Number(pageSize) : undefined,
            });
        }
    };
    return FetchEventsPublicController = _classThis;
})();
exports.FetchEventsPublicController = FetchEventsPublicController;
//# sourceMappingURL=fetch-events-public.controller.js.map