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
exports.ScrapedEventsAdminController = void 0;
const common_1 = require("@nestjs/common");
const super_admin_guard_1 = require("../../super-admin/guards/super-admin.guard");
let ScrapedEventsAdminController = (() => {
    let _classDecorators = [(0, common_1.Controller)('super-admin/event-sync/events'), (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _list_decorators;
    let _upcoming_decorators;
    let _month_decorators;
    let _one_decorators;
    var ScrapedEventsAdminController = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _list_decorators = [(0, common_1.Get)()];
            _upcoming_decorators = [(0, common_1.Get)('upcoming')];
            _month_decorators = [(0, common_1.Get)('month')];
            _one_decorators = [(0, common_1.Get)(':id')];
            __esDecorate(this, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: obj => "list" in obj, get: obj => obj.list }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _upcoming_decorators, { kind: "method", name: "upcoming", static: false, private: false, access: { has: obj => "upcoming" in obj, get: obj => obj.upcoming }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _month_decorators, { kind: "method", name: "month", static: false, private: false, access: { has: obj => "month" in obj, get: obj => obj.month }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _one_decorators, { kind: "method", name: "one", static: false, private: false, access: { has: obj => "one" in obj, get: obj => obj.one }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ScrapedEventsAdminController = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        events = __runInitializers(this, _instanceExtraInitializers);
        constructor(events) {
            this.events = events;
        }
        async list(page, pageSize, category, sourceId, sort, order) {
            const s = sort === 'title' || sort === 'createdAt' ? sort : 'startDate';
            const o = order === 'desc' ? 'desc' : 'asc';
            return this.events.list({
                page: page ? Number(page) : undefined,
                pageSize: pageSize ? Number(pageSize) : undefined,
                category,
                sourceId,
                sort: s,
                order: o,
            });
        }
        async upcoming(page, pageSize) {
            return this.events.upcoming({
                page: page ? Number(page) : undefined,
                pageSize: pageSize ? Number(pageSize) : undefined,
            });
        }
        async month(yearStr, monthStr, page, pageSize) {
            const year = yearStr ? Number(yearStr) : NaN;
            const month = monthStr ? Number(monthStr) : NaN;
            if (!Number.isFinite(year) || !Number.isFinite(month)) {
                throw new common_1.BadRequestException('Query params year and month are required');
            }
            return this.events.byMonth(year, month, {
                page: page ? Number(page) : undefined,
                pageSize: pageSize ? Number(pageSize) : undefined,
            });
        }
        async one(id) {
            return this.events.getById(id);
        }
    };
    return ScrapedEventsAdminController = _classThis;
})();
exports.ScrapedEventsAdminController = ScrapedEventsAdminController;
//# sourceMappingURL=scraped-events-admin.controller.js.map