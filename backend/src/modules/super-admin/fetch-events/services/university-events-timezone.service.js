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
exports.UniversityEventsTimezoneService = void 0;
exports.prismaMonthOverlapWhereInput = prismaMonthOverlapWhereInput;
exports.universityEventSpansOutsideIngestionMonth = universityEventSpansOutsideIngestionMonth;
exports.universityEventRangeOverlapsWindow = universityEventRangeOverlapsWindow;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
/**
 * Inclusive calendar-day overlap in `win.timeZone` between the event's [startDate … endDate]
 * and the sync window [firstDayInclusive … lastDayInclusive].
 * If `endDate` is missing, the event is treated as a single local day at `startDate`.
 */
/**
 * Prisma filter: event local date range overlaps [firstDayInclusive … lastDayInclusive].
 * Use for public "All" listings (current calendar month + multi-month spans).
 */
/** Prisma `where` for events whose local date range overlaps the sync month (UTC bounds). */
function prismaMonthOverlapWhereInput(win) {
    return {
        startDate: { not: null },
        AND: [
            { startDate: { lt: win.endExclusiveUtc } },
            {
                OR: [
                    {
                        AND: [{ endDate: { not: null } }, { endDate: { gte: win.startUtc } }],
                    },
                    {
                        AND: [
                            { endDate: null },
                            { startDate: { gte: win.startUtc } },
                            { startDate: { lt: win.endExclusiveUtc } },
                        ],
                    },
                ],
            },
        ],
    };
}
/** True when the event runs before or after the sync/listing month (multi-month / long-running). */
function universityEventSpansOutsideIngestionMonth(startDate, endDate, win) {
    if (!startDate || Number.isNaN(startDate.getTime()))
        return false;
    const tz = win.timeZone;
    const winStart = luxon_1.DateTime.fromISO(win.firstDayInclusive, { zone: tz }).startOf('day');
    const winEnd = luxon_1.DateTime.fromISO(win.lastDayInclusive, { zone: tz }).endOf('day');
    const evStart = luxon_1.DateTime.fromJSDate(startDate, { zone: 'utc' }).setZone(tz).startOf('day');
    const evEnd = endDate != null && !Number.isNaN(new Date(endDate).getTime())
        ? luxon_1.DateTime.fromJSDate(new Date(endDate), { zone: 'utc' }).setZone(tz).endOf('day')
        : evStart.endOf('day');
    return evStart < winStart || evEnd > winEnd;
}
function universityEventRangeOverlapsWindow(startDate, endDate, win) {
    if (!startDate || Number.isNaN(startDate.getTime()))
        return false;
    const tz = win.timeZone;
    const winStart = luxon_1.DateTime.fromISO(win.firstDayInclusive, { zone: tz }).startOf('day');
    const winEnd = luxon_1.DateTime.fromISO(win.lastDayInclusive, { zone: tz }).endOf('day');
    const evStart = luxon_1.DateTime.fromJSDate(startDate, { zone: 'utc' }).setZone(tz).startOf('day');
    const evEnd = endDate != null && !Number.isNaN(new Date(endDate).getTime())
        ? luxon_1.DateTime.fromJSDate(new Date(endDate), { zone: 'utc' }).setZone(tz).endOf('day')
        : luxon_1.DateTime.fromJSDate(startDate, { zone: 'utc' }).setZone(tz).endOf('day');
    if (evEnd < evStart)
        return false;
    return evStart <= winEnd && evEnd >= winStart;
}
let UniversityEventsTimezoneService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UniversityEventsTimezoneService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UniversityEventsTimezoneService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        config;
        constructor(config) {
            this.config = config;
        }
        /** Default US Eastern (handles EST/EDT). Override with UNIVERSITY_EVENTS_TIMEZONE. */
        getIanaTimeZone() {
            const z = this.config.get('UNIVERSITY_EVENTS_TIMEZONE')?.trim();
            if (z && z.length > 0)
                return z;
            return 'America/New_York';
        }
        /** Today's date YYYY-MM-DD in the ingestion time zone. */
        getTodayLocalIsoDate(now = new Date()) {
            const timeZone = this.getIanaTimeZone();
            return luxon_1.DateTime.fromJSDate(now, { zone: 'utc' }).setZone(timeZone).toISODate();
        }
        /**
         * Default university sync window: the full **calendar month** containing `now` in
         * `UNIVERSITY_EVENTS_TIMEZONE` (e.g. May 1–May 31 local). Persist only events whose
         * **date range** (startDate … endDate, inclusive local days) **overlaps** that month
         * (e.g. March–June includes May).
         */
        getCurrentCalendarMonthWindow(now = new Date()) {
            const timeZone = this.getIanaTimeZone();
            const zonedNow = luxon_1.DateTime.fromJSDate(now, { zone: 'utc' }).setZone(timeZone);
            const monthStart = zonedNow.startOf('month').startOf('day');
            const nextMonthStart = monthStart.plus({ months: 1 });
            const startUtc = monthStart.toUTC().toJSDate();
            const endExclusiveUtc = nextMonthStart.toUTC().toJSDate();
            const firstDayInclusive = monthStart.toISODate();
            const lastDayInclusive = nextMonthStart.minus({ days: 1 }).toISODate();
            const dim = zonedNow.daysInMonth ?? 31;
            return {
                timeZone,
                firstDayInclusive,
                lastDayInclusive,
                horizonDays: dim,
                startUtc,
                endExclusiveUtc,
                currentMonthEndInclusive: lastDayInclusive,
                computedAtIso: now.toISOString(),
            };
        }
        /**
         * Interpret `localYmd` as a calendar day in the ingestion time zone; return UTC half-open bounds
         * suitable for Prisma `startDate` filters.
         */
        getUtcBoundsForLocalCalendarDay(localYmd) {
            const timeZone = this.getIanaTimeZone();
            const startLocal = luxon_1.DateTime.fromISO(localYmd.slice(0, 10), { zone: timeZone }).startOf('day');
            if (!startLocal.isValid)
                return null;
            const endExclusiveLocal = startLocal.plus({ days: 1 });
            return {
                startUtc: startLocal.toUTC().toJSDate(),
                endExclusiveUtc: endExclusiveLocal.toUTC().toJSDate(),
            };
        }
    };
    return UniversityEventsTimezoneService = _classThis;
})();
exports.UniversityEventsTimezoneService = UniversityEventsTimezoneService;
//# sourceMappingURL=university-events-timezone.service.js.map