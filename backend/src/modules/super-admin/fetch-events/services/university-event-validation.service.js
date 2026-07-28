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
exports.UniversityEventValidationService = void 0;
const common_1 = require("@nestjs/common");
const university_events_timezone_service_1 = require("./university-events-timezone.service");
let UniversityEventValidationService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UniversityEventValidationService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UniversityEventValidationService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /**
         * Heuristic 0–100 score for QA dashboards. GPT may adjust slightly in payload;
         * we merge with Math.round((local + model) / 2) when model provides qaScore.
         */
        computeLocalConfidence(ev, seedUrl) {
            let s = 0;
            if (ev.title && ev.title.length >= 4)
                s += 22;
            if (ev.startDate)
                s += 28;
            if (ev.detailUrl && this.isLikelyValidHttpUrl(ev.detailUrl))
                s += 22;
            if (ev.detailUrl && this.isSameSiteOrSubdomain(seedUrl, ev.detailUrl))
                s += 8;
            if (ev.imageUrl && this.isLikelyValidHttpUrl(ev.imageUrl))
                s += 12;
            if (ev.venue && ev.venue.length > 2)
                s += 8;
            if (ev.rawDateText && ev.rawDateText.length > 2)
                s += 4;
            return Math.min(100, s);
        }
        mergeConfidence(local, modelQa) {
            if (modelQa == null || !Number.isFinite(modelQa))
                return local;
            const m = Math.max(0, Math.min(100, Math.round(modelQa)));
            return Math.max(0, Math.min(100, Math.round((local + m) / 2)));
        }
        /**
         * Hard gate before DB write: event **range** must overlap the sync calendar month in `win.timeZone`.
         * Multi-month listings must set `endDate` so May appears inside a March–June range.
         */
        shouldPersist(ev, win, seedUrl) {
            if (!ev.title || ev.title.trim().length < 3)
                return { ok: false, reason: 'title' };
            if (!ev.detailUrl || !this.isLikelyValidHttpUrl(ev.detailUrl))
                return { ok: false, reason: 'detailUrl' };
            if (!ev.startDate)
                return { ok: false, reason: 'startDate' };
            const start = new Date(ev.startDate);
            if (Number.isNaN(start.getTime()))
                return { ok: false, reason: 'startDate_parse' };
            const end = ev.endDate ? new Date(ev.endDate) : null;
            if (ev.endDate) {
                if (end == null || Number.isNaN(end.getTime()))
                    return { ok: false, reason: 'endDate_parse' };
                if (end.getTime() < start.getTime())
                    return { ok: false, reason: 'end_before_start' };
            }
            if (!(0, university_events_timezone_service_1.universityEventRangeOverlapsWindow)(start, end, win)) {
                return { ok: false, reason: 'outside_window' };
            }
            if (!this.isSameSiteOrSubdomain(seedUrl, ev.detailUrl)) {
                return { ok: false, reason: 'detail_offsite' };
            }
            if (ev.imageUrl && !this.isLikelyValidHttpUrl(ev.imageUrl))
                return { ok: false, reason: 'imageUrl' };
            return { ok: true };
        }
        isLikelyValidHttpUrl(s) {
            try {
                const u = new URL(s);
                return u.protocol === 'https:' || u.protocol === 'http:';
            }
            catch {
                return false;
            }
        }
        isSameSiteOrSubdomain(seedUrl, targetUrl) {
            let a;
            let b;
            try {
                a = new URL(seedUrl).hostname.replace(/^www\./i, '').toLowerCase();
                b = new URL(targetUrl).hostname.replace(/^www\./i, '').toLowerCase();
            }
            catch {
                return false;
            }
            return b === a || b.endsWith(`.${a}`);
        }
    };
    return UniversityEventValidationService = _classThis;
})();
exports.UniversityEventValidationService = UniversityEventValidationService;
//# sourceMappingURL=university-event-validation.service.js.map